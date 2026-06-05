import { supabase } from '@/integrations/supabase/client';

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  dayOfMonth: number;
  lastApplied?: string;
}

export const recurringTransactionsDbService = {
  async getAll(): Promise<RecurringTransaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => ({
      id: r.id as string,
      title: r.title as string,
      amount: Number(r.amount),
      type: r.type as 'income' | 'expense',
      category: r.category as string,
      dayOfMonth: r.day_of_month as number,
      lastApplied: (r.last_applied as string | null) ?? undefined,
    }));
  },

  async create(tx: Omit<RecurringTransaction, 'id'>): Promise<RecurringTransaction> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({
        user_id: user.id,
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        day_of_month: tx.dayOfMonth,
        last_applied: tx.lastApplied ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id as string,
      title: data.title as string,
      amount: Number(data.amount),
      type: data.type as 'income' | 'expense',
      category: data.category as string,
      dayOfMonth: data.day_of_month as number,
      lastApplied: (data.last_applied as string | null) ?? undefined,
    };
  },

  async updateLastApplied(id: string, month: string): Promise<void> {
    const { error } = await supabase
      .from('recurring_transactions')
      .update({ last_applied: month, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
