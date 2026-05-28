export interface FlashcardDeck {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  user_id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  next_review: string;
  review_count: number;
  last_rating: number | null;
  created_at: string;
}

export type Rating = 0 | 1 | 2 | 3;

export const RATING_CONFIG: Record<Rating, { label: string; color: string }> = {
  0: { label: 'Again', color: '#ef4444' },
  1: { label: 'Hard',  color: '#f97316' },
  2: { label: 'Good',  color: '#22c55e' },
  3: { label: 'Easy',  color: '#6366f1' },
};
