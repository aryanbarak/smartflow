CREATE TABLE IF NOT EXISTS public.user_context (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        TEXT        NOT NULL,
  value      TEXT        NOT NULL,
  source     TEXT        NOT NULL DEFAULT 'manual'
               CHECK (source IN ('manual', 'auto', 'ai')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, key)
);

ALTER TABLE public.user_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own context" ON public.user_context
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.user_context TO authenticated;

CREATE OR REPLACE FUNCTION public.update_user_context_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_context_updated_at
  BEFORE UPDATE ON public.user_context
  FOR EACH ROW EXECUTE FUNCTION public.update_user_context_updated_at();
