import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Check, Trash2 } from 'lucide-react';
import type { HabitWithStats } from '../types';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

function getCurrentWeekDays(): string[] {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    return d.toISOString().split('T')[0];
  });
}

interface Props {
  readonly habit: HabitWithStats;
  readonly onToggle: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export function HabitCard({ habit, onToggle, onDelete }: Props) {
  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const completionSet = useMemo(
    () => new Set(habit.completions.map(c => c.completed_date)),
    [habit.completions],
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: habit.color + '22', border: `1.5px solid ${habit.color}44` }}
          >
            {habit.icon}
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">{habit.title}</h3>
            {habit.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{habit.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            aria-label={habit.completedToday ? 'Mark incomplete' : 'Mark complete'}
            onClick={() => onToggle(habit.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: habit.completedToday ? habit.color : 'transparent',
              border: `1.5px solid ${habit.color}`,
              color: habit.completedToday ? 'white' : habit.color,
            }}
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            aria-label="Delete habit"
            onClick={() => onDelete(habit.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Weekly heatmap — Mon to Sun */}
      <div className="flex gap-1.5 items-end">
        {weekDays.map((date, i) => {
          const done = completionSet.has(date);
          const isFuture = date > todayStr;
          const isToday = date === todayStr;
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-muted-foreground leading-none">{WEEKDAY_LABELS[i]}</span>
              <div
                className="w-full h-6 rounded-md flex items-center justify-center transition-all"
                style={{
                  backgroundColor: done ? habit.color : isFuture ? 'transparent' : habit.color + '15',
                  border: isToday ? `1.5px solid ${habit.color}` : '1.5px solid transparent',
                  opacity: isFuture ? 0.3 : 1,
                }}
              >
                {done && <Check size={10} color="white" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Flame size={12} style={{ color: habit.color }} />
          <span>{habit.currentStreak} day streak</span>
        </span>
        <span className="flex items-center gap-1">
          <Trophy size={12} style={{ color: habit.color }} />
          <span>Best: {habit.longestStreak}</span>
        </span>
        <span className="ml-auto">{habit.completionRate}% this month</span>
      </div>
    </motion.div>
  );
}
