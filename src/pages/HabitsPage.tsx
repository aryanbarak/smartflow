import { useState } from 'react';
import { Plus, Flame, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHabits, useToggleHabit, useDeleteHabit } from '@/features/habits/useHabits';
import { HabitCard } from '@/features/habits/components/HabitCard';
import { AddHabitModal } from '@/features/habits/components/AddHabitModal';
import { useNotifications } from '@/hooks/useNotifications';

export default function HabitsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { data: habits = [], isLoading } = useHabits();
  const { mutate: toggle } = useToggleHabit();
  const { mutate: remove } = useDeleteHabit();
  const { permission, isSupported, request: requestNotifications } = useNotifications();

  const todayDone = habits.filter(h => h.completedToday).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0);
  const progressPct = habits.length > 0 ? Math.round((todayDone / habits.length) * 100) : 0;

  function renderBody() {
    if (isLoading) {
      return <div className="text-center text-muted-foreground py-12 text-sm">در حال بارگذاری...</div>;
    }
    if (habits.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-16">
          <Flame size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">هنوز عادتی اضافه نکردی</p>
          <button type="button" onClick={() => setShowAdd(true)} className="mt-3 text-primary text-sm hover:underline">
            اولین عادتت رو بساز
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
            Habit Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {todayDone}/{habits.length} امروز انجام شده · {totalStreak} روز streak کل
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSupported && permission !== 'granted' && (
            <button
              type="button"
              onClick={requestNotifications}
              title="فعال‌کردن یادآور روزانه"
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
            عادت جدید
          </button>
        </div>
      </div>

      {habits.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>پیشرفت امروز</span>
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

      {renderBody()}

      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
