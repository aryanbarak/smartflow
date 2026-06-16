-- This migration documents a change already applied manually to production.
-- The user_context_source_check constraint was updated to allow source='agent'
-- so that the agent worker can write extracted memory facts via upsert.

ALTER TABLE public.user_context DROP CONSTRAINT user_context_source_check;
ALTER TABLE public.user_context ADD CONSTRAINT user_context_source_check
  CHECK (source = ANY (ARRAY['manual'::text, 'auto'::text, 'ai'::text, 'agent'::text]));
