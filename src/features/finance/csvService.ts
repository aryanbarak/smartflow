import type { Transaction, TransactionType } from './financeService';

const HEADERS = ['date', 'type', 'amount', 'category', 'notes'];

export function exportToCsv(transactions: Transaction[]): void {
  const rows = [
    HEADERS.join(','),
    ...transactions.map(t =>
      [t.date, t.type, t.amount, `"${t.category}"`, `"${(t.notes ?? '').replace(/"/g, '""')}"`].join(',')
    ),
  ];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ParsedRow {
  date: string;
  type: TransactionType;
  amount: number;
  category: string;
  notes: string;
}

export function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(',');
  const idx = (name: string) => header.indexOf(name);
  const dateIdx = idx('date');
  const typeIdx = idx('type');
  const amountIdx = idx('amount');
  const categoryIdx = idx('category');
  const notesIdx = idx('notes');

  if (dateIdx === -1 || typeIdx === -1 || amountIdx === -1 || categoryIdx === -1) {
    throw new Error('CSV must have columns: date, type, amount, category');
  }

  return lines.slice(1).map((line, i) => {
    const cols = splitCsvLine(line);
    const type = cols[typeIdx]?.toLowerCase();
    if (type !== 'income' && type !== 'expense') {
      throw new Error(`Row ${i + 2}: type must be "income" or "expense"`);
    }
    const amount = parseFloat(cols[amountIdx]);
    if (isNaN(amount) || amount < 0) {
      throw new Error(`Row ${i + 2}: amount must be a positive number`);
    }
    return {
      date: cols[dateIdx],
      type: type as TransactionType,
      amount,
      category: cols[categoryIdx] || 'Other',
      notes: notesIdx >= 0 ? (cols[notesIdx] ?? '') : '',
    };
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}
