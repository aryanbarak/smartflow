import { supabase } from '@/integrations/supabase/client';

export interface DayCorrelation {
  date: string;
  mood: number | null;
  habitsCompleted: number;
  habitsTotal: number;
  completionRate: number;
}

export interface CorrelationSummary {
  days: DayCorrelation[];
  avgMoodHighHabit: number;
  avgMoodLowHabit: number;
  correlation: 'positive' | 'neutral' | 'negative' | 'insufficient_data';
  message: string;
  thisWeekAvgMood: number;
  thisWeekCompletionRate: number;
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

export async function getHabitMoodCorrelation(
  userId: string,
  days = 14,
): Promise<CorrelationSummary> {
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [journalRes, habitsRes, completionsRes] = await Promise.all([
    supabase.from('journal_entries').select('date, mood')
      .eq('user_id', userId).gte('date', fromDate).not('mood', 'is', null),
    supabase.from('habits').select('id').eq('user_id', userId).eq('is_active', true),
    supabase.from('habit_completions').select('completed_date')
      .eq('user_id', userId).gte('completed_date', fromDate),
  ]);

  const moodByDate = Object.fromEntries(
    (journalRes.data ?? []).map(j => [j.date, j.mood as number]),
  );
  const totalHabits = (habitsRes.data ?? []).length;
  const completionsByDate = (completionsRes.data ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.completed_date] = (acc[c.completed_date] ?? 0) + 1;
    return acc;
  }, {});

  const dayList: DayCorrelation[] = Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const completed = completionsByDate[date] ?? 0;
    const rate = totalHabits > 0 ? completed / totalHabits : 0;
    return { date, mood: moodByDate[date] ?? null, habitsCompleted: completed, habitsTotal: totalHabits, completionRate: rate };
  });

  const daysWithBoth = dayList.filter(d => d.mood !== null && d.habitsTotal > 0);
  const highHabitDays = daysWithBoth.filter(d => d.completionRate > 0.5);
  const lowHabitDays = daysWithBoth.filter(d => d.completionRate <= 0.5);
  const avgMoodHighHabit = avg(highHabitDays.map(d => d.mood!));
  const avgMoodLowHabit = avg(lowHabitDays.map(d => d.mood!));

  const thisWeekDays = dayList.filter(d => d.date >= weekAgo);
  const thisWeekMoods = thisWeekDays.map(d => d.mood).filter((m): m is number => m !== null);
  const thisWeekCompletions = thisWeekDays.reduce((s, d) => s + d.habitsCompleted, 0);
  const thisWeekAvgMood = avg(thisWeekMoods);
  const thisWeekCompletionRate = totalHabits * 7 > 0 ? thisWeekCompletions / (totalHabits * 7) : 0;

  let correlation: CorrelationSummary['correlation'] = 'insufficient_data';
  let message = 'Not enough data yet — keep logging mood and completing habits!';

  if (daysWithBoth.length >= 5) {
    const diff = avgMoodHighHabit - avgMoodLowHabit;
    if (diff > 0.5) {
      correlation = 'positive';
      message = `Your mood is ${diff.toFixed(1)} points higher on days you complete more habits! 🌟`;
    } else if (diff < -0.5) {
      correlation = 'negative';
      message = "Interesting — your mood pattern doesn't follow habit completion. Other factors may be more important.";
    } else {
      correlation = 'neutral';
      message = 'No strong correlation found yet between habits and mood. Keep tracking!';
    }
  }

  return { days: dayList, avgMoodHighHabit, avgMoodLowHabit, correlation, message, thisWeekAvgMood, thisWeekCompletionRate };
}

export async function getTodayHabitSummary(userId: string): Promise<{ completed: number; total: number; rate: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const [habitsRes, completionsRes] = await Promise.all([
    supabase.from('habits').select('id').eq('user_id', userId).eq('is_active', true),
    supabase.from('habit_completions').select('id').eq('user_id', userId).eq('completed_date', today),
  ]);
  const total = (habitsRes.data ?? []).length;
  const completed = (completionsRes.data ?? []).length;
  return { completed, total, rate: total > 0 ? completed / total : 0 };
}

export async function getThisWeekMoodSummary(userId: string): Promise<{ avgMood: number; entries: number; emoji: string }> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from('journal_entries').select('mood')
    .eq('user_id', userId).gte('date', weekAgo).not('mood', 'is', null);

  const moods = (data ?? []).map(d => d.mood as number);
  const avgMood = avg(moods);
  const emoji = avgMood >= 4.5 ? '😄' : avgMood >= 3.5 ? '😊' : avgMood >= 2.5 ? '😐' : avgMood >= 1.5 ? '😔' : avgMood > 0 ? '😢' : '—';
  return { avgMood, entries: moods.length, emoji };
}
