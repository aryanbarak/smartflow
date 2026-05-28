import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { budgetGoalsService, type BudgetGoalWithSpend } from '../budgetGoalsService';

const GOAL_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

function GoalBar({ goal, onDelete }: { goal: BudgetGoalWithSpend; onDelete: (id: string) => void }) {
  const color =
    goal.status === 'over' ? '#ef4444' :
    goal.status === 'warning' ? '#f59e0b' : '#10b981';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs items-center">
        <span className="font-medium flex items-center gap-1">
          {goal.status !== 'safe' && (
            <AlertTriangle size={11} style={{ color }} />
          )}
          {goal.category}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {goal.spent.toFixed(0)} / {goal.monthly_limit.toFixed(0)} €
          </span>
          <button
            onClick={() => onDelete(goal.id)}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(goal.percentage, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{goal.percentage}% مصرف‌شده</span>
        <span style={{ color }}>
          {goal.status === 'over'
            ? `${Math.abs(goal.remaining).toFixed(0)} € اضافه`
            : `${goal.remaining.toFixed(0)} € باقی‌مانده`}
        </span>
      </div>
    </div>
  );
}

function AddGoalForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [color, setColor] = useState('#6366f1');

  const { mutate, isPending } = useMutation({
    mutationFn: budgetGoalsService.upsert,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-goals'] });
      toast.success('Budget goal اضافه شد');
      onClose();
    },
    onError: () => toast.error('خطا در ذخیره'),
  });

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Budget Goal جدید</span>
        <button onClick={onClose}><X size={14} /></button>
      </div>
      <input
        value={category}
        onChange={e => setCategory(e.target.value)}
        placeholder="دسته‌بندی (مثلاً Food)"
        className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        autoFocus
      />
      <input
        type="number"
        value={limit}
        onChange={e => setLimit(e.target.value)}
        placeholder="سقف ماهانه (€)"
        className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
      <div className="flex gap-2">
        {GOAL_COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full transition-transform hover:scale-110"
            style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
          />
        ))}
      </div>
      <button
        disabled={!category.trim() || !limit || isPending}
        onClick={() => mutate({ category: category.trim(), monthly_limit: Number(limit), period: 'monthly', color })}
        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-opacity"
      >
        {isPending ? 'در حال ذخیره...' : 'اضافه کردن'}
      </button>
    </div>
  );
}

export function BudgetGoalsWidget() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: goals = [] } = useQuery({
    queryKey: ['budget-goals'],
    queryFn: budgetGoalsService.getWithSpend,
  });

  const { mutate: deleteGoal } = useMutation({
    mutationFn: budgetGoalsService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-goals'] });
      toast.success('Goal حذف شد');
    },
  });

  const overCount = goals.filter(g => g.status === 'over').length;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          Budget Goals این ماه
        </h3>
        <div className="flex items-center gap-2">
          {overCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
              {overCount} بیش از بودجه
            </span>
          )}
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={13} />
            Goal
          </button>
        </div>
      </div>

      {showAdd && <AddGoalForm onClose={() => setShowAdd(false)} />}

      {goals.length === 0 && !showAdd ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          هنوز budget goal تعریف نشده
        </p>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => (
            <GoalBar key={goal.id} goal={goal} onDelete={deleteGoal} />
          ))}
        </div>
      )}
    </div>
  );
}
