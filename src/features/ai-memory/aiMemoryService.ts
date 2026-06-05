import { supabase } from '@/integrations/supabase/client';

export type MemorySource = 'manual' | 'auto' | 'ai';

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  source: MemorySource;
  updatedAt: string;
}

export const MEMORY_KEYS = [
  { key: 'goal_primary',    label: 'Primary Goal',        placeholder: 'e.g. Find a job as Fachinformatiker' },
  { key: 'goal_secondary',  label: 'Secondary Goal',      placeholder: 'e.g. Learn React Native' },
  { key: 'work_status',     label: 'Work Status',         placeholder: 'e.g. Job seeking, completed IHK exam' },
  { key: 'mood_pattern',    label: 'Mood Pattern',        placeholder: 'Auto-detected from Journal' },
  { key: 'habit_pattern',   label: 'Habit Pattern',       placeholder: 'Auto-detected from Habits' },
  { key: 'finance_pattern', label: 'Finance Pattern',     placeholder: 'Auto-detected from Finance' },
  { key: 'family_note',     label: 'Family Notes',        placeholder: 'e.g. Kids school schedule' },
  { key: 'health_note',     label: 'Health Notes',        placeholder: 'e.g. Running 3x/week' },
  { key: 'learning_note',   label: 'Learning Focus',      placeholder: 'e.g. Studying algorithms' },
  { key: 'custom_1',        label: 'Custom Note 1',       placeholder: 'Anything you want AI to remember' },
  { key: 'custom_2',        label: 'Custom Note 2',       placeholder: 'Anything you want AI to remember' },
  { key: 'custom_3',        label: 'Custom Note 3',       placeholder: 'Anything you want AI to remember' },
] as const;

function mapRow(row: Record<string, unknown>): MemoryEntry {
  return {
    id: row.id as string,
    key: row.key as string,
    value: row.value as string,
    source: row.source as MemorySource,
    updatedAt: row.updated_at as string,
  };
}

export const aiMemoryService = {
  async getAll(): Promise<MemoryEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('user_context')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(r => mapRow(r as Record<string, unknown>));
  },

  async set(key: string, value: string, source: MemorySource = 'manual'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('user_context')
      .upsert({ user_id: user.id, key, value, source }, { onConflict: 'user_id,key' });
    if (error) throw error;
  },

  async delete(key: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('user_context')
      .delete()
      .eq('user_id', user.id)
      .eq('key', key);
    if (error) throw error;
  },

  async getAsPromptContext(): Promise<string> {
    const entries = await aiMemoryService.getAll();
    const lines = entries
      .filter(e => e.value.trim())
      .map(e => {
        const label = MEMORY_KEYS.find(k => k.key === e.key)?.label ?? e.key;
        return `- ${label}: ${e.value}`;
      });
    if (!lines.length) return '';
    return `\n\nUSER CONTEXT (personal facts — use these to personalize your response):\n${lines.join('\n')}`;
  },

  async autoDetectAndSave(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Mood pattern from journal
    const { data: moodData } = await supabase
      .from('journal_entries')
      .select('mood')
      .eq('user_id', user.id)
      .gte('date', weekAgo)
      .not('mood', 'is', null);

    if (moodData && moodData.length >= 3) {
      const moods = moodData.map(m => m.mood as number);
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      const trend = avg >= 4 ? 'positive' : avg >= 3 ? 'neutral' : 'low';
      await aiMemoryService.set('mood_pattern', `Average mood last 7 days: ${avg.toFixed(1)}/5 (${trend})`, 'auto');
    }

    // Habit completion pattern
    const [{ data: habitData }, { data: habits }] = await Promise.all([
      supabase.from('habit_completions').select('habit_id').eq('user_id', user.id).gte('completed_date', weekAgo),
      supabase.from('habits').select('id').eq('user_id', user.id).eq('is_active', true),
    ]);

    if (habits && habits.length > 0 && habitData) {
      const rate = Math.round((habitData.length / (habits.length * 7)) * 100);
      await aiMemoryService.set('habit_pattern', `Habit completion last 7 days: ${rate}% (${habitData.length}/${habits.length * 7} sessions)`, 'auto');
    }

    // Top finance category
    const { data: financeData } = await supabase
      .from('finance_transactions')
      .select('type, amount, category')
      .eq('user_id', user.id)
      .gte('date', monthAgo);

    if (financeData && financeData.length > 0) {
      const topEntry = Object.entries(
        financeData
          .filter(t => t.type === 'expense')
          .reduce<Record<string, number>>((acc, t) => {
            acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
            return acc;
          }, {}),
      ).sort((a, b) => b[1] - a[1])[0];

      if (topEntry) {
        await aiMemoryService.set('finance_pattern', `Top expense last 30 days: ${topEntry[0]} (€${topEntry[1].toFixed(0)})`, 'auto');
      }
    }
  },
};
