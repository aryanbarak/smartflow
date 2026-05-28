import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalService } from './journalService';
import type { Mood } from './types';

export function useJournalEntry(date: string) {
  return useQuery({
    queryKey: ['journal', date],
    queryFn: () => journalService.getByDate(date),
    staleTime: 30_000,
  });
}

export function useJournalMonth(year: number, month: number) {
  return useQuery({
    queryKey: ['journal-month', year, month],
    queryFn: () => journalService.getMonth(year, month),
    staleTime: 60_000,
  });
}

export function useUpsertJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, content, mood }: { date: string; content: string; mood: Mood | null }) =>
      journalService.upsert(date, content, mood),
    onSuccess: (entry) => {
      qc.setQueryData(['journal', entry.date], entry);
      qc.invalidateQueries({ queryKey: ['journal-month'] });
    },
  });
}
