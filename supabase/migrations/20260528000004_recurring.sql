-- Add recurrence columns to tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,  -- 'daily'|'weekly'|'monthly'|'weekdays'
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Add recurrence columns to calendar_events
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
