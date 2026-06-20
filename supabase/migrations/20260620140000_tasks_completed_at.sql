-- Add completed_at timestamp to tasks table.
-- Tracks WHEN a task was marked complete, enabling week-over-week trend calculations
-- (e.g. "tasks completed this week vs last week" in Productivity Stats).
--
-- Existing completed tasks (completed = true) will have completed_at = NULL.
-- This is intentional — we have no historical record of when they were completed,
-- so they are excluded from trend calculations. New completions from this point
-- forward will be timestamped correctly by the frontend/service layer.
-- No backfill is performed.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
