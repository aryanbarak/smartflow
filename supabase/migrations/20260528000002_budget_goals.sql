-- Budget Goals table
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE budget_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  monthly_limit NUMERIC(12,2) NOT NULL,
  period TEXT DEFAULT 'monthly',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, period)
);

ALTER TABLE budget_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_goals_user_policy" ON budget_goals
  FOR ALL USING (auth.uid() = user_id);

GRANT ALL ON budget_goals TO authenticated;
