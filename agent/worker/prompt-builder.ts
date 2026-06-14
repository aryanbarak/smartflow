import type { UserContext, Language, MemoryEntry } from './types'

// =============================================
// System prompts سه‌زبانه
// =============================================
const SYSTEM_PROMPTS: Record<Language, string> = {
  en: `You are Aryan's personal AI assistant inside DailyFlow.
Your job: write a concise, warm daily briefing based on the data provided.
Rules:
- Maximum 4 short sentences
- Use "Aryan" by name at the start
- Be specific with numbers (amounts, counts, dates)
- Friendly but professional tone
- No markdown, no bullet points — plain text only
- End with one short motivational or actionable sentence`,

  de: `Du bist Aryans persönlicher KI-Assistent in DailyFlow.
Deine Aufgabe: Schreibe ein kurzes, freundliches tägliches Briefing basierend auf den bereitgestellten Daten.
Regeln:
- Maximal 4 kurze Sätze
- Beginne mit "Aryan" namentlich
- Sei konkret mit Zahlen (Beträge, Anzahl, Daten)
- Freundlicher aber professioneller Ton
- Kein Markdown, keine Aufzählungszeichen — nur normaler Text
- Beende mit einem kurzen motivierenden oder handlungsorientierten Satz`,

  fa: `تو دستیار هوش مصنوعی شخصی آریان در DailyFlow هستی.
وظیفه‌ات: یه briefing روزانه کوتاه و صمیمی بنویس بر اساس داده‌های ارائه‌شده.
قوانین:
- حداکثر ۴ جمله کوتاه
- با اسم "آریان" شروع کن
- با اعداد مشخص باش (مقادیر، تعداد، تاریخ‌ها)
- لحن دوستانه ولی حرفه‌ای
- بدون markdown، بدون bullet — فقط متن ساده
- با یه جمله انگیزشی یا عملی کوتاه تموم کن`,
}

const LANG_NAMES: Record<Language, string> = {
  fa: 'Persian (Farsi)',
  de: 'German',
  en: 'English',
}

// =============================================
// Human-readable labels for user_context keys
// =============================================
const KEY_LABELS: Record<string, string> = {
  goal_primary:    'Primary goal',
  goal_secondary:  'Secondary goal',
  work_status:     'Work / career status',
  mood_pattern:    'Recent mood',
  habit_pattern:   'Habit completion',
  finance_pattern: 'Finance pattern',
  family_note:     'Family context',
  health_note:     'Health notes',
  learning_note:   'Learning focus',
  custom_1:        'Personal note',
  custom_2:        'Personal note',
  custom_3:        'Personal note',
}

function buildMemorySection(memory: MemoryEntry[]): string {
  if (memory.length === 0) return ''

  const manual = memory.filter(e => e.source === 'manual')
  const auto   = memory.filter(e => e.source === 'auto')
  const agent  = memory.filter(e => e.source === 'agent' || e.source === 'ai')

  const lines: string[] = ['What I know about Aryan (use this to personalize the briefing):']

  if (manual.length > 0) {
    lines.push('  [User-confirmed facts — highest priority]')
    for (const e of manual) {
      lines.push(`  - ${KEY_LABELS[e.key] ?? e.key}: ${e.value}`)
    }
  }

  if (auto.length > 0) {
    lines.push('  [Auto-detected patterns]')
    for (const e of auto) {
      lines.push(`  - ${KEY_LABELS[e.key] ?? e.key}: ${e.value}`)
    }
  }

  if (agent.length > 0) {
    lines.push('  [AI-observed notes]')
    for (const e of agent) {
      lines.push(`  - ${KEY_LABELS[e.key] ?? e.key}: ${e.value}`)
    }
  }

  return lines.join('\n')
}

// =============================================
// Keys the extraction model is allowed to write
// =============================================
export const EXTRACTABLE_KEYS = [
  'goal_primary',
  'goal_secondary',
  'work_status',
  'family_note',
  'health_note',
  'learning_note',
  'custom_1',
  'custom_2',
  'custom_3',
] as const

// =============================================
// Prompt for the memory-extraction Gemini call
// =============================================
export function buildExtractionPrompt(
  briefing: string,
  ctx: UserContext
): { system: string; user: string } {
  const existingLines = ctx.memory
    .filter(e => e.value.trim())
    .map(e => `  ${e.key}: ${e.value}`)
  const hasExistingMemory = existingLines.length > 0
  const existingMemory = hasExistingMemory
    ? existingLines.join('\n')
    : '  (empty — this is the first extraction run)'

  // Calendar event titles as pattern signals (not individual event details)
  const eventTitles = ctx.calendar.eventsThisWeek
    .map(e => e.title)
    .filter(Boolean)
    .slice(0, 8)
  const calendarSignal = eventTitles.length > 0
    ? `Calendar event types this week: ${eventTitles.join(' | ')}`
    : 'Calendar: no events this week'

  // Finance top category as spending pattern signal (no specific amounts)
  const financeSignal = ctx.finance.transactionCount > 0
    ? `Top expense category: ${ctx.finance.topExpenseCategory} (${ctx.finance.transactionCount} transactions this month)`
    : 'Finance: no transactions this month'

  const validKeys = EXTRACTABLE_KEYS.join(', ')

  const eagerOrSelective = hasExistingMemory
    ? 'Stored memory already exists. Only extract facts that are GENUINELY NEW or represent a meaningful change from what is already stored.'
    : 'Stored memory is empty. Be willing to establish initial facts — extract anything stable and useful from the context.'

  const system = [
    'You are a memory extractor for a personal productivity app.',
    'Your job: identify durable long-term facts about the user worth storing for future personalization.',
    '',
    `Valid keys (choose only from these): ${validKeys}`,
    '',
    'EXTRACT stable, long-term facts such as:',
    '  - Long-term goals (career, education, personal ambitions)',
    '  - Work or study status inferred from event types or context',
    '  - Recurring life patterns (family situation, health habits, learning focus)',
    '  - Important personal context that should shape future AI responses',
    '',
    'DO NOT EXTRACT — these are already tracked elsewhere:',
    '  - Specific €-amounts, balances, or transaction counts',
    '  - Individual calendar event titles, specific dates or deadlines',
    '  - Mood scores, habit completion %, top expense category numbers',
    '  - Anything framed as "this week", "this month", or "today"',
    '',
    eagerOrSelective,
    '',
    'Output: JSON array [{"key":"...","value":"..."}] — values max 120 chars, no specific amounts or dates.',
    'Return [] only if you genuinely cannot identify any new durable fact.',
  ].join('\n')

  const user = [
    'Already stored memory:',
    existingMemory,
    '',
    `Briefing generated today for this user:`,
    `"${briefing}"`,
    '',
    'Supporting context (use to infer stable patterns — do not store the raw numbers):',
    calendarSignal,
    financeSignal,
    '',
    'Extract durable facts not already captured in stored memory above.',
  ].join('\n')

  return { system, user }
}

// =============================================
// User prompt — داده‌ها رو به Gemini میده
// =============================================
export function buildPrompt(ctx: UserContext): { system: string; user: string } {
  const { language, memory, finance, calendar } = ctx
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const memorySection = buildMemorySection(memory)

  // Finance summary — extract sign separately to avoid nested ternary (S3358)
  const expChangeSign = (finance.expenseChangePercent ?? 0) > 0 ? '+' : ''
  const expChangeLine = finance.expenseChangePercent === null
    ? `  - No comparison data for last month`
    : `  - Expense change vs last month: ${expChangeSign}${finance.expenseChangePercent}%`

  const financeText = [
    `Current month finance:`,
    `  - Income: €${finance.totalIncome}`,
    `  - Expenses: €${finance.totalExpenses}`,
    `  - Net: €${finance.net}`,
    `  - Top expense category: ${finance.topExpenseCategory}`,
    `  - Transactions this month: ${finance.transactionCount}`,
    expChangeLine,
  ].join('\n')

  // Calendar summary — extract location string to avoid nested template (S4624)
  let calendarText: string
  if (calendar.eventCount === 0) {
    calendarText = `Calendar: No events this week.`
  } else {
    const eventLines = calendar.eventsThisWeek.slice(0, 5).map(e => {
      const date = new Date(e.start_time).toLocaleDateString('en-GB', {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
      const loc = e.location ? ` @ ${e.location}` : ''
      return `  - ${e.title} on ${date}${loc}`
    })
    const nextLine = calendar.nextEvent
      ? `  Next upcoming: "${calendar.nextEvent.title}"`
      : ''
    calendarText = [
      `Calendar this week (${calendar.eventCount} events):`,
      ...eventLines,
      nextLine,
    ].join('\n')
  }

  const userPrompt = [
    `Today is ${today}.`,
    ...(memorySection ? [``, memorySection] : []),
    ``,
    financeText,
    ``,
    calendarText,
    ``,
    `Write the briefing in ${LANG_NAMES[language]}.`,
  ].join('\n')

  return {
    system: SYSTEM_PROMPTS[language],
    user: userPrompt,
  }
}
