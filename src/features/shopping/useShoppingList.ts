import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shoppingService } from './shoppingService';
import type { ShoppingItem } from './shoppingService';
import { toast } from 'sonner';
import { useT } from '@/i18n';

const KEY = ['shopping-items'];

export function useShoppingList() {
  return useQuery({ queryKey: KEY, queryFn: shoppingService.getAll });
}

export function useAddShoppingItem() {
  const qc = useQueryClient();
  const { t } = useT();
  return useMutation({
    mutationFn: (item: Omit<ShoppingItem, 'id' | 'user_id' | 'created_at'>) =>
      shoppingService.add(item),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: () => toast.error(t('error_save')),
  });
}

export function useToggleShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      shoppingService.toggle(id, checked),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shoppingService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useClearChecked() {
  const qc = useQueryClient();
  const { t } = useT();
  return useMutation({
    mutationFn: shoppingService.clearChecked,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(t('shopping_clear_done'));
    },
  });
}
