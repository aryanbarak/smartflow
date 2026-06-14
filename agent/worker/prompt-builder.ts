import type { UserContext, Language } from './types'

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

// =============================================
// User prompt — داده‌ها رو به Gemini میده
// =============================================
export function buildPrompt(ctx: UserContext): { system: string; user: string } {
  const { language, finance, calendar } = ctx
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  // Finance summary
  const financeText = [
    `Current month finance:`,
    `  - Income: €${finance.totalIncome}`,
    `  - Expenses: €${finance.totalExpenses}`,
    `  - Net: €${finance.net}`,
    `  - Top expense category: ${finance.topExpenseCategory}`,
    `  - Transactions this month: ${finance.transactionCount}`,
    finance.expenseChangePercent !== null
      ? `  - Expense change vs last month: ${finance.expenseChangePercent > 0 ? '+' : ''}${finance.expenseChangePercent}%`
      : `  - No comparison data for last month`,
  ].join('\n')

  // Calendar summary
  const calendarText = calendar.eventCount === 0
    ? `Calendar: No events this week.`
    : [
        `Calendar this week (${calendar.eventCount} events):`,
        ...calendar.eventsThisWeek.slice(0, 5).map(e => {
          const date = new Date(e.start_time).toLocaleDateString('en-GB', {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })
          return `  - ${e.title} on ${date}${e.location ? ` @ ${e.location}` : ''}`
        }),
        calendar.nextEvent
          ? `  Next upcoming: "${calendar.nextEvent.title}"`
          : '',
      ].join('\n')

  const userPrompt = [
    `Today is ${today}.`,
    ``,
    financeText,
    ``,
    calendarText,
    ``,
    `Write the briefing in ${language === 'fa' ? 'Persian (Farsi)' : language === 'de' ? 'German' : 'English'}.`,
  ].join('\n')

  return {
    system: SYSTEM_PROMPTS[language],
    user: userPrompt,
  }
}
