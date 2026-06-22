import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChatSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setSessions(data as ChatSession[]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createSession = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;
    const title = firstMessage.length > 40
      ? firstMessage.slice(0, 40) + '...'
      : firstMessage;

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, title })
      .select('id')
      .single();

    if (error || !data) return null;
    void refresh();
    return data.id;
  }, [user, refresh]);

  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);
    if (error) return false;
    void refresh();
    return true;
  }, [user, refresh]);

  return { sessions, isLoading, refresh, createSession, deleteSession };
}
