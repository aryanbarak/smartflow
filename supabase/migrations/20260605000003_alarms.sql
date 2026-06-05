CREATE TABLE IF NOT EXISTS public.alarms (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type          TEXT        NOT NULL CHECK (source_type IN ('task', 'calendar_event')),
  source_id            UUID        NOT NULL,
  source_title         TEXT        NOT NULL,
  trigger_at           TIMESTAMPTZ NOT NULL,
  remind_before_minutes INTEGER    NOT NULL DEFAULT 60,
  is_fired             BOOLEAN     DEFAULT false,
  is_dismissed         BOOLEAN     DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alarms" ON public.alarms
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.alarms TO authenticated;

CREATE INDEX IF NOT EXISTS idx_alarms_user_pending
  ON public.alarms(user_id, trigger_at)
  WHERE is_fired = false AND is_dismissed = false;
