import type {
  Env, UserContext, FinanceContext, CalendarContext, Language,
  CalendarEvent, MemoryEntry, BriefingMode, JournalContext, JournalEntry,
  TaskSummary, HabitContext,
} from './types'

// =============================================
// Generic REST helper — GET /rest/v1/<path>
// =============================================
export async function supabaseGet<T>(env: Env, path: string): Promise<T> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase REST error (${path}): ${err}`)
  }

  return res.json()
}

// =============================================
// Generic REST helper — POST /rest/v1/<table>
// =============================================
export async function supabasePost(
  env: Env,
  table: string,
  body: Record<string, unknown>,
  prefer = 'return=minimal'
): Promise<void> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Prefer': prefer,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase POST error (${table}): ${err}`)
  }
}

// =============================================
// Generic REST helper — PATCH /rest/v1/<path>
// =============================================
export async function supabasePatch(
  env: Env,
  path: string,
  body: Record<string, unknown>,
  prefer = 'return=minimal'
): Promise<void> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Prefer': prefer,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase PATCH error (${path}): ${err}`)
  }
}

// =============================================
// حافظه کاربر از user_context (read-only)
// =============================================
export async function fetchUserMemory(
  userId: string,
  env: Env
): Promise<MemoryEntry[]> {
  const rows = await supabaseGet<Array<{ key: string; value: string; source: string }>>(
    env,
    `user_context?user_id=eq.${userId}&select=key,value,source`
  )

  return rows
    .filter(r => r.value?.trim())
    .map(r => ({
      key: r.key,
      value: r.value.trim(),
      source: r.source as MemoryEntry['source'],
    }))
}

// =============================================
// User language from user_settings
// =============================================
export async function fetchUserLanguage(userId: string, env: Env): Promise<Language> {
  const rows = await supabaseGet<Array<{ language: string }>>(
    env,
    `user_settings?select=language&user_id=eq.${userId}&limit=1`
  )
  const rawLang = rows[0]?.language ?? null
  if (rawLang === 'de' || rawLang === 'fa') return rawLang
  return 'en'
}

// =============================================
// Journal — last 7 days (both modes)
// =============================================
export async function fetchJournalContext(
  userId: string,
  env: Env
): Promise<JournalContext> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const dateStr = sevenDaysAgo.toISOString().slice(0, 10)

  const rows = await supabaseGet<Array<{ date: string; mood: number | null; content: string | null }>>(
    env,
    `journal_entries?select=date,mood,content&user_id=eq.${userId}&date=gte.${dateStr}&order=date.desc&limit=7`
  )

  const moodEntries = rows.filter(r => r.mood !== null)
  const averageMood = moodEntries.length > 0
    ? Math.round((moodEntries.reduce((s, r) => s + (r.mood ?? 0), 0) / moodEntries.length) * 10) / 10
    : null

  const entries: JournalEntry[] = rows.map(r => ({
    date: r.date,
    mood: r.mood ?? null,
    content: r.content ? r.content.slice(0, 200) : null,
  }))

  return { entries, entryCount: rows.length, averageMood }
}

// =============================================
// Tasks — due this week + overdue (weekly mode)
// =============================================
export async function fetchTaskContext(
  userId: string,
  env: Env
): Promise<TaskSummary[]> {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  // End of the current week (Sunday)
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() - now.getDay() + 7)
  const weekEndStr = weekEnd.toISOString().slice(0, 10)

  const rows = await supabaseGet<Array<{ title: string; due_date: string }>>(
    env,
    `tasks?select=title,due_date&user_id=eq.${userId}&completed=eq.false&due_date=lte.${weekEndStr}&order=due_date.asc&limit=15`
  )

  return rows
    .filter(r => r.due_date)
    .map(r => ({
      title: r.title,
      due_date: r.due_date,
      overdue: r.due_date < today,
    }))
}

// =============================================
// Habits — completion rate this week (weekly)
// =============================================
export async function fetchHabitContext(
  userId: string,
  env: Env
): Promise<HabitContext | null> {
  const now = new Date()

  // Monday of the current week
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1)
  const weekStartStr = weekStart.toISOString().slice(0, 10)
  const todayStr = now.toISOString().slice(0, 10)

  const [habits, completions] = await Promise.all([
    supabaseGet<Array<{ id: string }>>(
      env,
      `habits?select=id&user_id=eq.${userId}&is_active=eq.true`
    ),
    supabaseGet<Array<{ habit_id: string }>>(
      env,
      `habit_completions?select=habit_id&user_id=eq.${userId}&completed_date=gte.${weekStartStr}&completed_date=lte.${todayStr}`
    ),
  ])

  if (habits.length === 0) return null

  // Days elapsed this week (Mon=1 … Sun=7)
  const rawDay = now.getDay()
  const daysElapsed = rawDay === 0 ? 7 : rawDay

  const totalPossible = habits.length * daysElapsed
  const completedCount = completions.length
  const completionRate = totalPossible > 0
    ? Math.round((completedCount / totalPossible) * 100)
    : 0

  return { completedCount, totalPossible, completionRate }
}

// =============================================
// داده‌های Finance ماه جاری
// =============================================
export async function fetchFinanceContext(
  userId: string,
  env: Env
): Promise<FinanceContext> {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const currentRows = await supabaseGet<Array<{ amount: number }>>(env,
    `finance_transactions?select=amount&user_id=eq.${userId}&date=gte.${firstOfMonth}`)

  const income = currentRows.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0)
  const expenses = currentRows.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0)
  const transactionCount = currentRows.length

  const catRows = await supabaseGet<Array<{ category: string; amount: number }>>(env,
    `finance_transactions?select=category,amount&user_id=eq.${userId}&amount=lt.0&date=gte.${firstOfMonth}`)

  const catTotals: Record<string, number> = {}
  for (const row of catRows) {
    if (row.category) catTotals[row.category] = (catTotals[row.category] ?? 0) + Math.abs(row.amount)
  }
  const topExpenseCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown'

  const lastMonthRows = await supabaseGet<Array<{ amount: number }>>(env,
    `finance_transactions?select=amount&user_id=eq.${userId}&amount=lt.0&date=gte.${firstOfLastMonth}&date=lt.${firstOfMonth}`)
  const lastMonthExpenses = lastMonthRows.reduce((s, r) => s + Math.abs(r.amount), 0)

  const expenseChangePercent = lastMonthExpenses > 0
    ? Math.round(((expenses - lastMonthExpenses) / lastMonthExpenses) * 100)
    : null

  return {
    totalIncome: Math.round(income * 100) / 100,
    totalExpenses: Math.round(expenses * 100) / 100,
    net: Math.round((income - expenses) * 100) / 100,
    topExpenseCategory,
    transactionCount,
    currency: 'EUR',
    expenseChangePercent,
  }
}

// =============================================
// داده‌های Calendar این هفته
// =============================================
export async function fetchCalendarContext(
  userId: string,
  env: Env
): Promise<CalendarContext> {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const events = await supabaseGet<CalendarEvent[]>(env,
    `calendar_events?select=title,start_time,end_time,location&user_id=eq.${userId}&start_time=gte.${weekStart.toISOString()}&start_time=lte.${weekEnd.toISOString()}&order=start_time.asc&limit=10`)

  const nextEvent = events.find(e => new Date(e.start_time) > now) ?? null

  return {
    eventsThisWeek: events,
    eventCount: events.length,
    nextEvent,
  }
}

// =============================================
// Context کامل یه کاربر رو می‌سازه
// =============================================
export async function buildUserContext(
  userId: string,
  env: Env,
  mode: BriefingMode = 'daily'
): Promise<UserContext> {
  const language = await fetchUserLanguage(userId, env)
  console.log(`[Context] userId=${userId} language=${language} mode=${mode}`)

  if (mode === 'weekly') {
    const [finance, calendar, memory, journal, tasks, habits] = await Promise.all([
      fetchFinanceContext(userId, env),
      fetchCalendarContext(userId, env),
      fetchUserMemory(userId, env),
      fetchJournalContext(userId, env),
      fetchTaskContext(userId, env),
      fetchHabitContext(userId, env),
    ])
    return { userId, language, mode, memory, journal, finance, calendar, tasks, habits }
  }

  const [finance, calendar, memory, journal] = await Promise.all([
    fetchFinanceContext(userId, env),
    fetchCalendarContext(userId, env),
    fetchUserMemory(userId, env),
    fetchJournalContext(userId, env),
  ])
  return { userId, language, mode, memory, journal, finance, calendar, tasks: [], habits: null }
}
