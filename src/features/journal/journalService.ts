import { supabase } from '@/integrations/supabase/client';
import type { JournalEntry, Mood } from './types';

export const journalService = {
  async getByDate(date: string): Promise<JournalEntry | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle();

    if (error) throw error;
    return data as JournalEntry | null;
  },

  async getMonth(year: number, month: number): Promise<JournalEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month

    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, date, mood')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date');

    if (error) throw error;
    return (data || []) as JournalEntry[];
  },

  async upsert(date: string, content: string, mood: Mood | null): Promise<JournalEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('journal_entries')
      .upsert({ user_id: user.id, date, content, mood }, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) throw error;
    return data as JournalEntry;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (error) throw error;
  },
};
