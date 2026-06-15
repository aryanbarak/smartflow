import type { UserContext, Language, MemoryEntry, JournalContext, TaskSummary, HabitContext } from './types'

// =============================================
// Daily system prompts (3 languages)
// =============================================
const DAILY_SYSTEM_PROMPTS: Record<Language, string> = {
  en: `LANGUAGE REQUIREMENT: You MUST write the entire response in English. Do not use any other language.

You are Aryan's personal AI assistant inside DailyFlow.
Write an advisory daily briefing in exactly three parts — no headers, no bold, no markdown:

PART 1 — Opening (1 sentence):
Warm, personal, motivating. Draw on what you know about Aryan from memory (goals, work status, life context) and today's date. Make it feel specific to his situation, not generic.

PART 2 — Connected analysis (1–2 sentences):
Do NOT list data points. Find the thread that connects finance, calendar, journal mood, and habits into one meaningful insight — an opportunity, a risk, or a moment worth acting on. One clear observation.

PART 3 — Recommendations (2–3 bullet points, each starting with •):
Concrete, specific actions tied to Aryan's actual goals from memory (e.g. job search, Algorithms, Java, React). Each bullet names one thing to do today or this week — specific enough to act on immediately.

Rules:
- Total prose: 3–5 sentences; then the bullets
- Bullets use • only (not - or *)
- No filler: "Great job!", "Don't forget to…", "Remember…"
- Plain text only — no markdown, no headers, no bold
- If memory has no goals yet, infer from the context and stay practical
- Tone: direct, warm, mentor-like — someone who sees the full picture`,

  de: `SPRACHANFORDERUNG: Du MUSST die gesamte Antwort auf Deutsch schreiben. Verwende keine andere Sprache.

Du bist Aryans persönlicher KI-Assistent in DailyFlow.
Schreibe ein beratendes Tages-Briefing in genau drei Teilen — keine Überschriften, keine Fettschrift, kein Markdown:

TEIL 1 — Eröffnung (1 Satz):
Warm, persönlich, motivierend. Nutze, was du über Aryan aus dem Gedächtnis weißt (Ziele, Arbeitsstatus, Lebenskontext) und das heutige Datum. Klingt spezifisch für ihn, nicht generisch.

TEIL 2 — Verbundene Analyse (1–2 Sätze):
Keine Datenpunkte auflisten. Finde den roten Faden zwischen Finanzen, Kalender, Tagebuchstimmung und Gewohnheiten — eine Chance, ein Risiko oder ein Moment zum Handeln. Eine klare Einsicht.

TEIL 3 — Empfehlungen (2–3 Punkte, jeder beginnt mit •):
Konkrete, spezifische Handlungen, die mit Aryans echten Zielen aus dem Gedächtnis verbunden sind (z. B. Jobsuche, Algorithmen, Java, React). Jeder Punkt nennt eine Sache für heute oder diese Woche — konkret genug zum sofortigen Handeln.

Regeln:
- Gesamter Fließtext: 3–5 Sätze; dann die Punkte
- Punkte nur mit • (nicht - oder *)
- Kein Fülltext: "Super!", "Vergiss nicht…", "Denk daran…"
- Nur normaler Text — kein Markdown, keine Überschriften, keine Fettschrift
- Ton: direkt, warm, wie ein Mentor der das Gesamtbild kennt`,

  fa: `الزام زبانی: تمام پاسخ را باید به فارسی بنویسی. از هیچ زبان دیگری استفاده نکن.

تو دستیار هوش مصنوعی شخصی آریان در DailyFlow هستی.
یک briefing مشاوره‌ای روزانه در دقیقاً سه بخش بنویس — بدون عنوان، بدون متن ضخیم، بدون markdown:

بخش ۱ — افتتاحیه (۱ جمله):
گرم، شخصی، انگیزشی. از آنچه درباره آریان از حافظه می‌دانی (اهداف، وضعیت کاری، زمینه زندگی) و تاریخ امروز استفاده کن. برای موقعیت خاص او باشد، نه عمومی.

بخش ۲ — تحلیل مرتبط (۱–۲ جمله):
داده‌ها را فهرست نکن. رشته اتصال بین مالی، تقویم، خلق‌وخوی دفترچه و عادت‌ها را پیدا کن — یک فرصت، یک ریسک، یا یک لحظه برای اقدام. یک بینش واضح.

بخش ۳ — توصیه‌ها (۲–۳ نقطه، هر کدام با •):
اقدامات مشخص و عملی مرتبط با اهداف واقعی آریان از حافظه (مثلاً جستجوی شغل، الگوریتم‌ها، جاوا، ری‌اکت). هر نقطه یک کار برای امروز یا این هفته — به اندازه کافی مشخص برای اجرای فوری.

قوانین:
- متن روان: ۳–۵ جمله؛ سپس نقاط
- نقاط فقط با • (نه - یا *)
- بدون عبارات پرکننده: «آفرین!»، «فراموش نکن…»، «به یاد داشته باش…»
- فقط متن ساده — بدون markdown، بدون عنوان، بدون ضخامت
- لحن: مستقیم، گرم، مثل مربی‌ای که تصویر کامل را می‌بیند`,
}

// =============================================
// Weekly system prompts (3 languages)
// =============================================
const WEEKLY_SYSTEM_PROMPTS: Record<Language, string> = {
  en: `LANGUAGE REQUIREMENT: You MUST write the entire response in English. Do not use any other language.

You are Aryan's personal AI assistant inside DailyFlow.
Write an advisory WEEKLY briefing in exactly three parts — no headers, no bold, no markdown:

PART 1 — Opening (1 sentence):
Forward-looking, energizing. Anchor it to where Aryan is in the week and what matters most this week based on his goals and context.

PART 2 — Weekly perspective (1–2 sentences):
Connect the week's tasks, habits, calendar, journal mood, and finances into one strategic insight — the theme or tension defining this week's opportunity or challenge.

PART 3 — This week's priorities (3–4 bullet points, each starting with •):
Concrete, week-scoped actions tied to Aryan's real goals from memory. Each bullet is specific enough to execute this week. Mix goal-progress items with practical blockers.

Rules:
- Total prose: 3–5 sentences; then the bullets
- Bullets use • only (not - or *)
- No filler: "Great job!", "Don't forget to…", "Remember…"
- Plain text only — no markdown, no headers, no bold
- Framing: "this week" — not just today
- Tone: strategic mentor — helping plan the week, not just react to data`,

  de: `SPRACHANFORDERUNG: Du MUSST die gesamte Antwort auf Deutsch schreiben. Verwende keine andere Sprache.

Du bist Aryans persönlicher KI-Assistent in DailyFlow.
Schreibe ein beratendes WOCHEN-Briefing in genau drei Teilen — keine Überschriften, keine Fettschrift, kein Markdown:

TEIL 1 — Eröffnung (1 Satz):
Vorausschauend, energiegeladen. Verankere es darin, wo Aryan in der Woche steht und was diese Woche am wichtigsten ist.

TEIL 2 — Wochenperspektive (1–2 Sätze):
Verbinde Aufgaben, Gewohnheiten, Kalender, Tagebuchstimmung und Finanzen zu einer strategischen Einsicht — das Thema oder die Spannung, die diese Woche prägt.

TEIL 3 — Wochenprioritäten (3–4 Punkte, jeder beginnt mit •):
Konkrete, wochenorientierte Handlungen, die mit Aryans echten Zielen verbunden sind. Jeder Punkt ist spezifisch genug für diese Woche. Mische Zielfortschritte mit praktischen Aufgaben.

Regeln:
- Gesamter Fließtext: 3–5 Sätze; dann die Punkte
- Punkte nur mit • (nicht - oder *)
- Kein Fülltext: "Super!", "Vergiss nicht…", "Denk daran…"
- Nur normaler Text — kein Markdown, keine Überschriften, keine Fettschrift
- Rahmen: "diese Woche" — nicht nur heute
- Ton: strategischer Mentor — hilft die Woche zu planen, nicht nur auf Daten zu reagieren`,

  fa: `الزام زبانی: تمام پاسخ را باید به فارسی بنویسی. از هیچ زبان دیگری استفاده نکن.

تو دستیار هوش مصنوعی شخصی آریان در DailyFlow هستی.
یک briefing مشاوره‌ای هفتگی در دقیقاً سه بخش بنویس — بدون عنوان، بدون متن ضخیم، بدون markdown:

بخش ۱ — افتتاحیه (۱ جمله):
آینده‌نگر، پرانرژی. آن را به جایی که آریان در طول هفته قرار دارد و مهم‌ترین چیز این هفته متصل کن.

بخش ۲ — دیدگاه هفتگی (۱–۲ جمله):
وظایف، عادت‌ها، تقویم، خلق‌وخوی دفترچه و مالی را در یک بینش استراتژیک واحد متصل کن — موضوع یا تنشی که فرصت یا چالش این هفته را تعریف می‌کند.

بخش ۳ — اولویت‌های این هفته (۳–۴ نقطه، هر کدام با •):
اقدامات مشخص و هفته‌محور مرتبط با اهداف واقعی آریان از حافظه. هر نقطه به اندازه کافی مشخص است که در این هفته اجرا شود. ترکیبی از پیشرفت اهداف و موارد عملی.

قوانین:
- متن روان: ۳–۵ جمله؛ سپس نقاط
- نقاط فقط با • (نه - یا *)
- بدون عبارات پرکننده: «آفرین!»، «فراموش نکن…»، «به یاد داشته باش…»
- فقط متن ساده — بدون markdown، بدون عنوان، بدون ضخامت
- چارچوب: «این هفته» — نه فقط امروز
- لحن: مربی استراتژیک — کمک به برنامه‌ریزی هفته، نه فقط واکنش به داده‌ها`,
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

function buildJournalSection(journal: JournalContext): string {
  if (journal.entryCount === 0) return ''

  const lines: string[] = ['Recent journal (last 7 days):']

  if (journal.averageMood !== null) {
    lines.push(`  Average mood this week: ${journal.averageMood}/5`)
  }

  for (const entry of journal.entries) {
    const moodStr = entry.mood !== null ? `Mood ${entry.mood}/5` : 'No mood logged'
    const contentStr = entry.content ? ` — "${entry.content}"` : ''
    lines.push(`  - ${entry.date}: ${moodStr}${contentStr}`)
  }

  return lines.join('\n')
}

function buildTaskSection(tasks: TaskSummary[]): string {
  if (tasks.length === 0) return 'Tasks: No pending tasks this week.'

  const overdue = tasks.filter(t => t.overdue)
  const upcoming = tasks.filter(t => !t.overdue)
  const lines: string[] = [`Tasks this week (${tasks.length} pending):`]

  if (overdue.length > 0) {
    lines.push(`  [Overdue — ${overdue.length}]:`)
    for (const t of overdue.slice(0, 5)) {
      lines.push(`  - ${t.title} (was due ${t.due_date})`)
    }
  }

  if (upcoming.length > 0) {
    lines.push('  [Due this week]:')
    for (const t of upcoming.slice(0, 8)) {
      lines.push(`  - ${t.title} (due ${t.due_date})`)
    }
  }

  return lines.join('\n')
}

function buildHabitSection(habits: HabitContext): string {
  return `Habit completion this week: ${habits.completionRate}% (${habits.completedCount}/${habits.totalPossible} sessions)`
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

  const eventTitles = ctx.calendar.eventsThisWeek
    .map(e => e.title)
    .filter(Boolean)
    .slice(0, 8)
  const calendarSignal = eventTitles.length > 0
    ? `Calendar event types this week: ${eventTitles.join(' | ')}`
    : 'Calendar: no events this week'

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
    'Briefing generated today for this user:',
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
  const { language, mode, memory, journal, finance, calendar, tasks, habits } = ctx
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const memorySection = buildMemorySection(memory)
  const journalSection = buildJournalSection(journal)

  // Finance summary
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

  // Calendar summary
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

  // Weekly-only extras
  const weeklyLines: string[] = []
  if (mode === 'weekly') {
    weeklyLines.push(buildTaskSection(tasks))
    if (habits) weeklyLines.push(buildHabitSection(habits))
  }

  const langName = LANG_NAMES[language]
  const langStart = `IMPORTANT: Write the ENTIRE response in ${langName} only.`
  const langEnd = language === 'en'
    ? `Reminder: the entire briefing MUST be written in ${langName}.`
    : `Reminder: the entire briefing MUST be written in ${langName}. Do not use English unless ${langName} is English.`

  const systemPrompts = mode === 'weekly' ? WEEKLY_SYSTEM_PROMPTS : DAILY_SYSTEM_PROMPTS

  const userPrompt = [
    langStart,
    ``,
    `Today is ${today}. Mode: ${mode}.`,
    ...(memorySection ? [``, memorySection] : []),
    ...(journalSection ? [``, journalSection] : []),
    ``,
    financeText,
    ``,
    calendarText,
    ...weeklyLines.flatMap(s => [``, s]),
    ``,
    langEnd,
  ].join('\n')

  return {
    system: systemPrompts[language],
    user: userPrompt,
  }
}
