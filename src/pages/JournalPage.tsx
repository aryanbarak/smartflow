import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { JournalEditor } from '@/features/journal/components/JournalEditor';
import { JournalCalendar } from '@/features/journal/components/JournalCalendar';
import { useT } from '@/i18n';

const LOCALE_MAP = { en: 'en-US', de: 'de-DE', fa: 'fa-IR' } as const;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const { t, lang } = useT();

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
          <JournalEditor date={selectedDate} />
        </div>
      </div>
    </div>
  );
}
