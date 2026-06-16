import type { Env, AgentBriefing, ExtractedFact, UserContext, BriefingMode, ChatMessage, ChatOptions } from './types'
import { buildUserContext, fetchUserMemory, fetchUserLanguage, supabaseGet, supabasePost } from './context-builder'
import { buildPrompt, buildExtractionPrompt, EXTRACTABLE_KEYS, buildChatSystemPrompt } from './prompt-builder'

// Phase B: auto memory-write disabled — always returns [] and wastes a Gemini call.
// Re-enable in Phase C when wiring memory extraction to the chat/advisory endpoint.
const ENABLE_AUTO_MEMORY_WRITE = false

export default {
  // =============================================
  // Cron Trigger — هر روز ساعت ۶ UTC
  // =============================================
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runBriefingForAllUsers(env, 'cron'))
  },

  // =============================================
  // HTTP Trigger — POST /generate | POST /chat
  // =============================================
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, origin)
    }

    const { pathname } = new URL(request.url)

    if (pathname === '/chat') {
      return handleChat(request, env)
    }

    if (pathname === '/generate') {
      return handleGenerate(request, env)
    }

    return json({ error: 'Not found' }, 404, origin)
  },
}

// =============================================
// همه کاربرها رو briefing بده (cron)
// =============================================
async function runBriefingForAllUsers(env: Env, triggeredBy: 'cron' | 'user') {
  // همه user_idها رو بگیر
  const usersRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/user_settings?select=user_id,language`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  )

  if (!usersRes.ok) {
    console.error('Failed to fetch users')
    return
  }

  const users: Array<{ user_id: string }> = await usersRes.json()

  // برای هر کاربر موازی generate کن
  await Promise.allSettled(
    users.map(u => generateBriefing(u.user_id, env, triggeredBy))
  )
}

// =============================================
// برای یه کاربر briefing بساز و ذخیره کن
// =============================================
async function generateBriefing(
  userId: string,
  env: Env,
  triggeredBy: 'cron' | 'user' | 'alert',
  mode: BriefingMode = 'daily'
): Promise<AgentBriefing> {
  // ۱. داده‌ها رو جمع کن
  const context = await buildUserContext(userId, env, mode)

  // ۲. Prompt بساز
  const { system, user } = buildPrompt(context)
  console.log(`[Briefing] language=${context.language} mode=${mode} userId=${userId}`)

  // ۳. Gemini رو صدا بزن — weekly needs more tokens
  const maxOutputTokens = mode === 'weekly' ? 1500 : 1024
  const content = await callGemini(system, user, env, maxOutputTokens)

  // ۴. توی Supabase ذخیره کن
  await saveBriefing(userId, content, context.language, mode, context, triggeredBy, env)

  // ۵. حافظه بلندمدت — فعلاً غیرفعال است (Phase C)
  if (ENABLE_AUTO_MEMORY_WRITE) {
    await extractAndSaveMemory(userId, content, context, env).catch(err =>
      console.error('[Memory] Unexpected extraction error:', err)
    )
  }

  return { content, language: context.language, mode, context, triggered_by: triggeredBy }
}

// =============================================
// /generate handler
// =============================================
async function handleGenerate(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin') ?? ''

  const { userId, error: authError } = await requireAuth(request, env)
  if (authError || !userId) {
    return json({ error: authError ?? 'Unauthorized' }, 401, origin)
  }

  const url = new URL(request.url)
  const queryMode = url.searchParams.get('mode')
  let mode: BriefingMode = 'daily'
  if (queryMode === 'daily' || queryMode === 'weekly') {
    mode = queryMode
  } else {
    try {
      const body = await request.json() as { mode?: string }
      if (body.mode === 'daily' || body.mode === 'weekly') mode = body.mode
    } catch {
      // no body or invalid JSON — keep default 'daily'
    }
  }

  try {
    const briefing = await generateBriefing(userId, env, 'user', mode)
    return json({ success: true, briefing: briefing.content }, 200, origin)
  } catch (err) {
    console.error('Agent error:', err)
    return json({ error: 'Failed to generate briefing' }, 500, origin)
  }
}

// =============================================
// /chat handler
// =============================================
async function handleChat(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin') ?? ''

  const { userId, error: authError } = await requireAuth(request, env)
  if (authError || !userId) {
    return json({ error: authError ?? 'Unauthorized' }, 401, origin)
  }

  let message: string
  try {
    const body = await request.json() as { message?: unknown }
    const parsed = typeof body.message === 'string' ? body.message.trim() : ''
    if (parsed === '') {
      return json({ error: 'message must be a non-empty string' }, 400, origin)
    }
    message = parsed
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, origin)
  }

  try {
    const [language, memory] = await Promise.all([
      fetchUserLanguage(userId, env),
      fetchUserMemory(userId, env),
    ])

    // Last 20 messages, oldest first, to build the conversation history
    const historyRows = await supabaseGet<Array<{ role: string; content: string }>>(
      env,
      `agent_chat_messages?select=role,content&user_id=eq.${userId}&order=created_at.desc&limit=20`
    )
    const history: ChatMessage[] = historyRows
      .filter(r => r.role === 'user' || r.role === 'assistant')
      .map(r => ({ role: r.role as ChatMessage['role'], content: r.content }))
      .reverse()

    const system = buildChatSystemPrompt(language, memory)
    const fullHistory: ChatMessage[] = [...history, { role: 'user', content: message }]

    const reply = await callGeminiChat(system, fullHistory, env)

    // Persist both after a successful Gemini call so no orphaned turns are saved on error
    await supabasePost(env, 'agent_chat_messages', { user_id: userId, role: 'user', content: message })
    await supabasePost(env, 'agent_chat_messages', { user_id: userId, role: 'assistant', content: reply })

    console.log(`[Chat] userId=${userId} language=${language} history=${history.length} turns reply=${reply.length} chars`)

    return json({ reply }, 200, origin)
  } catch (err) {
    console.error('[Chat] Error:', err)
    return json({ error: 'Failed to generate reply' }, 500, origin)
  }
}

// =============================================
// Gemini API call
// =============================================
async function callGemini(system: string, user: string, env: Env, maxOutputTokens = 1024): Promise<string> {
  console.log('[Gemini] system prompt (first 300 chars):', system.slice(0, 300))
  console.log('[Gemini] user prompt (first 500 chars):', user.slice(0, 500))
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
        generationConfig: {
          maxOutputTokens,
          temperature: 0.7,
          // Disable thinking tokens — they count against maxOutputTokens in Gemini 2.5
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${err}`)
  }

  const data: any = await res.json()

  const candidate = data?.candidates?.[0]
  const finishReason = candidate?.finishReason ?? 'UNKNOWN'
  const text: string = candidate?.content?.parts?.[0]?.text ?? ''

  console.log('[Gemini] finishReason:', finishReason)
  console.log('[Gemini] text length:', text.length)
  console.log('[Gemini] full text:', text)

  if (!text) throw new Error(`No content from Gemini (finishReason: ${finishReason})`)
  return text.trim()
}

// =============================================
// Gemini multi-turn chat API call
// =============================================
async function callGeminiChat(
  system: string,
  history: ChatMessage[],
  env: Env,
  options: ChatOptions = {}
): Promise<string> {
  const maxOutputTokens = options.maxOutputTokens ?? 1024
  const temperature = options.temperature ?? 0.7

  // Gemini uses 'model' for the assistant role
  const contents = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))

  console.log('[Chat] sending', history.length, 'turns to Gemini')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          maxOutputTokens,
          temperature,
          // Disable thinking tokens — they count against maxOutputTokens in Gemini 2.5
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini Chat API error: ${err}`)
  }

  const data: any = await res.json()
  const candidate = data?.candidates?.[0]
  const finishReason: string = candidate?.finishReason ?? 'UNKNOWN'
  const text: string = candidate?.content?.parts?.[0]?.text ?? ''

  console.log('[Chat] finishReason:', finishReason, 'text length:', text.length)

  if (!text) throw new Error(`No content from Gemini chat (finishReason: ${finishReason})`)
  return text.trim()
}

// =============================================
// Supabase — briefing ذخیره کن
// =============================================
async function saveBriefing(
  userId: string,
  content: string,
  language: string,
  mode: string,
  context: any,
  triggeredBy: string,
  env: Env
) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/agent_briefings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      user_id: userId,
      content,
      language,
      mode,
      context,
      triggered_by: triggeredBy,
    }),
  })

  if (!res.ok) {
    console.error('Failed to save briefing:', await res.text())
  }
}

// =============================================
// Memory extraction — facts worth remembering
// =============================================
const EXTRACTABLE_KEY_SET = new Set<string>(EXTRACTABLE_KEYS)

async function extractAndSaveMemory(
  userId: string,
  briefing: string,
  ctx: UserContext,
  env: Env
): Promise<void> {
  const { system, user } = buildExtractionPrompt(briefing, ctx)

  let facts: ExtractedFact[] = []

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ parts: [{ text: user }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  key:   { type: 'STRING' },
                  value: { type: 'STRING' },
                },
                required: ['key', 'value'],
              },
            },
            maxOutputTokens: 512,
            temperature: 0.1,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    )

    if (!res.ok) {
      console.error('[Memory] Gemini extraction failed:', await res.text())
      return
    }

    const data: unknown = await res.json()
    const raw: string = (data as any)?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
    facts = JSON.parse(raw) as ExtractedFact[]
  } catch (err) {
    console.error('[Memory] Extraction parse error:', err)
    return
  }

  // Guard: only keep valid keys with non-empty string values
  const valid = facts.filter(
    f =>
      typeof f.key === 'string' &&
      typeof f.value === 'string' &&
      f.value.trim().length > 0 &&
      EXTRACTABLE_KEY_SET.has(f.key)
  )

  if (valid.length === 0) {
    console.log('[Memory] No durable facts extracted — nothing written.')
    return
  }

  console.log(`[Memory] Extracted ${valid.length} fact(s):`, JSON.stringify(valid))

  // Upsert each fact individually so each failure is logged separately
  for (const fact of valid) {
    const upsertRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/user_context?on_conflict=user_id,key`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          user_id: userId,
          key: fact.key,
          value: fact.value.trim(),
          source: 'agent',
        }),
      }
    )

    if (upsertRes.ok) {
      console.log(`[Memory] Wrote: ${fact.key} = "${fact.value.trim()}"`)
    } else {
      console.error(`[Memory] Upsert failed for key "${fact.key}":`, await upsertRes.text())
    }
  }
}

// =============================================
// Auth — Supabase JWT verification
// =============================================
async function requireAuth(
  request: Request,
  env: Env
): Promise<{ userId: string | null; error: string | null }> {
  const auth = request.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) {
    return { userId: null, error: 'Missing authorization token' }
  }
  const token = auth.slice(7)

  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': env.SUPABASE_ANON_KEY,
    },
  })

  if (!res.ok) {
    return { userId: null, error: 'Unauthorized' }
  }

  const user = await res.json() as { id?: string }
  if (!user?.id) {
    return { userId: null, error: 'Invalid token' }
  }

  return { userId: user.id, error: null }
}

// =============================================
// Helpers
// =============================================
function json(body: unknown, status = 200, origin = ''): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

const PRODUCTION_ORIGINS = new Set([
  'https://barakzai.cloud',
  'https://www.barakzai.cloud',
])

const DEV_ORIGIN_RES = [
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
]

function corsHeaders(origin: string): Record<string, string> {
  const allowed = PRODUCTION_ORIGINS.has(origin) || DEV_ORIGIN_RES.some(re => re.test(origin))
    ? origin
    : 'https://barakzai.cloud'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}
