-- Prune agent_chat_messages to the most recent 100 per user after each insert.
-- Prevents unbounded growth on Supabase FREE tier (same pattern as learn_ai_messages).
CREATE OR REPLACE FUNCTION public.prune_agent_chat_messages()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.agent_chat_messages
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id
      FROM public.agent_chat_messages
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      LIMIT 100
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prune_agent_chat_messages ON public.agent_chat_messages;
CREATE TRIGGER trg_prune_agent_chat_messages
  AFTER INSERT ON public.agent_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.prune_agent_chat_messages();
