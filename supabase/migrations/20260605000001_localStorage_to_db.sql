-- Budget Limits (per-category monthly spending caps)
CREATE TABLE IF NOT EXISTS public.budget_limits (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    TEXT        NOT NULL,
  limit_amount NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category)
);
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own budget_limits" ON public.budget_limits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.budget_limits TO authenticated;

-- Savings Goals
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  saved_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  color         TEXT        DEFAULT '#06b6d4',
  deadline      DATE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own savings_goals" ON public.savings_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.savings_goals TO authenticated;

-- Recurring Transactions (monthly recurring income/expense templates)
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  type         TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  category     TEXT        NOT NULL,
  day_of_month INTEGER     NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
  last_applied TEXT,       -- 'YYYY-MM'
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recurring_transactions" ON public.recurring_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.recurring_transactions TO authenticated;
