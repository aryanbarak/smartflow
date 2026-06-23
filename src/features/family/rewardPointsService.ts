import { supabase } from '@/integrations/supabase/client';

export interface RewardPoint {
  id: string;
  child_id: string;
  points: number;
  reason: string;
  month: string;
  created_at: string;
}

export interface RewardPointCreateInput {
  child_id: string;
  points: number;
  reason: string;
  month: string;
}

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export const rewardPointsService = {
  async getByChild(childId: string): Promise<RewardPoint[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('reward_points')
      .select('*')
      .eq('user_id', userId)
      .eq('child_id', childId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as RewardPoint[];
  },

  async getMonthlyTotal(childId: string, month: string): Promise<number> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('reward_points')
      .select('points')
      .eq('user_id', userId)
      .eq('child_id', childId)
      .eq('month', month);
    if (error) throw error;
    return (data ?? []).reduce((sum, r) => sum + (r.points as number), 0);
  },

  async create(input: RewardPointCreateInput): Promise<RewardPoint> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('reward_points')
      .insert({
        user_id: userId,
        child_id: input.child_id,
        points: input.points,
        reason: input.reason,
        month: input.month,
      })
      .select()
      .single();
    if (error) throw error;
    return data as RewardPoint;
  },
};
