import { supabase } from '@/integrations/supabase/client';

export interface PocketMoney {
  id: string;
  child_id: string;
  amount: number;
  month: string;
  paid: boolean;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface PocketMoneyCreateInput {
  child_id: string;
  amount: number;
  month: string;
  notes?: string;
}

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export const pocketMoneyService = {
  async getByChild(childId: string): Promise<PocketMoney[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('pocket_money')
      .select('*')
      .eq('user_id', userId)
      .eq('child_id', childId)
      .order('month', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PocketMoney[];
  },

  async create(input: PocketMoneyCreateInput): Promise<PocketMoney> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('pocket_money')
      .insert({
        user_id: userId,
        child_id: input.child_id,
        amount: input.amount,
        month: input.month,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as PocketMoney;
  },

  async markPaid(id: string): Promise<void> {
    const { error } = await supabase
      .from('pocket_money')
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
