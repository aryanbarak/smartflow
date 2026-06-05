import { supabase } from '@/integrations/supabase/client';

export interface TaskAsEvent {
  id: string;
  title: string;
  date: string;
  isOverdue: boolean;
}

export async function getTasksAsEvents(
  fromDate: string,
  toDate: string,
): Promise<TaskAsEvent[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, due_date, completed')
    .eq('user_id', user.id)
    .eq('completed', false)
    .not('due_date', 'is', null)
    .gte('due_date', fromDate)
    .lte('due_date', toDate)
    .order('due_date');

  if (error) throw error;

  return (data ?? []).map(task => ({
    id: task.id,
    title: task.title,
    date: task.due_date as string,
    isOverdue: (task.due_date as string) < today,
  }));
}
