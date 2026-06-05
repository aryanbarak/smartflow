import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { JournalEditor } from '@/features/journal/components/JournalEditor';
import { JournalCalendar } from '@/features/journal/components/JournalCalendar';
import { useT } from '@/i18n';
import { getTodayHabitSummary } from '@/features/habits/habitMoodService';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const LOCALE_MAP = { en: 'en-US', de: 'de-DE', fa: 'fa-IR' } as const;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function habitColorClass(rate: number): string {
  if (rate >= 0.8) return 'bg-green-500/10 border-green-500/20 text-green-400';
  if (rate >= 0.5) return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
  return 'bg-red-500/10 border-red-500/20 text-red-400';
}

function habitEmoji(rate: number): string {
  if (rate >= 0.8) return '🔥';
  if (rate >= 0.5) return '👍';
  return '💪';
}

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const { t, lang } = useT();
  const { user } = useAuth();
  const [todayHabits, setTodayHabits] = useState<{ completed: number; total: number; rate: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    getTodayHabitSummary(user.id).then(setTodayHabits).catch(console.error);
  }, [user]);

  const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(LOCALE_MAP[lang], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="text-violet-400" size={22} />
        <div>
          <h1 className="text-xl font-bold">{t('journal_title')}</h1>
          <p className="text-xs text-muted-foreground">{t('today')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-4">
          <JournalCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
        </div>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{displayDate}</p>
          {selectedDate === todayStr() && todayHabits && todayHabits.total > 0 && (
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-xs border', habitColorClass(todayHabits.rate))}>
              <span>{habitEmoji(todayHabits.rate)}</span>
              <span>
                {t('journal_habits_today')}: <strong>{todayHabits.completed}/{todayHabits.total}</strong>
                {' '}({Math.round(todayHabits.rate * 100)}%)
              </span>
            </div>
          )}
          <JournalEditor date={selectedDate} />
        </div>
      </div>
    </div>
  );
}
