import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardService } from './flashcardService';
import { toast } from 'sonner';
import type { Flashcard, Rating } from './types';
import { useT } from '@/i18n';

export function useDecks() {
  return useQuery({
    queryKey: ['flashcard-decks'],
    queryFn: flashcardService.getDecks,
  });
}

export function useCreateDeck() {
  const qc = useQueryClient();
  const { t } = useT();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      flashcardService.createDeck(name, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcard-decks'] });
      toast.success(t('flashcards_deck_added'));
    },
    onError: () => toast.error(t('error_save')),
  });
}

export function useDeleteDeck() {
  const qc = useQueryClient();
  const { t } = useT();
  return useMutation({
    mutationFn: (id: string) => flashcardService.deleteDeck(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcard-decks'] });
      toast.success(t('flashcards_deck_deleted'));
    },
  });
}

export function useCards(deckId: string) {
  return useQuery({
    queryKey: ['flashcards', deckId],
    queryFn: () => flashcardService.getCards(deckId),
    enabled: !!deckId,
  });
}

export function useDueCards(deckId: string) {
  return useQuery({
    queryKey: ['flashcards-due', deckId],
    queryFn: () => flashcardService.getDueCards(deckId),
    enabled: !!deckId,
  });
}

export function useAddCard(deckId: string) {
  const qc = useQueryClient();
  const { t } = useT();
  return useMutation({
    mutationFn: ({ front, back }: { front: string; back: string }) =>
      flashcardService.addCard(deckId, front, back),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards', deckId] });
      qc.invalidateQueries({ queryKey: ['flashcards-due', deckId] });
      toast.success(t('flashcards_card_added'));
    },
    onError: () => toast.error(t('error_save')),
  });
}

export function useDeleteCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flashcardService.deleteCard(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards', deckId] });
      qc.invalidateQueries({ queryKey: ['flashcards-due', deckId] });
    },
  });
}

export function useReviewCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ card, rating }: { card: Flashcard; rating: Rating }) =>
      flashcardService.reviewCard(card, rating),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards-due', deckId] });
      qc.invalidateQueries({ queryKey: ['flashcards', deckId] });
    },
  });
}
