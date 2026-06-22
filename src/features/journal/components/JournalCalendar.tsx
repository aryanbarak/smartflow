import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useJournalMonth } from '../useJournal';
import { moodEmoji } from './MoodPicker';


interface Props {
  readonly selectedDate: string;
  readonly onSelect: (date: string) => void;
}

function toKey(date: Date) {
  return date.toISOString().split('T')[0];
}

const MOOD_DOT_COLOR: Record<string, string> = {
  great: 'bg-emerald-400',
  good: 'bg-emerald-400/70',
  okay: 'bg-amber-400',
  bad: 'bg-orange-400',
  terrible: 'bg-rose-400',
};

export function JournalCalendar({ selectedDate, onSelect }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);

  const { data: entries = [] } = useJournalMonth(viewYear, viewMonth);
  const entryMap = new Map(entries.map(e => [e.date, e]));

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

  const monthLabel = firstDay.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  return (
    <div className="bg-card border border-border rounded-xl p-4 select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" aria-label="Previous month" onClick={prev} className="p-1 rounded hover:bg-muted"><ChevronLeft size={16} /></button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <button type="button" aria-label="Next month" onClick={next} className="p-1 rounded hover:bg-muted"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-xs text-muted-foreground py-1">{d}</div>
        ))}
        {days.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} />;
          const key = toKey(day);
          const entry = entryMap.get(key);
          const hasEntry = !!entry;
          const mood = entry?.mood ?? null;
          const emoji = mood ? moodEmoji(mood) : '';
          const dotColor = mood
            ? (MOOD_DOT_COLOR[mood] ?? 'bg-emerald-400')
            : hasEntry ? 'bg-blue-400' : '';
          const isSelected = key === selectedDate;
          const isToday = key === toKey(today);
          return (
            <button
              key={key}
              type="button"
              aria-label={`Select ${key}`}
              onClick={() => onSelect(key)}
              className={`relative flex flex-col items-center justify-center rounded-lg py-1 text-xs transition-colors min-h-[40px] ${
                isSelected ? 'bg-primary text-primary-foreground' :
                isToday ? 'bg-primary/10 text-primary font-semibold' :
                hasEntry ? 'hover:bg-muted/80 text-foreground' :
                'hover:bg-muted text-muted-foreground'
              }`}
            >
              <span className={hasEntry && !isSelected ? 'font-medium text-foreground' : ''}>{day.getDate()}</span>
              {emoji ? (
                <span className="text-[10px] leading-none mt-0.5">{emoji}</span>
              ) : hasEntry ? (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor}`} />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-border/40">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Entry
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          😄 Mood
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" /> Empty
        </span>
      </div>
    </div>
  );
}
