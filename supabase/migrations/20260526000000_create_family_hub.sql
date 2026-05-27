-- Children profiles (extends existing family_children)
ALTER TABLE family_children ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE family_children ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE family_children ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE family_children ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#38BDF8';

-- Daily checklist templates (reusable)
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES family_children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '✅',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily checklist completions
CREATE TABLE IF NOT EXISTS checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES family_children(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, date)
);

-- Homework/Tasks for children
CREATE TABLE IF NOT EXISTS child_homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES family_children(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL, -- YYYY-MM-DD
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal', -- 'low' | 'normal' | 'high'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exams
CREATE TABLE IF NOT EXISTS child_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES family_children(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_date TEXT NOT NULL, -- YYYY-MM-DD
  grade TEXT, -- result after exam
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pocket money
CREATE TABLE IF NOT EXISTS pocket_money (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES family_children(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, child_id, month)
);

-- Reward points
CREATE TABLE IF NOT EXISTS reward_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES family_children(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for all tables
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE pocket_money ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner" ON checklist_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner" ON checklist_completions FOR ALL USING (
  EXISTS (SELECT 1 FROM checklist_templates t WHERE t.id = template_id AND t.user_id = auth.uid())
);
CREATE POLICY "owner" ON child_homework FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner" ON child_exams FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner" ON pocket_money FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner" ON reward_points FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
