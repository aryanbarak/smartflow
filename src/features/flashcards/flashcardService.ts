import { supabase } from '@/integrations/supabase/client';
import { sm2 } from './spacedRepetition';
import type { FlashcardDeck, Flashcard, Rating } from './types';

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export const flashcardService = {
  async getDecks(): Promise<FlashcardDeck[]> {
    const user = await getUser();
    const { data } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return (data ?? []) as FlashcardDeck[];
  },

  async createDeck(name: string, description?: string): Promise<FlashcardDeck> {
    const user = await getUser();
    const { data, error } = await supabase
      .from('flashcard_decks')
      .insert({ user_id: user.id, name, description: description ?? null })
      .select()
      .single();
    if (error) throw error;
    return data as FlashcardDeck;
  },

  async deleteDeck(id: string): Promise<void> {
    await supabase.from('flashcard_decks').delete().eq('id', id);
  },

  async getCards(deckId: string): Promise<Flashcard[]> {
    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });
    return (data ?? []) as Flashcard[];
  },

  async getDueCards(deckId: string): Promise<Flashcard[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', deckId)
      .lte('next_review', today)
      .order('next_review', { ascending: true });
    return (data ?? []) as Flashcard[];
  },

  async addCard(deckId: string, front: string, back: string): Promise<void> {
    const user = await getUser();
    await supabase.from('flashcards').insert({
      deck_id: deckId,
      user_id: user.id,
      front,
      back,
    });
  },

  async deleteCard(id: string): Promise<void> {
    await supabase.from('flashcards').delete().eq('id', id);
  },

  async reviewCard(card: Flashcard, rating: Rating): Promise<void> {
    const { easeFactor, intervalDays, nextReview } = sm2(
      card.ease_factor,
      card.interval_days,
      rating,
    );
    await supabase
      .from('flashcards')
      .update({
        ease_factor: easeFactor,
        interval_days: intervalDays,
        next_review: nextReview,
        review_count: card.review_count + 1,
        last_rating: rating,
      })
      .eq('id', card.id);
  },
};
