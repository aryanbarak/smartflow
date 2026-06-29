# Supabase Patterns — smartFlow

## Standard Service Function

```typescript
import { supabase } from '@/integrations/supabase/client';

export async function getItems(): Promise<Item[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
```

## Rules
- Always getUser() first — never trust client-side session alone
- Always check error before using data
- Return empty array [] not null for list queries
- Use .single() only when exactly one row is guaranteed to exist
- Use .maybeSingle() when the row might not exist (e.g. today's mood log, today's journal entry)
  — .single() throws a PostgreSQL error if zero rows; .maybeSingle() returns null

## Upsert Pattern (for unique-per-day rows)

```typescript
const { error } = await supabase
  .from('mood_logs')
  .upsert(
    { user_id: user.id, date: today, mood: score },
    { onConflict: 'user_id,date' }
  );
```

## RLS Policy Pattern (for new tables)

```sql
CREATE TABLE IF NOT EXISTS public.table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- columns here
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rows" ON public.table_name
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.table_name TO authenticated;
```

## Storage Pattern
- Bucket: `documents`
- Path: `{userId}/{fileName}`
- Always use signed URLs for private files
- Public URL only for avatars/public assets

## Credentials
- Supabase URL and anon key are hardcoded in src/integrations/supabase/client.ts
- These are public credentials (anon key + RLS) — safe to commit
- Do NOT add VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY as GitHub secrets
