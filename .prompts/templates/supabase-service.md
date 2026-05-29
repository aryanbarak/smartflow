# Supabase Service Template — dailyFlow

Create a typed Supabase service for a new feature.

## Feature: [FEATURE NAME]
## Table: [TABLE NAME]

## Full Template

```typescript
import { supabase } from '@/integrations/supabase/client';

export interface [Item] {
  id: string;
  user_id: string;
  // add fields here
  created_at: string;
}

export const [feature]Service = {
  async getAll(): Promise<[Item][]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('[table_name]')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<[Item] | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('[table_name]')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(payload: Omit<[Item], 'id' | 'user_id' | 'created_at'>): Promise<[Item]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('[table_name]')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Omit<[Item], 'id' | 'user_id' | 'created_at'>>): Promise<[Item]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('[table_name]')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('[table_name]')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },
};
```

## SQL Migration to run in Supabase Dashboard

```sql
CREATE TABLE IF NOT EXISTS public.[table_name] (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- add columns here
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.[table_name] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own [table_name]" ON public.[table_name]
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT ALL ON public.[table_name] TO authenticated;
```
