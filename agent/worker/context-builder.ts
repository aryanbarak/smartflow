import type { Env, UserContext, FinanceContext, CalendarContext, Language, CalendarEvent, MemoryEntry } from './types'

// =============================================
// Generic REST helper — GET /rest/v1/<path>
// =============================================
async function supabaseGet<T>(env: Env, path: string): Promise<T> {
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
// داده‌های Finance ماه جاری
// =============================================
export async function fetchFinanceContext(
  userId: string,
  env: Env
): Promise<FinanceContext> {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  // ماه جاری — همه تراکنش‌ها
  const currentRows = await supabaseGet<Array<{ amount: number }>>(env,
    `finance_transactions?select=amount&user_id=eq.${userId}&date=gte.${firstOfMonth}`)

  const income = currentRows.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0)
  const expenses = currentRows.filter(r => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0)
  const transactionCount = currentRows.length

  // دسته‌بندی با بیشترین خرج — ماه جاری
  const catRows = await supabaseGet<Array<{ category: string; amount: number }>>(env,
    `finance_transactions?select=category,amount&user_id=eq.${userId}&amount=lt.0&date=gte.${firstOfMonth}`)

  const catTotals: Record<string, number> = {}
  for (const row of catRows) {
    if (row.category) catTotals[row.category] = (catTotals[row.category] ?? 0) + Math.abs(row.amount)
  }
  const topExpenseCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown'

  // ماه قبل برای مقایسه
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
  weekStart.setDate(now.getDate() - now.getDay() + 1) // دوشنبه
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
  env: Env
): Promise<UserContext> {
  // زبان کاربر
  const settingsRows = await supabaseGet<Array<{ language: string }>>(env,
    `user_settings?select=language&user_id=eq.${userId}&limit=1`)
  const language: Language = (settingsRows[0]?.language as Language) ?? 'en'

  // داده‌ها رو موازی بگیر
  const [finance, calendar, memory] = await Promise.all([
    fetchFinanceContext(userId, env),
    fetchCalendarContext(userId, env),
    fetchUserMemory(userId, env),
  ])

  return { userId, language, memory, finance, calendar }
}
