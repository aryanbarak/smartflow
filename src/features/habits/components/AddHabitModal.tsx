import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateHabit } from '../useHabits';

const ICONS = ['⭐', '💪', '📚', '🏃', '🧘', '🧠', '🎯', '🌱', '😴', '🎵'];
const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

interface Props {
  readonly onClose: () => void;
}

export function AddHabitModal({ onClose }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [color, setColor] = useState('#6366f1');
  const { mutate: create, isPending } = useCreateHabit();

  const handleSubmit = () => {
    if (!title.trim()) return;
    create(
      { title: title.trim(), description: description.trim() || undefined, icon, color, frequency: 'daily', target_days: 1, is_active: true },
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
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g. 30 min exercise"
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
