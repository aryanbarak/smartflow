import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'dailyflow:budget-limits';

const CATEGORIES = [
  'Food', 'Rent', 'Transport', 'Health', 'Insurance',
  'Utilities', 'Shopping', 'Entertainment', 'Other',
];

interface BudgetLimit {
  category: string;
  limit: number;
}

interface BudgetLimitsWidgetProps {
  currentMonth: string;
  transactions: { category: string; amount: number; type: string }[];
}

export function BudgetLimitsWidget({ transactions }: BudgetLimitsWidgetProps) {
  const [limits, setLimits] = useState<BudgetLimit[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState('Food');
  const [newLimit, setNewLimit] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setLimits(JSON.parse(stored) as BudgetLimit[]);
  }, []);

  const saveLimits = (next: BudgetLimit[]) => {
    setLimits(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addLimit = () => {
    if (!newLimit || isNaN(Number(newLimit))) return;
    saveLimits([...limits.filter(l => l.category !== newCategory), { category: newCategory, limit: Number(newLimit) }]);
    setNewLimit('');
    setShowAdd(false);
    toast.success(`Budget limit set for ${newCategory}`);
  };

  const removeLimit = (category: string) => {
    saveLimits(limits.filter(l => l.category !== category));
  };

  const spending = transactions
    .filter(t => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
      return acc;
    }, {});

  if (limits.length === 0 && !showAdd) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-primary" /> Budget Limits
          </h3>
          <button onClick={() => setShowAdd(true)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add limit
          </button>
        </div>
        <p className="text-sm text-muted-foreground">No budget limits set. Add one to track spending.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2 text-sm">
          <Target className="w-4 h-4 text-primary" /> Budget Limits
        </h3>
        <button onClick={() => setShowAdd(v => !v)}
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {showAdd && (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
          <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
            className="text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary flex-1">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)}
            placeholder="€ limit" min="1"
            className="text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-24"
            onKeyDown={e => e.key === 'Enter' && addLimit()} />
          <button onClick={addLimit} className="p-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowAdd(false)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-3">
        {limits.map(({ category, limit }) => {
          const spent = spending[category] ?? 0;
          const pct = Math.min((spent / limit) * 100, 100);
          const isOver = spent > limit;
          const isWarning = pct >= 80 && !isOver;

          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  {isOver && <AlertTriangle className="w-3 h-3 text-red-400" />}
                  <span className={cn(isOver ? 'text-red-400 font-medium' : 'text-foreground')}>
                    {category}
                  </span>
                </span>
                <span className={cn(
                  'font-medium',
                  isOver ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-muted-foreground',
                )}>
                  €{spent.toFixed(0)} / €{limit}
                </span>
                <button onClick={() => removeLimit(category)}
                  className="text-muted-foreground hover:text-destructive ml-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-primary',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
