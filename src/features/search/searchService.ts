import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'task' | 'event' | 'document' | 'finance' | 'habit';
  title: string;
  subtitle?: string;
  date?: string;
  route: string;
  icon: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.length < 2) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [tasks, events, docs, finance] = await Promise.all([
    supabase
      .from('tasks').select('id, title, due_date, completed')
      .eq('user_id', user.id).ilike('title', `%${query}%`).limit(5),
    supabase
      .from('calendar_events').select('id, title, date, location')
      .eq('user_id', user.id).ilike('title', `%${query}%`).limit(5),
    supabase
      .from('documents').select('id, title, file_name, created_at')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,file_name.ilike.%${query}%`).limit(5),
    supabase
      .from('finance_transactions').select('id, category, amount, date, notes')
      .eq('user_id', user.id).ilike('category', `%${query}%`).limit(3),
  ]);

  const results: SearchResult[] = [];

  (tasks.data || []).forEach(t => results.push({
    id: t.id, type: 'task',
    title: t.title,
    subtitle: t.due_date ? `سررسید: ${t.due_date}` : undefined,
    date: t.due_date ?? undefined,
    route: '/tasks',
    icon: t.completed ? '✅' : '📋',
  }));

  (events.data || []).forEach(e => results.push({
    id: e.id, type: 'event',
    title: e.title,
    subtitle: e.location ?? e.date ?? undefined,
    date: e.date ?? undefined,
    route: '/calendar',
    icon: '📅',
  }));

  (docs.data || []).forEach(d => results.push({
    id: d.id, type: 'document',
    title: d.title || d.file_name,
    subtitle: 'سند',
    date: d.created_at,
    route: '/documents',
    icon: '📄',
  }));

  (finance.data || []).forEach(f => results.push({
    id: f.id, type: 'finance',
    title: f.category,
    subtitle: `${f.amount} € · ${f.date}`,
    date: f.date,
    route: '/finance',
    icon: '💰',
  }));

  return results.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}
