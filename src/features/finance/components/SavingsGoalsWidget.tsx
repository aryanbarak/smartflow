import { useState, useEffect } from 'react';
import { PiggyBank, Plus, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'dailyflow:savings-goals';

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  color: string;
  deadline?: string;
}

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function SavingsGoalsWidget() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', target: '', saved: '', deadline: '' });
  const [colorIdx, setColorIdx] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setGoals(JSON.parse(stored) as SavingsGoal[]);
  }, []);

  const saveGoals = (g: SavingsGoal[]) => {
    setGoals(g);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(g));
  };

  const addGoal = () => {
    if (!form.name || !form.target) return;
    const goal: SavingsGoal = {
      id: crypto.randomUUID(),
      name: form.name,
      target: Number(form.target),
      saved: Number(form.saved) || 0,
      color: COLORS[colorIdx],
      deadline: form.deadline || undefined,
    };
    saveGoals([...goals, goal]);
    setForm({ name: '', target: '', saved: '', deadline: '' });
    setShowAdd(false);
    toast.success(`Savings goal "${form.name}" created`);
  };

  const updateSaved = (id: string, delta: number) => {
    saveGoals(goals.map(g => g.id === id ? { ...g, saved: Math.max(0, g.saved + delta) } : g));
  };

  const removeGoal = (id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2 text-sm">
          <PiggyBank className="w-4 h-4 text-primary" /> Savings Goals
        </h3>
        <button onClick={() => setShowAdd(v => !v)}
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add goal
        </button>
      </div>

      {showAdd && (
        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Goal name (e.g. New Laptop)"
            className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex gap-2">
            <input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              placeholder="Target €" min="1"
              className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
            <input type="number" value={form.saved} onChange={e => setForm(f => ({ ...f, saved: e.target.value }))}
              placeholder="Saved so far €" min="0"
              className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
            className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Color:</span>
            {COLORS.map((c, i) => (
              <button key={c} onClick={() => setColorIdx(i)}
                className={cn('w-5 h-5 rounded-full transition-transform', i === colorIdx && 'scale-125 ring-2 ring-white/50')}
                style={{ background: c }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addGoal}
              className="flex-1 text-xs py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1">
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={() => setShowAdd(false)}
              className="flex-1 text-xs py-1.5 rounded border border-border text-muted-foreground hover:bg-muted flex items-center justify-center gap-1">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground">No savings goals yet. Add one to start tracking.</p>
      )}

      <div className="space-y-4">
        {goals.map(goal => {
          const pct = Math.min((goal.saved / goal.target) * 100, 100);
          const remaining = Math.max(0, goal.target - goal.saved);
          const isComplete = goal.saved >= goal.target;

          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: goal.color }} />
                  <span className="text-sm font-medium">{goal.name}</span>
                  {isComplete && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">Done! 🎉</span>
                  )}
                </div>
                <button onClick={() => removeGoal(goal.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: goal.color }} />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>€{goal.saved.toFixed(0)} saved</span>
                <span>{pct.toFixed(0)}%</span>
                <span>€{remaining.toFixed(0)} to go</span>
              </div>

              {goal.deadline && (
                <p className="text-xs text-muted-foreground">
                  🗓 Deadline: {new Date(goal.deadline).toLocaleDateString()}
                </p>
              )}

              {!isComplete && (
                <div className="flex gap-1.5">
                  {[10, 50, 100].map(amt => (
                    <button key={amt} onClick={() => updateSaved(goal.id, amt)}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors">
                      +€{amt}
                    </button>
                  ))}
                  <button onClick={() => updateSaved(goal.id, -10)}
                    className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors text-muted-foreground">
                    -€10
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
