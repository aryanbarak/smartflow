# Service Refactor Prompt — dailyFlow

Refactor the following Supabase service for the dailyFlow app.

## Goals
- Proper TypeScript return types on all functions
- getUser() called at start of every function
- Consistent error handling (throw error, not return null)
- Group related queries with Promise.all where possible
- Use .maybeSingle() not .single() for optionally-present rows

## Pattern to Follow

```typescript
import { supabase } from '@/integrations/supabase/client';

export const featureService = {
  async getAll(): Promise<Item[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(payload: Omit<Item, 'id' | 'user_id' | 'created_at'>): Promise<Item> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('table_name')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('table_name')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
  },
};
```

## Service to Refactor:
[PASTE SERVICE HERE]
