export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | 'weekdays';

export function expandRecurrences(
  rule: RecurrenceRule,
  startDate: string,        // YYYY-MM-DD
  untilDate: string,        // YYYY-MM-DD inclusive
): string[] {
  const dates: string[] = [];
  const cur = new Date(startDate + 'T00:00:00');
  const end = new Date(untilDate + 'T00:00:00');

  while (cur <= end) {
    const dow = cur.getDay(); // 0=Sun … 6=Sat
    const include =
      rule === 'daily' ||
      rule === 'weekly' ||
      (rule === 'monthly') ||
      (rule === 'weekdays' && dow >= 1 && dow <= 5);

    if (include) dates.push(cur.toISOString().split('T')[0]);

    if (rule === 'daily' || rule === 'weekdays') {
      cur.setDate(cur.getDate() + 1);
    } else if (rule === 'weekly') {
      cur.setDate(cur.getDate() + 7);
    } else if (rule === 'monthly') {
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  return dates;
}

export const RECURRENCE_LABELS: Record<RecurrenceRule, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekly: 'Weekly',
  monthly: 'Monthly',
};
