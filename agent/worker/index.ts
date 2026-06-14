import type { Env, AgentBriefing } from './types'
import { buildUserContext } from './context-builder'
import { buildPrompt } from './prompt-builder'

export default {
  // =============================================
  // Cron Trigger — هر روز ساعت ۶ UTC
  // =============================================
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runBriefingForAllUsers(env, 'cron'))
  },

  // =============================================
  // HTTP Trigger — برای on-demand از UI
  // POST /generate?user_id=xxx
  // =============================================
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS
    const origin = request.headers.get('Origin') ?? ''
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, origin)
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    if (!userId) {
      return json({ error: 'user_id is required' }, 400, origin)
    }

    // Auth check — Bearer token باید Supabase JWT باشه
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401, origin)
    }

    try {
      const briefing = await generateBriefing(userId, env, 'user')
      return json({ success: true, briefing: briefing.content }, 200, origin)
    } catch (err) {
      console.error('Agent error:', err)
      return json({ error: 'Failed to generate briefing' }, 500, origin)
    }
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
  triggeredBy: 'cron' | 'user' | 'alert'
): Promise<AgentBriefing> {
  // ۱. داده‌ها رو جمع کن
  const context = await buildUserContext(userId, env)

  // ۲. Prompt بساز
  const { system, user } = buildPrompt(context)

  // ۳. Gemini رو صدا بزن
  const content = await callGemini(system, user, env)

  // ۴. توی Supabase ذخیره کن
  await saveBriefing(userId, content, context.language, context, triggeredBy, env)

  return { content, language: context.language, context, triggered_by: triggeredBy }
}

// =============================================
// Gemini API call
// =============================================
async function callGemini(system: string, user: string, env: Env): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
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
// Supabase — briefing ذخیره کن
// =============================================
async function saveBriefing(
  userId: string,
  content: string,
  language: string,
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
      context,
      triggered_by: triggeredBy,
    }),
  })

  if (!res.ok) {
    console.error('Failed to save briefing:', await res.text())
  }
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
