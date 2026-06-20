-- Chat sessions — groups agent_chat_messages into distinct conversations.
-- Previously all messages were a single flat list per user with no session boundaries.

-- 1. Sessions table
CREATE TABLE public.chat_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_sessions_user_updated_idx
  ON public.chat_sessions (user_id, updated_at DESC);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_sessions_select_own"
  ON public.chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "chat_sessions_insert_own"
  ON public.chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_update_own"
  ON public.chat_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_delete_own"
  ON public.chat_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Add session_id to agent_chat_messages
-- Existing rows will have session_id = NULL. These are old messages from before
-- sessions were introduced and will not appear in the new session-based UI.
-- This is intentional — we are not migrating old history into a synthetic session.
ALTER TABLE public.agent_chat_messages
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS agent_chat_messages_session_id_idx
  ON public.agent_chat_messages (session_id, created_at);

-- 3. Update prune trigger
-- Decision: keep the prune trigger as a PER-USER global safety cap (100 messages total),
-- not per-session. Rationale: the FREE-tier 500MB storage limit is the real constraint,
-- and a per-user cap is simpler and guarantees bounded growth regardless of how many
-- sessions a user creates. If a user has 5 sessions with 20 messages each, they stay
-- under the cap. If they had 50 sessions with 100 each, a per-session cap wouldn't help.
-- The existing trigger already handles this correctly — no changes needed.
