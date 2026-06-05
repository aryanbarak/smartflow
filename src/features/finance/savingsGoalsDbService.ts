import { supabase } from '@/integrations/supabase/client';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  color: string;
  deadline?: string;
}

export const savingsGoalsDbService = {
  async getAll(): Promise<SavingsGoal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    if (error) throw error;
    return (data ?? []).map(r => ({
      id: r.id as string,
      name: r.name as string,
      targetAmount: Number(r.target_amount),
      savedAmount: Number(r.saved_amount),
      color: (r.color as string) ?? '#06b6d4',
      deadline: (r.deadline as string | null) ?? undefined,
    }));
  },

  async create(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: user.id,
        name: goal.name,
        target_amount: goal.targetAmount,
        saved_amount: goal.savedAmount,
        color: goal.color,
        deadline: goal.deadline ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id as string,
      name: data.name as string,
      targetAmount: Number(data.target_amount),
      savedAmount: Number(data.saved_amount),
      color: (data.color as string) ?? '#06b6d4',
      deadline: (data.deadline as string | null) ?? undefined,
    };
  },

  async updateSaved(id: string, savedAmount: number): Promise<void> {
    const { error } = await supabase
      .from('savings_goals')
      .update({ saved_amount: savedAmount, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
