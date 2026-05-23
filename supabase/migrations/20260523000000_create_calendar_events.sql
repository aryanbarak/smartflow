CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  start_time TEXT,              -- HH:MM (nullable)
  end_time TEXT,                -- HH:MM (nullable)
  location TEXT,
  description TEXT,
  color TEXT,
  type TEXT,                    -- 'personal' | 'family' | 'work' | 'health'
  all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own events"
ON calendar_events FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_calendar_events_user_date
ON calendar_events(user_id, date);
