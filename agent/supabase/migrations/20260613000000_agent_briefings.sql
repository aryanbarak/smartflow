-- =============================================
-- DailyFlow AI Personal Agent — Phase 1
-- Migration: agent_briefings + user_settings
-- =============================================

-- زبان کاربر رو به user_settings اضافه کن
-- اگه جدول user_settings داری، فقط column اضافه کن
-- user_settings muss existieren, bevor die Spalte language ergänzt wird
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language   TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','de','fa')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_select_own" ON public.user_settings;
CREATE POLICY "user_settings_select_own" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_insert_own" ON public.user_settings;
CREATE POLICY "user_settings_insert_own" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_update_own" ON public.user_settings;
CREATE POLICY "user_settings_update_own" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en'
    CHECK (language IN ('en', 'de', 'fa'));

-- جدول اصلی briefing‌ها
CREATE TABLE IF NOT EXISTS public.agent_briefings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,          -- متن نهایی که Gemini تولید کرده
  language     TEXT NOT NULL DEFAULT 'en',
  context      JSONB,                  -- داده‌هایی که به Gemini فرستادیم (برای debug)
  triggered_by TEXT NOT NULL DEFAULT 'cron'
                 CHECK (triggered_by IN ('cron', 'user', 'alert')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- فقط آخرین briefing هر روز برای هر کاربر لازمه
CREATE INDEX IF NOT EXISTS idx_agent_briefings_user_date
  ON public.agent_briefings (user_id, created_at DESC);

-- RLS
ALTER TABLE public.agent_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own briefings"
  ON public.agent_briefings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role inserts briefings"
  ON public.agent_briefings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- GRANT
GRANT SELECT ON public.agent_briefings TO authenticated;
GRANT INSERT, SELECT ON public.agent_briefings TO service_role;
GRANT SELECT ON public.user_settings TO authenticated;
GRANT UPDATE (language) ON public.user_settings TO authenticated;
