# React Query Hook Template — dailyFlow

Create TanStack React Query v5 hooks for a feature.

## Feature: [FEATURE NAME]
## Service file: `src/features/[feature]/[feature]Service.ts`

## Full Template

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { [feature]Service } from './[feature]Service';
import type { [Item] } from './types';
import { toast } from 'sonner';
import { useT } from '@/i18n';

const QUERY_KEY = ['[feature-name]'];

// ── Queries ───────────────────────────────────────────────────────────────

export function use[Feature]s() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: [feature]Service.getAll,
  });
}

export function use[Feature]ById(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => [feature]Service.getById(id),
    enabled: !!id,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────

export function useCreate[Feature]() {
  const qc = useQueryClient();
  const { t } = useT();
  return useMutation({
    mutationFn: (payload: Omit<[Item], 'id' | 'user_id' | 'created_at'>) =>
      [feature]Service.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('[feature]_item_added'));
    },
    onError: () => toast.error(t('error_save')),
  });
}

export function useUpdate[Feature]() {
  const qc = useQueryClient();
  const { t } = useT();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<[Item]> }) =>
      [feature]Service.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('success'));
    },
    onError: () => toast.error(t('error_save')),
  });
}

export function useDelete[Feature]() {
  const qc = useQueryClient();
  const { t } = useT();
  return useMutation({
    mutationFn: (id: string) => [feature]Service.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('[feature]_item_deleted'));
    },
  });
}
```

## Key v5 Differences from v4
- `isPending` instead of `isLoading` for mutations
- `useMutation` no longer needs `mutationKey`
- `onSuccess`/`onError` still work the same way
- `queryKey` must always be an array
