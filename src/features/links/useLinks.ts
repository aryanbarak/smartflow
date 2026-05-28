import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { linksService, type Link } from './linksService';

const QK = ['links'] as const;

export function useLinks() {
  return useQuery({ queryKey: QK, queryFn: linksService.getAll, staleTime: 30_000 });
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: linksService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useUpdateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<Link, 'url' | 'title' | 'description' | 'tags' | 'is_favorite'>> }) =>
      linksService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: linksService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) =>
      linksService.toggleFavorite(id, current),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}
