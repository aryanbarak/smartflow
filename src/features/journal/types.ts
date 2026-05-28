export type Mood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export interface JournalEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  mood: Mood | null;
  content: string;
  created_at: string;
  updated_at: string;
}
