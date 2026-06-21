-- Add goal-based habit support.
--
-- Two habit types:
--   'ongoing' — recurring habits like exercise, drink water, meditate. These never
--     become "achieved" — they only have active/paused states (via is_active).
--     target_value/target_unit/achieved_at are ignored for ongoing habits.
--
--   'goal' — finite habits like "pass IHK exam", "read 20 books", "run 100km".
--     These have a target (target_value + target_unit) and get marked achieved_at
--     when the user reaches their goal. Once achieved, they're essentially "done"
--     but kept for history.
--
-- All existing habits default to 'ongoing' (safe — they were created before this
-- concept existed, and ongoing is the more common case).

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS habit_type TEXT NOT NULL DEFAULT 'ongoing'
    CHECK (habit_type IN ('ongoing', 'goal')),
  ADD COLUMN IF NOT EXISTS target_value INTEGER,
  ADD COLUMN IF NOT EXISTS target_unit TEXT,
  ADD COLUMN IF NOT EXISTS achieved_at TIMESTAMPTZ;
