import { supabase } from '@/integrations/supabase/client';

export const dataExportService = {
  async exportAll(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [tasks, events, finance, family, messages, journalEntries, moodLogs] =
      await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('calendar_events').select('*').eq('user_id', user.id),
        supabase.from('finance_transactions').select('*').eq('user_id', user.id),
        supabase.from('family_children').select('*').eq('user_id', user.id),
        supabase.from('learn_ai_messages').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id),
        supabase.from('mood_logs').select('*').eq('user_id', user.id),
      ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_email: user.email,
      data: {
        tasks: tasks.data ?? [],
        calendar_events: events.data ?? [],
        finance_transactions: finance.data ?? [],
        family_children: family.data ?? [],
        learn_ai_messages: messages.data ?? [],
        journal_entries: journalEntries.data ?? [],
        mood_logs: moodLogs.data ?? [],
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dailyflow-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async deleteAllUserData(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await Promise.all([
      supabase.from('learn_ai_messages').delete().eq('user_id', user.id),
      supabase.from('finance_transactions').delete().eq('user_id', user.id),
      supabase.from('calendar_events').delete().eq('user_id', user.id),
      supabase.from('tasks').delete().eq('user_id', user.id),
      supabase.from('family_children').delete().eq('user_id', user.id),
      supabase.from('journal_entries').delete().eq('user_id', user.id),
      supabase.from('mood_logs').delete().eq('user_id', user.id),
      supabase.from('shopping_items').delete().eq('user_id', user.id),
    ]);

    const { data: files } = await supabase.storage.from('documents').list(user.id);
    if (files?.length) {
      await supabase.storage.from('documents').remove(files.map(f => `${user.id}/${f.name}`));
    }
  },

  getStorageStats(): { used: string; keyCount: number } {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('dailyflow:'));
    const totalBytes = keys.reduce(
      (sum, k) => sum + (localStorage.getItem(k)?.length ?? 0) * 2,
      0,
    );
    const used = totalBytes > 1024 ? `${(totalBytes / 1024).toFixed(1)} KB` : `${totalBytes} B`;
    return { used, keyCount: keys.length };
  },

  clearLocalStorage(): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith('dailyflow:'))
      .forEach(k => localStorage.removeItem(k));
  },
};
