import { supabase } from '@/integrations/supabase/client';

export interface BudgetGoal {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  period: 'monthly' | 'weekly';
  color: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetGoalWithSpend extends BudgetGoal {
  spent: number;
  percentage: number;
  remaining: number;
  status: 'safe' | 'warning' | 'over';
}

export const budgetGoalsService = {
  async getWithSpend(): Promise<BudgetGoalWithSpend[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [{ data: goals, error: gErr }, { data: transactions }] = await Promise.all([
      supabase.from('budget_goals').select('*').eq('user_id', user.id),
      supabase
        .from('finance_transactions')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', startOfMonth),
    ]);

    if (gErr) throw gErr;

    return (goals || []).map(goal => {
      const spent = (transactions || [])
        .filter(t => t.category === goal.category)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const limit = Number(goal.monthly_limit);
      const percentage = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 999) : 0;
      const remaining = limit - spent;
      const status: BudgetGoalWithSpend['status'] =
        percentage >= 100 ? 'over' : percentage >= 80 ? 'warning' : 'safe';

      return { ...goal, monthly_limit: limit, spent, percentage, remaining, status };
    });
  },

  async upsert(data: Omit<BudgetGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('budget_goals').upsert(
      { ...data, user_id: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,category,period' }
    );
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('budget_goals').delete().eq('id', id);
    if (error) throw error;
  },
};
