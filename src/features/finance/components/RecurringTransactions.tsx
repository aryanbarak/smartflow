import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Plus, Trash2, Check, X, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  recurringTransactionsDbService,
  type RecurringTransaction,
} from '../recurringTransactionsDbService';

const CATEGORIES = [
  'Food', 'Rent', 'Transport', 'Health', 'Insurance',
  'Utilities', 'Shopping', 'Entertainment', 'Salary', 'Other',
];

interface RecurringTransactionsProps {
  onApplied: () => void;
}

export function RecurringTransactions({ onApplied }: Readonly<RecurringTransactionsProps>) {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense' as 'income' | 'expense',
    category: 'Rent', dayOfMonth: '1',
  });
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    recurringTransactionsDbService.getAll()
      .then(setItems)
      .catch(err => console.error('[Recurring] load error', err));
  }, []);

  const applyItems = useCallback(async (
    toApply: RecurringTransaction[],
    allItems: RecurringTransaction[],
    month: string,
    silent = false,
  ) => {
    if (!toApply.length) return;
    setIsApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const rows = toApply.map(item => ({
        user_id: user.id,
        type: item.type,
        amount: item.amount,
        category: item.category,
        notes: item.title,
        date: `${month}-${String(item.dayOfMonth).padStart(2, '0')}`,
      }));

      const { error } = await supabase.from('finance_transactions').insert(rows);
      if (error) throw error;

      await Promise.all(
        toApply.map(item => recurringTransactionsDbService.updateLastApplied(item.id, month)),
      );

      setItems(allItems.map(i =>
        toApply.some(a => a.id === i.id) ? { ...i, lastApplied: month } : i,
      ));

      if (!silent) {
        toast.success(`Applied ${rows.length} recurring transactions`);
        onApplied();
      }
    } catch (err) {
      if (!silent) toast.error(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  }, [onApplied]);

  // Auto-apply on mount for current month
  useEffect(() => {
    if (items.length === 0) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const pending = items.filter(i => i.lastApplied !== currentMonth);
    if (pending.length > 0) {
      void applyItems(pending, items, currentMonth, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  const addItem = async () => {
    if (!form.title || !form.amount) return;
    try {
      const created = await recurringTransactionsDbService.create({
        title: form.title,
        amount: Number(form.amount),
        type: form.type,
        category: form.category,
        dayOfMonth: Number(form.dayOfMonth),
      });
      setItems(prev => [...prev, created]);
      setForm({ title: '', amount: '', type: 'expense', category: 'Rent', dayOfMonth: '1' });
      setShowAdd(false);
      toast.success(`Recurring transaction "${form.title}" added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const removeItem = async (id: string) => {
    try {
      await recurringTransactionsDbService.remove(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const pendingCount = items.filter(i => i.lastApplied !== currentMonth).length;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4 text-primary" /> Recurring
          {pendingCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
              {pendingCount} pending
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={() => void applyItems(items.filter(i => i.lastApplied !== currentMonth), items, currentMonth)}
              disabled={isApplying}
              className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 disabled:opacity-50">
              <Play className="w-3 h-3" /> Apply now
            </button>
          )}
          <button onClick={() => setShowAdd(v => !v)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Netflix, Miete, Gehalt"
            className="w-full text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex gap-2">
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="Amount €" min="0.01" step="0.01"
              className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'income' | 'expense' }))}
              className="text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.dayOfMonth} onChange={e => setForm(f => ({ ...f, dayOfMonth: e.target.value }))}
              className="w-24 text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary">
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>Day {d}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void addItem()}
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

      {items.length === 0 && !showAdd ? (
        <p className="text-sm text-muted-foreground">No recurring transactions. Add rent, salary, subscriptions...</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 text-xs">
              <div className={cn(
                'w-1.5 h-8 rounded-full flex-shrink-0',
                item.type === 'income' ? 'bg-green-500' : 'bg-red-500',
              )} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-muted-foreground">{item.category} · Day {item.dayOfMonth}</p>
              </div>
              <span className={cn('font-medium', item.type === 'income' ? 'text-green-400' : 'text-red-400')}>
                {item.type === 'income' ? '+' : '-'}€{item.amount.toFixed(2)}
              </span>
              {item.lastApplied === currentMonth && (
                <span className="text-green-400"><Check className="w-3.5 h-3.5" /></span>
              )}
              <button onClick={() => void removeItem(item.id)}
                className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
