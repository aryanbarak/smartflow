import { useEffect, useState } from 'react';
import { Plus, Flame, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHabits, useToggleHabit, useDeleteHabit } from '@/features/habits/useHabits';
import { HabitCard } from '@/features/habits/components/HabitCard';
import { AddHabitModal } from '@/features/habits/components/AddHabitModal';
import { useNotifications } from '@/hooks/useNotifications';
import { useT } from '@/i18n';
import { getThisWeekMoodSummary } from '@/features/habits/habitMoodService';
import { useAuth } from '@/hooks/useAuth';

export default function HabitsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { user } = useAuth();
  const [weekMood, setWeekMood] = useState<{ avgMood: number; entries: number; emoji: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    getThisWeekMoodSummary(user.id).then(setWeekMood).catch(console.error);
  }, [user]);
  const { data: habits = [], isLoading } = useHabits();
  const { mutate: toggle } = useToggleHabit();
  const { mutate: remove } = useDeleteHabit();
  const { permission, isSupported, request: requestNotifications } = useNotifications();
  const { t } = useT();

  const todayDone = habits.filter(h => h.completedToday).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0);
  const progressPct = habits.length > 0 ? Math.round((todayDone / habits.length) * 100) : 0;

  function renderBody() {
    if (isLoading) {
      return <div className="text-center text-muted-foreground py-12 text-sm">{t('loading')}</div>;
    }
    if (habits.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-16">
          <Flame size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t('habits_no_habits')}</p>
          <button type="button" onClick={() => setShowAdd(true)} className="mt-3 text-primary text-sm hover:underline">
            {t('habits_add')}
          </button>
        </div>
      );
    }
    return (
      <div className="grid gap-3">
        {habits.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onToggle={id => toggle({ habitId: id })}
            onDelete={id => remove(id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Flame className="text-orange-400" size={22} />
            {t('habits_title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {todayDone}/{habits.length} · {t('habits_days', { count: totalStreak })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSupported && permission !== 'granted' && (
            <button
              type="button"
              onClick={requestNotifications}
              title="Enable daily reminder"
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Bell size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            {t('habits_add')}
          </button>
        </div>
      </div>

      {habits.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{t('today')}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {weekMood && weekMood.entries > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="text-3xl">{weekMood.emoji}</div>
          <div>
            <p className="text-sm font-medium">{t('habits_mood_this_week')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Avg. {weekMood.avgMood.toFixed(1)}/5 · {weekMood.entries} {weekMood.entries === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-semibold">{weekMood.avgMood.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">/ 5</p>
          </div>
        </div>
      )}

      {renderBody()}

      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
