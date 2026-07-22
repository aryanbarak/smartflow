export interface Env {
  SMARTFLOW_WORKER_MODE?: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_KEY: string
  GEMINI_API_KEY: string
  GEMINI_MODEL: string
  GITHUB_APP_ID?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_APP_SLUG?: string
  GITHUB_SETUP_URL?: string
  GITHUB_CALLBACK_URL?: string
  GITHUB_ALLOWED_ORIGINS?: string
  GITHUB_APP_PRIVATE_KEY?: string
  GITHUB_CLIENT_SECRET?: string
  AI: Ai  // Cloudflare AI Gateway
}

export type Language = 'en' | 'de' | 'fa'
export type BriefingMode = 'daily' | 'weekly'

export interface MemoryEntry {
  key: string
  value: string
  source: 'manual' | 'auto' | 'ai' | 'agent'
}

export interface ExtractedFact {
  key: string
  value: string
}

export interface JournalEntry {
  date: string
  mood: number | null
  content: string | null
}

export interface JournalContext {
  entries: JournalEntry[]
  entryCount: number
  averageMood: number | null
}

export interface TaskSummary {
  title: string
  due_date: string
  overdue: boolean
}

export interface HabitContext {
  completedCount: number
  totalPossible: number
  completionRate: number  // 0–100
}

export interface UserContext {
  userId: string
  language: Language
  mode: BriefingMode
  memory: MemoryEntry[]
  journal: JournalContext
  finance: FinanceContext
  calendar: CalendarContext
  tasks: TaskSummary[]        // populated in weekly mode; empty array in daily
  habits: HabitContext | null // populated in weekly mode; null in daily
}

export interface FinanceContext {
  totalIncome: number
  totalExpenses: number
  net: number
  topExpenseCategory: string
  transactionCount: number
  currency: string
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
  mode: BriefingMode
  context: UserContext
  triggered_by: 'cron' | 'user' | 'alert'
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  maxOutputTokens?: number
  temperature?: number
}
