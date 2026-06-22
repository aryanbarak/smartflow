import { useEffect, useRef, useState } from 'react';
import { useJournalEntry, useUpsertJournalEntry } from '../useJournal';
import { MoodPicker } from './MoodPicker';
import type { Mood } from '../types';
import { useDebounce } from '@/hooks/useDebounce';

interface Props {
  readonly date: string;
  readonly promptInsert?: string | null;
}

const PLACEHOLDER = 'What happened today? How did you feel?';

export function JournalEditor({ date, promptInsert }: Props) {
  const { data: entry, isLoading } = useJournalEntry(date);
  const { mutate: upsert } = useUpsertJournalEntry();

  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [saved, setSaved] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isLoading && !initialized.current) {
      setContent(entry?.content ?? '');
      setMood(entry?.mood ?? null);
      initialized.current = true;
    }
  }, [entry, isLoading]);

  useEffect(() => {
    if (promptInsert) {
      setContent(prev => prev + (prev.endsWith('\n') || prev === '' ? '' : '\n\n') + promptInsert);
      initialized.current = true;
    }
  }, [promptInsert]);

  const debouncedContent = useDebounce(content, 1200);
  const debouncedMood = useDebounce(mood, 1200);

  useEffect(() => {
    if (!initialized.current) return;
    upsert({ date, content: debouncedContent, mood: debouncedMood }, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  }, [debouncedContent, debouncedMood]);

  if (isLoading) return <div className="text-sm text-muted-foreground py-4">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MoodPicker value={mood} onChange={(m) => { setMood(m); initialized.current = true; }} />
        <span className={`text-xs transition-opacity ${saved ? 'opacity-100 text-green-500' : 'opacity-0'}`}>
          Saved ✓
        </span>
      </div>
      <textarea
        className="w-full min-h-[280px] bg-transparent border border-border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground leading-relaxed"
        placeholder={PLACEHOLDER}
        value={content}
        onChange={e => { setContent(e.target.value); initialized.current = true; }}
        dir="auto"
        aria-label="Journal entry"
      />
    </div>
  );
}
