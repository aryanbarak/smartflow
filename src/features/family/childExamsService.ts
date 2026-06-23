import { supabase } from '@/integrations/supabase/client';

export interface Exam {
  id: string;
  child_id: string;
  subject: string;
  exam_date: string;
  grade: string | null;
  notes: string | null;
  created_at: string;
}

export interface ExamCreateInput {
  child_id: string;
  subject: string;
  exam_date: string;
  grade?: string;
  notes?: string;
}

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export const childExamsService = {
  async getByChild(childId: string): Promise<Exam[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('child_exams')
      .select('*')
      .eq('user_id', userId)
      .eq('child_id', childId)
      .order('exam_date');
    if (error) throw error;
    return (data ?? []) as Exam[];
  },

  async create(input: ExamCreateInput): Promise<Exam> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('child_exams')
      .insert({
        user_id: userId,
        child_id: input.child_id,
        subject: input.subject,
        exam_date: input.exam_date,
        grade: input.grade ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Exam;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('child_exams').delete().eq('id', id);
    if (error) throw error;
  },
};
