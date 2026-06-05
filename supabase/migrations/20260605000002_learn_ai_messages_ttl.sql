-- Prune learn_ai_messages to last 100 per user per mode after each insert.
-- Prevents unbounded growth on Supabase FREE tier.
CREATE OR REPLACE FUNCTION public.prune_learn_ai_messages()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.learn_ai_messages
  WHERE user_id = NEW.user_id
    AND mode = NEW.mode
    AND id NOT IN (
      SELECT id
      FROM public.learn_ai_messages
      WHERE user_id = NEW.user_id
        AND mode = NEW.mode
      ORDER BY created_at DESC
      LIMIT 100
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prune_learn_ai_messages ON public.learn_ai_messages;
CREATE TRIGGER trg_prune_learn_ai_messages
  AFTER INSERT ON public.learn_ai_messages
  FOR EACH ROW EXECUTE FUNCTION public.prune_learn_ai_messages();
