# Supabase Migration — dailyFlow

## Project
- Supabase project: taqxwnlwllbywaklwyno
- Free tier — migrations run manually via SQL Editor
- Migration files: supabase/migrations/

## Migration File Naming
```
supabase/migrations/YYYYMMDDHHMMSS_description.sql
Example: supabase/migrations/20260528000001_habit_tracker.sql
```

## Standard Migration Template

```sql
-- ============================================
-- Migration: [description]
-- Date: [YYYY-MM-DD]
-- ============================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- add columns here
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy
CREATE POLICY "Users manage own table_name" ON public.table_name
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Grant access
GRANT ALL ON public.table_name TO authenticated;

-- 5. Auto-update updated_at (optional)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER table_name_updated_at
  BEFORE UPDATE ON public.table_name
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## How to Run
1. Open Supabase Dashboard → SQL Editor
2. Paste migration SQL
3. Click Run
4. Verify in Table Editor

## Pre-Migration Checklist
- [ ] Migration file saved in `supabase/migrations/`
- [ ] Table name is snake_case
- [ ] RLS policy uses `auth.uid() = user_id` pattern
- [ ] GRANT ALL TO authenticated included
- [ ] Tested in SQL Editor before committing
- [ ] `.maybeSingle()` used in service if row may not exist

## Post-Migration Checklist
- [ ] Table visible in Table Editor
- [ ] RLS policies visible in Authentication → Policies
- [ ] New service + hook created for the table
- [ ] i18n keys added to src/i18n/index.ts (en/de/fa)
- [ ] CLAUDE_CONTEXT.md updated with new table schema

## Migration Task:
[DESCRIBE WHAT TABLE/COLUMN TO CREATE OR MODIFY]
