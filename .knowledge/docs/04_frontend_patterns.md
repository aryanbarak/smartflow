# smartFlow — Frontend Patterns

## Supabase Service Pattern (MUST follow exactly)

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

  async create(input: Omit<Item, 'id' | 'user_id' | 'created_at'>): Promise<Item> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('table_name')
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<Item>): Promise<void> {
    const { error } = await supabase
      .from('table_name')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('table_name')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
```

## React Query Hook Pattern (TanStack Query v5)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useT } from '@/i18n';

const QUERY_KEY = ['feature-name'];

export function useItems() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: featureService.getAll,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  const { t } = useT();
  return useMutation({
    mutationFn: featureService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('success'));
    },
    onError: () => toast.error(t('error_generic')),
  });
}
```

## Critical Rules
- NEVER create new supabase client — always import from '@/integrations/supabase/client'
- ALWAYS call getUser() before any DB operation
- Use `.maybeSingle()` not `.single()` when a row might not exist
- Use `isPending` not `isLoading` for mutations (v5 syntax)
- All UI strings via useT() hook — no hardcoded strings
- Toasts: `import { toast } from 'sonner'`
- Animations: Framer Motion — respect `reducedMotion` from `useAppearance()`
- Icons: Lucide React

## TypeScript Rules
- No `any` type — use `unknown` and narrow, or proper interface
- No non-null assertion `!` without explaining comment
- Mark component props as `Readonly<{ ... }>` (linter rule S6759)
- All async functions have explicit return type
- Import order: React → external libs → @/features → @/components → @/lib/@/hooks → types

## Common Linter Warnings to Avoid
- S6759: `Readonly<{...}>` props
- S3358: nested ternaries → extract to if/else
- S7735: negated condition as primary branch → reorder
- S6819: `div[role=button]` containing `button` → use sibling buttons
- S1128: unused imports
- S4325: unnecessary type assertions

## i18n Pattern

```typescript
import { useT } from '@/i18n';

function Component() {
  const { t, isRTL } = useT();
  return (
    <div>
      <h1>{t('habits_title')}</h1>
      <p>{t('habits_days', { count: streak })}</p>
    </div>
  );
}
```

Add new keys to ALL THREE languages (en, de, fa) in src/i18n/index.ts.

## Zustand Store Pattern

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyState {
  value: string;
  setValue: (v: string) => void;
}

export const useMyStore = create<MyState>()(
  persist(
    set => ({
      value: 'default',
      setValue: value => set({ value }),
    }),
    { name: 'smartflow:my-store' },
  ),
);
```

All Zustand persist keys are prefixed with `smartflow:`.
