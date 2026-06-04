import { supabase } from '@/integrations/supabase/client';

const WORKER_BASE = (import.meta.env.VITE_AI_AGENT_URL as string | undefined)
  ?.replace('/analyze', '') ?? 'https://api.barakzai.cloud';

export interface BriefingData {
  tasks: {
    overdue: { title: string; due_date: string }[];
    dueThisWeek: { title: string; due_date: string }[];
  };
  calendar: { title: string; date: string; start_time: string | null }[];
  habits: { title: string; completions: number; target: number }[];
  journal: { avgMood: number; entryCount: number; lastEntry: string | null };
  finance: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    topCategories: string[];
  };
  family: string[];
}

export interface BriefingResult {
  briefing: string;
  provider: string;
  generatedAt: string;
}

export async function collectBriefingData(): Promise<BriefingData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  const weekStart = today.toISOString().slice(0, 10);
  const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [tasksRes, calendarRes, habitsRes, completionsRes, journalRes, financeRes] = await Promise.all([
    supabase.from('tasks').select('title, due_date, completed').eq('user_id', user.id).eq('completed', false),
    supabase.from('calendar_events').select('title, date, start_time').eq('user_id', user.id).gte('date', weekStart).lte('date', weekEnd).order('date'),
    supabase.from('habits').select('id, title, target_days').eq('user_id', user.id).eq('is_active', true),
    supabase.from('habit_completions').select('habit_id, completed_date').eq('user_id', user.id).gte('completed_date', weekAgo),
    supabase.from('journal_entries').select('content, mood, date').eq('user_id', user.id).gte('date', weekAgo).order('date', { ascending: false }),
    supabase.from('finance_transactions').select('type, amount, category').eq('user_id', user.id).gte('date', monthAgo),
  ]);

  const allTasks = tasksRes.data ?? [];
  const overdue = allTasks
    .filter(t => t.due_date && t.due_date < weekStart)
    .map(t => ({ title: t.title, due_date: t.due_date as string }));
  const dueThisWeek = allTasks
    .filter(t => t.due_date && t.due_date >= weekStart && t.due_date <= weekEnd)
    .map(t => ({ title: t.title, due_date: t.due_date as string }));

  const completionsByHabit = (completionsRes.data ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.habit_id] = (acc[c.habit_id] ?? 0) + 1;
    return acc;
  }, {});
  const habits = (habitsRes.data ?? []).map(h => ({
    title: h.title,
    completions: completionsByHabit[h.id] ?? 0,
    target: h.target_days ?? 7,
  }));

  const journalEntries = journalRes.data ?? [];
  const moods = journalEntries.map(e => e.mood).filter((m): m is number => typeof m === 'number');
  const avgMood = moods.length
    ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10
    : 0;

  const transactions = financeRes.data ?? [];
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const categoryCount = transactions
    .filter(t => t.type === 'expense' && t.category)
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category!] = (acc[t.category!] ?? 0) + 1;
      return acc;
    }, {});
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  return {
    tasks: { overdue, dueThisWeek },
    calendar: (calendarRes.data ?? []).map(e => ({
      title: e.title,
      date: e.date,
      start_time: e.start_time ?? null,
    })),
    habits,
    journal: {
      avgMood,
      entryCount: journalEntries.length,
      lastEntry: journalEntries[0]?.content?.slice(0, 150) ?? null,
    },
    finance: {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      balance: Math.round((totalIncome - totalExpenses) * 100) / 100,
      topCategories,
    },
    family: [],
  };
}

export async function generateBriefing(
  data: BriefingData,
  language: string,
  accessToken: string,
): Promise<BriefingResult> {
  const res = await fetch(`${WORKER_BASE}/briefing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ data, language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<BriefingResult>;
}
