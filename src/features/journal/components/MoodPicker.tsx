import { motion } from 'framer-motion';
import type { Mood } from '../types';

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'great',    emoji: '😄', label: 'Great' },
  { value: 'good',     emoji: '🙂', label: 'Good' },
  { value: 'okay',     emoji: '😐', label: 'Okay' },
  { value: 'bad',      emoji: '😕', label: 'Bad' },
  { value: 'terrible', emoji: '😞', label: 'Terrible' },
];

interface Props {
  readonly value: Mood | null;
  readonly onChange: (mood: Mood) => void;
}

export function MoodPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {MOODS.map(m => (
        <motion.button
          key={m.value}
          type="button"
          title={m.label}
          onClick={() => onChange(m.value)}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          animate={value === m.value ? { scale: 1.3 } : { scale: 1 }}
          className={`text-2xl rounded-xl p-2 transition-colors ${
            value === m.value
              ? 'bg-primary/15 ring-2 ring-indigo-400'
              : 'hover:bg-muted'
          }`}
        >
          {m.emoji}
        </motion.button>
      ))}
    </div>
  );
}

export function moodEmoji(mood: Mood | null): string {
  return MOODS.find(m => m.value === mood)?.emoji ?? '';
}
