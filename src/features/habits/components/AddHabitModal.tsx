import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateHabit } from '../useHabits';
import { cn } from '@/lib/utils';

const ICONS = ['⭐', '💪', '📚', '🏃', '🧘', '🧠', '🎯', '🌱', '😴', '🎵'];
const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];
const TARGET_UNITS = ['days', 'sessions', 'hours', 'times'] as const;

interface Props {
  readonly onClose: () => void;
}

export function AddHabitModal({ onClose }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [color, setColor] = useState('#6366f1');
  const [habitType, setHabitType] = useState<'ongoing' | 'goal'>('ongoing');
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState<string>('days');
  const { mutate: create, isPending } = useCreateHabit();

  const handleSubmit = () => {
    if (!title.trim()) return;
    create(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        frequency: 'daily',
        target_days: 1,
        is_active: true,
        habit_type: habitType,
        target_value: habitType === 'goal' && targetValue ? Number(targetValue) : undefined,
        target_unit: habitType === 'goal' && targetValue ? targetUnit : undefined,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-base">New Habit</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Habit type toggle */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Type</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setHabitType('ongoing')}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  habitType === 'ongoing'
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                Ongoing
              </button>
              <button
                type="button"
                onClick={() => setHabitType('goal')}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  habitType === 'goal'
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                Goal
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {habitType === 'ongoing'
                ? 'Recurring habit like exercise or meditation — never ends.'
                : 'Finite goal like "read 20 books" — achieved when target is reached.'}
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={habitType === 'ongoing' ? 'e.g. 30 min exercise' : 'e.g. Read 20 books'}
              className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Description (optional)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="More details..."
              className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Goal target — only shown for goal type */}
          {habitType === 'goal' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="habit-target" className="text-xs text-muted-foreground mb-1.5 block">Target</label>
                <input
                  id="habit-target"
                  type="number"
                  min="1"
                  value={targetValue}
                  onChange={e => setTargetValue(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="habit-unit" className="text-xs text-muted-foreground mb-1.5 block">Unit</label>
                <select
                  id="habit-unit"
                  title="Target unit"
                  value={targetUnit}
                  onChange={e => setTargetUnit(e.target.value)}
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {TARGET_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Select icon ${i}`}
                  onClick={() => setIcon(i)}
                  className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
                  style={{
                    background: icon === i ? color + '33' : 'transparent',
                    border: `1.5px solid ${icon === i ? color : 'transparent'}`,
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Select color ${c}`}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: color }}
          >
            {isPending ? 'Saving...' : 'Create Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}
