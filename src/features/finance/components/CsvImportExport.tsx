import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCsv, parseCsv, type ParsedRow } from '../csvService';
import type { Transaction } from '../financeService';

interface Props {
  transactions: Transaction[];
  onImport: (rows: ParsedRow[]) => Promise<void>;
}

export function CsvImportExport({ transactions, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      await onImport(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => exportToCsv(transactions)}
      >
        <Download size={14} />
        <span className="hidden sm:inline">Export CSV</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={importing}
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={14} />
        <span className="hidden sm:inline">{importing ? 'Importing…' : 'Import CSV'}</span>
      </Button>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
