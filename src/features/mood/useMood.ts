import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moodService } from './moodService';
import type { MoodScore } from './types';

export function useTodayMood() {
  return useQuery({
    queryKey: ['mood', 'today'],
    queryFn: moodService.getToday,
  });
}

export function useMoodHistory() {
  return useQuery({
    queryKey: ['mood', 'history'],
    queryFn: moodService.getLast14Days,
  });
}

export function useLogMood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mood, note }: { mood: MoodScore; note?: string }) =>
      moodService.upsert(mood, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mood'] });
    },
  });
}
