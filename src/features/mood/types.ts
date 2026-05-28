export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface MoodLog {
  id: string;
  user_id: string;
  date: string;
  mood: MoodScore;
  note: string | null;
  created_at: string;
}

export const MOOD_CONFIG: Record<MoodScore, { label: string; emoji: string; color: string }> = {
  1: { label: 'Terrible', emoji: '😞', color: '#ef4444' },
  2: { label: 'Bad',      emoji: '😕', color: '#f97316' },
  3: { label: 'Okay',     emoji: '😐', color: '#eab308' },
  4: { label: 'Good',     emoji: '🙂', color: '#22c55e' },
  5: { label: 'Great',    emoji: '😄', color: '#6366f1' },
};
