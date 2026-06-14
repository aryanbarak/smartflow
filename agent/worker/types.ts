export interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_KEY: string
  GEMINI_API_KEY: string
  GEMINI_MODEL: string
  AI: Ai  // Cloudflare AI Gateway
}

export type Language = 'en' | 'de' | 'fa'

export interface UserContext {
  userId: string
  language: Language
  finance: FinanceContext
  calendar: CalendarContext
}

export interface FinanceContext {
  totalIncome: number
  totalExpenses: number
  net: number
  topExpenseCategory: string
  transactionCount: number
  currency: string
  // مقایسه با ماه قبل
  expenseChangePercent: number | null
}

export interface CalendarContext {
  eventsThisWeek: CalendarEvent[]
  eventCount: number
  nextEvent: CalendarEvent | null
}

export interface CalendarEvent {
  title: string
  start_time: string
  end_time: string | null
  location: string | null
}

export interface AgentBriefing {
  content: string
  language: Language
  context: UserContext
  triggered_by: 'cron' | 'user' | 'alert'
}
