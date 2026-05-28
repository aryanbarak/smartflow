import { supabase } from '@/integrations/supabase/client';
import type { MoodLog, MoodScore } from './types';

function today() {
  return new Date().toISOString().split('T')[0];
}

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export const moodService = {
  async getToday(): Promise<MoodLog | null> {
    const user = await getUser();
    const { data } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today())
      .maybeSingle();
    return data as MoodLog | null;
  },

  async getLast14Days(): Promise<MoodLog[]> {
    const user = await getUser();
    const from = new Date();
    from.setDate(from.getDate() - 13);
    const fromStr = from.toISOString().split('T')[0];
    const { data } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', fromStr)
      .order('date', { ascending: true });
    return (data ?? []) as MoodLog[];
  },

  async upsert(mood: MoodScore, note?: string): Promise<void> {
    const user = await getUser();
    await supabase.from('mood_logs').upsert(
      { user_id: user.id, date: today(), mood, note: note ?? null },
      { onConflict: 'user_id,date' }
    );
  },
};
