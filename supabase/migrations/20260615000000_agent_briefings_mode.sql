-- Add mode column to agent_briefings (daily | weekly).
-- Run this in the Supabase dashboard SQL editor before deploying the updated worker.
ALTER TABLE public.agent_briefings
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'daily';
