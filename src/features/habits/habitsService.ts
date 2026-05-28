import { supabase } from '@/integrations/supabase/client';
import type { Habit, HabitCompletion, HabitWithStats } from './types';

function calculateStreak(completions: HabitCompletion[]): { current: number; longest: number } {
  if (!completions.length) return { current: 0, longest: 0 };

  const dates = completions
    .map(c => c.completed_date)
    .sort()
    .reverse();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let current = 0;
  if (dates[0] === today || dates[0] === yesterday) {
    let checkDate = dates[0];
    for (const date of dates) {
      if (current === 0) {
        current = 1;
        checkDate = date;
      } else {
        const expected = new Date(checkDate);
        expected.setDate(expected.getDate() - 1);
        const expectedStr = expected.toISOString().split('T')[0];
        if (date === expectedStr) {
          current++;
          checkDate = date;
        } else {
          break;
        }
      }
    }
  }

  let longest = current;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) {
      streak++;
      if (streak > longest) longest = streak;
    } else {
      streak = 1;
    }
  }

  return { current, longest };
}

export const habitsService = {
  async getAll(): Promise<HabitWithStats[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const [{ data: habits, error: hErr }, { data: completions, error: cErr }] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at'),
      supabase.from('habit_completions').select('*').eq('user_id', user.id).gte('completed_date', thirtyDaysAgo),
    ]);

    if (hErr) throw hErr;

    const today = new Date().toISOString().split('T')[0];

    return (habits || []).map(habit => {
      const habitCompletions = (completions || []).filter(c => c.habit_id === habit.id);
      const { current, longest } = calculateStreak(habitCompletions);
      const completionRate = Math.round((habitCompletions.length / 30) * 100);
      const completedToday = habitCompletions.some(c => c.completed_date === today);

      return {
        ...habit,
        completions: habitCompletions,
        currentStreak: current,
        longestStreak: longest,
        completionRate,
        completedToday,
      };
    });
  },

  async create(data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Habit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: habit, error } = await supabase
      .from('habits')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return habit as Habit;
  },

  async toggle(habitId: string, date?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('habit_completions')
      .select('id')
      .eq('habit_id', habitId)
      .eq('completed_date', targetDate)
      .maybeSingle();

    if (existing) {
      await supabase.from('habit_completions').delete().eq('id', existing.id);
    } else {
      await supabase.from('habit_completions').insert({
        habit_id: habitId,
        user_id: user.id,
        completed_date: targetDate,
      });
    }
  },

  async delete(habitId: string): Promise<void> {
    await supabase.from('habits').update({ is_active: false }).eq('id', habitId);
  },

  async update(id: string, data: Partial<Habit>): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
