import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardService } from './flashcardService';
import { toast } from 'sonner';
import type { Flashcard, Rating } from './types';

export function useDecks() {
  return useQuery({
    queryKey: ['flashcard-decks'],
    queryFn: flashcardService.getDecks,
  });
}

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      flashcardService.createDeck(name, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcard-decks'] });
      toast.success('Deck created');
    },
    onError: () => toast.error('Failed to create deck'),
  });
}

export function useDeleteDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => flashcardService.deleteDeck(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcard-decks'] });
      toast.success('Deck deleted');
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
  return useMutation({
    mutationFn: ({ front, back }: { front: string; back: string }) =>
      flashcardService.addCard(deckId, front, back),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flashcards', deckId] });
      qc.invalidateQueries({ queryKey: ['flashcards-due', deckId] });
      toast.success('Card added');
    },
    onError: () => toast.error('Failed to add card'),
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
