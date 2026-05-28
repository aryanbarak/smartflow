import type { Mood } from '../types';

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'great',    emoji: '😄', label: 'عالی' },
  { value: 'good',     emoji: '🙂', label: 'خوب' },
  { value: 'okay',     emoji: '😐', label: 'معمولی' },
  { value: 'bad',      emoji: '😕', label: 'بد' },
  { value: 'terrible', emoji: '😞', label: 'خیلی بد' },
];

interface Props {
  value: Mood | null;
  onChange: (mood: Mood) => void;
}

export function MoodPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {MOODS.map(m => (
        <button
          key={m.value}
          type="button"
          title={m.label}
          onClick={() => onChange(m.value)}
          className={`text-2xl rounded-xl p-2 transition-all ${
            value === m.value
              ? 'bg-primary/15 ring-2 ring-primary scale-110'
              : 'hover:bg-muted'
          }`}
        >
          {m.emoji}
        </button>
      ))}
    </div>
  );
}

export function moodEmoji(mood: Mood | null): string {
  return MOODS.find(m => m.value === mood)?.emoji ?? '';
}
