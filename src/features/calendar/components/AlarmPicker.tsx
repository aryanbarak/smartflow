import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { alarmService, REMIND_OPTIONS } from '../alarmService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AlarmPickerProps {
  sourceType: 'task' | 'calendar_event';
  sourceId: string;
  sourceTitle: string;
  eventAt: string;
  className?: string;
}

export function AlarmPicker({
  sourceType, sourceId, sourceTitle, eventAt, className,
}: Readonly<AlarmPickerProps>) {
  const [current, setCurrent] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    alarmService.getForSource(sourceId)
      .then(alarm => setCurrent(alarm?.remindBeforeMinutes ?? null))
      .catch(() => setCurrent(null))
      .finally(() => setIsLoading(false));
  }, [sourceId]);

  const handleChange = async (minutes: number | null) => {
    setIsSaving(true);
    try {
      if (minutes === null) {
        await alarmService.removeForSource(sourceId);
        setCurrent(null);
        toast.success('Alarm removed');
      } else {
        await alarmService.setAlarm({ sourceType, sourceId, sourceTitle, eventAt, remindBeforeMinutes: minutes });
        setCurrent(minutes);
        const label = REMIND_OPTIONS.find(o => o.value === minutes)?.label ?? `${minutes}m before`;
        toast.success(`Alarm set: ${label}`);
      }
    } catch {
      toast.error('Failed to set alarm');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}>
        <Loader2 className="w-3 h-3 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Bell className={cn('w-3.5 h-3.5 flex-shrink-0', current !== null ? 'text-cyan-400' : 'text-muted-foreground')} />
      <select
        value={current ?? ''}
        disabled={isSaving}
        onChange={e => void handleChange(e.target.value === '' ? null : Number(e.target.value))}
        className="text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
      >
        <option value="">No alarm</option>
        {REMIND_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {current !== null && (
        <button
          onClick={() => void handleChange(null)}
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Remove alarm"
        >
          <BellOff className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
