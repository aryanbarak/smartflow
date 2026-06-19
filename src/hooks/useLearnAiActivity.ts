import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LearnAiActivity {
  totalQuestions: number;
  lastQuestion: { content: string; mode: string; createdAt: string } | null;
  mostActiveMode: { mode: string; count: number } | null;
}

async function fetchActivity(): Promise<LearnAiActivity> {
  const { data, error } = await supabase
    .from('learn_ai_messages')
    .select('content, mode, created_at')
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;

  const rows = data ?? [];
  const totalQuestions = rows.length;

  const lastQuestion = rows[0]
    ? { content: rows[0].content, mode: rows[0].mode, createdAt: rows[0].created_at }
    : null;

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.mode] = (counts[row.mode] ?? 0) + 1;
  }
  const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const mostActiveMode = topEntry ? { mode: topEntry[0], count: topEntry[1] } : null;

  return { totalQuestions, lastQuestion, mostActiveMode };
}

export function useLearnAiActivity() {
  return useQuery({
    queryKey: ['learn-ai-activity'],
    queryFn: fetchActivity,
    staleTime: 10 * 60 * 1000,
  });
}
