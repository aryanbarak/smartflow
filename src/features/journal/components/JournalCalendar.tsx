import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useJournalMonth } from '../useJournal';
import { moodEmoji } from './MoodPicker';
import type { Mood } from '../types';

interface Props {
  selectedDate: string;
  onSelect: (date: string) => void;
}

function toKey(date: Date) {
  return date.toISOString().split('T')[0];
}

export function JournalCalendar({ selectedDate, onSelect }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);

  const { data: entries = [] } = useJournalMonth(viewYear, viewMonth);
  const entryMap = new Map(entries.map(e => [e.date, e.mood]));

  const firstDay = new Date(viewYear, viewMonth - 1, 1);
  const lastDay = new Date(viewYear, viewMonth, 0);
  const startPad = firstDay.getDay(); // 0=Sun

  const days: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(viewYear, viewMonth - 1, i + 1)),
  ];

  function prev() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  }
  function next() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  }

  const monthLabel = firstDay.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });

  return (
    <div className="bg-card border border-border rounded-xl p-4 select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prev} className="p-1 rounded hover:bg-muted"><ChevronRight size={16} /></button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <button type="button" onClick={next} className="p-1 rounded hover:bg-muted"><ChevronLeft size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'].map(d => (
          <div key={d} className="text-xs text-muted-foreground py-1">{d}</div>
        ))}
        {days.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} />;
          const key = toKey(day);
          const emoji = moodEmoji(entryMap.get(key) as Mood | undefined ?? null);
          const isSelected = key === selectedDate;
          const isToday = key === toKey(today);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`relative flex flex-col items-center justify-center rounded-lg py-1.5 text-xs transition-colors ${
                isSelected ? 'bg-primary text-primary-foreground' :
                isToday ? 'bg-primary/10 text-primary font-semibold' :
                'hover:bg-muted text-foreground'
              }`}
            >
              <span>{day.getDate()}</span>
              {emoji && <span className="text-[10px] leading-none">{emoji}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
