# React Query Hook Refactor Prompt — dailyFlow

Refactor the following hook using TanStack React Query v5.

## Rules
- useQuery for reads, useMutation for writes
- queryKey: descriptive array e.g. ['habits'] or ['habits', deckId]
- invalidateQueries after every mutation success
- onError: toast.error(t('error_generic')) or specific key
- onSuccess: toast.success(t('...')) where user feedback is needed
- isPending not isLoading (v5 change for mutations)
- Call useT() at top level of each hook function (valid — hooks called from hooks)

## Pattern to Follow

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featureService } from './featureService';
import { toast } from 'sonner';
import { useT } from '@/i18n';

const QUERY_KEY = ['feature-name'];

export function useFeatureItems() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: featureService.getAll,
  });
}

export function useCreateFeatureItem() {
  const qc = useQueryClient();
  const { t } = useT();
  return useMutation({
    mutationFn: featureService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('feature_item_added'));
    },
    onError: () => toast.error(t('error_save')),
  });
}

export function useDeleteFeatureItem() {
  const qc = useQueryClient();
  const { t } = useT();
  return useMutation({
    mutationFn: (id: string) => featureService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('feature_item_deleted'));
    },
  });
}
```

## Hook to Refactor:
[PASTE HOOK HERE]
