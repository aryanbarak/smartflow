import { motion } from 'framer-motion';
import { Flame, Trophy, Check, Trash2 } from 'lucide-react';
import type { HabitWithStats } from '../types';

interface Props {
  habit: HabitWithStats;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HabitCard({ habit, onToggle, onDelete }: Props) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toISOString().split('T')[0];
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
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
            onClick={() => onDelete(habit.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 7-day mini calendar */}
      <div className="flex gap-1">
        {last7Days.map(date => {
          const done = habit.completions.some(c => c.completed_date === date);
          const isToday = date === new Date().toISOString().split('T')[0];
          return (
            <div
              key={date}
              className="flex-1 h-7 rounded-md flex items-center justify-center transition-all"
              style={{
                backgroundColor: done ? habit.color : habit.color + '15',
                border: isToday ? `1.5px solid ${habit.color}` : '1.5px solid transparent',
              }}
            >
              {done && <Check size={10} color="white" />}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Flame size={12} style={{ color: habit.color }} />
          <span>{habit.currentStreak} روز streak</span>
        </span>
        <span className="flex items-center gap-1">
          <Trophy size={12} style={{ color: habit.color }} />
          <span>بهترین: {habit.longestStreak}</span>
        </span>
        <span className="ml-auto">{habit.completionRate}% ماه</span>
      </div>
    </motion.div>
  );
}
