# smartFlow — Database Schema

## Supabase Project
- Project ID: taqxwnlwllbywaklwyno
- URL: https://taqxwnlwllbywaklwyno.supabase.co
- Plan: FREE tier (pauses after 7 days inactivity)
- Owner: barakzahi@web.de

## Standard RLS Pattern (apply to every table)

```sql
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own table_name" ON public.table_name
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.table_name TO authenticated;
```

## Critical Query Rules
- Always use `.maybeSingle()` (not `.single()`) when a row might not exist
  (e.g. today's mood_log, today's journal_entry — .single() throws if 0 rows)
- Always call `getUser()` before any DB operation

## Tables

### tasks
- id UUID PK, user_id UUID FK → auth.users
- title TEXT NOT NULL, notes TEXT
- due_date DATE (YYYY-MM-DD), completed BOOLEAN DEFAULT false
- recurrence_rule TEXT, recurrence_end_date DATE
- created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ

### calendar_events
- id UUID PK, user_id UUID FK
- title TEXT, date DATE (YYYY-MM-DD)
- start_time TEXT (HH:MM or null), end_time TEXT (HH:MM or null)
- location TEXT, description TEXT, color TEXT (hex), type TEXT
- all_day BOOLEAN, recurrence_rule TEXT, recurrence_end_date DATE
- created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ

### finance_transactions
- id UUID PK, user_id UUID FK
- type TEXT ('income' | 'expense'), amount NUMERIC(12,2)
- category TEXT, date DATE, notes TEXT
- created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ

### family_children
- id UUID PK, user_id UUID FK
- name TEXT, age INTEGER, color TEXT (hex), initials TEXT, role TEXT
- schedule JSONB, notes JSONB, events JSONB
- created_at TIMESTAMPTZ

### documents
- id UUID PK, user_id UUID FK
- storage_path TEXT, file_name TEXT, mime_type TEXT, size_bytes INTEGER
- title TEXT, description TEXT
- created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ

### learn_ai_messages
- id UUID PK, user_id UUID FK
- mode TEXT (fiae_algorithms | general_it | wiso | planner)
- language TEXT (de | fa | en)
- role TEXT (user | assistant), content TEXT
- created_at TIMESTAMPTZ

### habits
- id UUID PK, user_id UUID FK
- title TEXT NOT NULL, description TEXT
- color TEXT (hex) DEFAULT '#6366f1', icon TEXT DEFAULT '⭐'
- frequency TEXT (daily | weekly), target_days INTEGER DEFAULT 1
- is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ

### habit_completions
- id UUID PK, user_id UUID FK
- habit_id UUID FK → habits ON DELETE CASCADE
- completed_date DATE NOT NULL
- UNIQUE(habit_id, completed_date)

### journal_entries
- id UUID PK, user_id UUID FK
- date DATE NOT NULL, content TEXT DEFAULT '', mood SMALLINT (1–5)
- created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
- UNIQUE(user_id, date)

### flashcard_decks
- id UUID PK, user_id UUID FK
- name TEXT NOT NULL, description TEXT
- created_at TIMESTAMPTZ

### flashcards
- id UUID PK, user_id UUID FK
- deck_id UUID FK → flashcard_decks ON DELETE CASCADE
- front TEXT NOT NULL, back TEXT NOT NULL
- ease_factor REAL DEFAULT 2.5, interval_days INT DEFAULT 1
- next_review DATE DEFAULT CURRENT_DATE
- review_count INT DEFAULT 0, last_rating SMALLINT
- created_at TIMESTAMPTZ

### mood_logs
- id UUID PK, user_id UUID FK
- date DATE NOT NULL, mood SMALLINT CHECK(1–5), note TEXT
- created_at TIMESTAMPTZ
- UNIQUE(user_id, date)

### shopping_items
- id UUID PK, user_id UUID FK
- name TEXT NOT NULL, category TEXT DEFAULT 'Other'
- quantity NUMERIC, unit TEXT, checked BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ

### links
- id UUID PK, user_id UUID FK
- url TEXT NOT NULL, title TEXT, description TEXT
- favicon_url TEXT, tags TEXT[] DEFAULT '{}', is_favorite BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ

## Storage Buckets
- `documents`: private, path = {userId}/{fileName}
