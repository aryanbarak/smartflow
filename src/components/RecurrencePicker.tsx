import { Label } from '@/components/ui/label';
import { type RecurrenceRule, RECURRENCE_LABELS } from '@/lib/recurrence';

interface Props {
  readonly value: RecurrenceRule | '';
  readonly onChange: (value: RecurrenceRule | '') => void;
  readonly endDate?: string;
  readonly onEndDateChange?: (date: string) => void;
}

export function RecurrencePicker({ value, onChange, endDate = '', onEndDateChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="recurrence-rule">Repeat</Label>
        <select
          id="recurrence-rule"
          aria-label="Repeat rule"
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={value}
          onChange={e => onChange(e.target.value as RecurrenceRule | '')}
        >
          <option value="">No repeat</option>
          {(Object.entries(RECURRENCE_LABELS) as [RecurrenceRule, string][]).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </div>
      {value && onEndDateChange && (
        <div className="space-y-2">
          <Label htmlFor="recurrence-end-date">Until</Label>
          <input
            id="recurrence-end-date"
            type="date"
            aria-label="Repeat until date"
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={endDate}
            onChange={e => onEndDateChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
