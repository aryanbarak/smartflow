import { supabase } from '@/integrations/supabase/client';

export interface BudgetLimit {
  id: string;
  category: string;
  limitAmount: number;
}

export const budgetLimitsDbService = {
  async getAll(): Promise<BudgetLimit[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('budget_limits')
      .select('id, category, limit_amount')
      .eq('user_id', user.id)
      .order('category');
    if (error) throw error;
    return (data ?? []).map(r => ({
      id: r.id as string,
      category: r.category as string,
      limitAmount: Number(r.limit_amount),
    }));
  },

  async upsert(category: string, limitAmount: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('budget_limits')
      .upsert(
        { user_id: user.id, category, limit_amount: limitAmount },
        { onConflict: 'user_id,category' },
      );
    if (error) throw error;
  },

  async remove(category: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('budget_limits')
      .delete()
      .eq('user_id', user.id)
      .eq('category', category);
    if (error) throw error;
  },
};
