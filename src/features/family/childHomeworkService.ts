import { supabase } from '@/integrations/supabase/client';

export interface Homework {
  id: string;
  child_id: string;
  subject: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
  completed_at: string | null;
  priority: 'low' | 'normal' | 'high';
  created_at: string;
}

export interface HomeworkCreateInput {
  child_id: string;
  subject: string;
  title: string;
  description?: string;
  due_date: string;
  priority?: 'low' | 'normal' | 'high';
}

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export const childHomeworkService = {
  async getByChild(childId: string): Promise<Homework[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('child_homework')
      .select('*')
      .eq('user_id', userId)
      .eq('child_id', childId)
      .order('due_date');
    if (error) throw error;
    return (data ?? []) as Homework[];
  },

  async getAllPending(): Promise<Homework[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('child_homework')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('due_date');
    if (error) throw error;
    return (data ?? []) as Homework[];
  },

  async create(input: HomeworkCreateInput): Promise<Homework> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('child_homework')
      .insert({
        user_id: userId,
        child_id: input.child_id,
        subject: input.subject,
        title: input.title,
        description: input.description ?? null,
        due_date: input.due_date,
        priority: input.priority ?? 'normal',
      })
      .select()
      .single();
    if (error) throw error;
    return data as Homework;
  },

  async complete(id: string): Promise<void> {
    const { error } = await supabase
      .from('child_homework')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('child_homework').delete().eq('id', id);
    if (error) throw error;
  },
};
