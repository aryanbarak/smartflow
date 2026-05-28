import { Label } from '@/components/ui/label';
import { type RecurrenceRule, RECURRENCE_LABELS } from '@/lib/recurrence';

interface Props {
  value: RecurrenceRule | '';
  onChange: (value: RecurrenceRule | '') => void;
  endDate?: string;
  onEndDateChange?: (date: string) => void;
}

export function RecurrencePicker({ value, onChange, endDate = '', onEndDateChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>تکرار</Label>
        <select
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={value}
          onChange={e => onChange(e.target.value as RecurrenceRule | '')}
        >
          <option value="">بدون تکرار</option>
          {(Object.entries(RECURRENCE_LABELS) as [RecurrenceRule, string][]).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </div>
      {value && onEndDateChange && (
        <div className="space-y-2">
          <Label>تا تاریخ</Label>
          <input
            type="date"
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={endDate}
            onChange={e => onEndDateChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
