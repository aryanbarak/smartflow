import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsService } from './habitsService';
import { toast } from 'sonner';
import type { Habit } from './types';

const QUERY_KEY = ['habits'];

export function useHabits() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: habitsService.getAll,
  });
}

export function useToggleHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date?: string }) =>
      habitsService.toggle(habitId, date),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: () => toast.error('Failed to update habit'),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      habitsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Habit created');
    },
    onError: () => toast.error('Failed to create habit'),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Habit deleted');
    },
  });
}
