import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Check, X, Loader2,
  AlertCircle, Save, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const WORKER_URL = (import.meta.env.VITE_AI_AGENT_URL as string | undefined)
  ?? 'https://api.barakzai.cloud';

const CATEGORIES = [
  'Food', 'Rent', 'Transport', 'Health', 'Insurance',
  'Utilities', 'Shopping', 'Entertainment', 'Salary', 'Transfer', 'Other',
];

interface ImportedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  selected: boolean;
  isDuplicate?: boolean;
}

interface BankImportToolProps {
  onImportComplete: () => void;
  onClose: () => void;
}

export function BankImportTool({ onImportComplete, onClose }: BankImportToolProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [meta, setMeta] = useState<{ period?: string; provider?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function checkDuplicates(
    txs: ImportedTransaction[],
    userId: string,
  ): Promise<ImportedTransaction[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const fromDate = sixMonthsAgo.toISOString().slice(0, 10);

    const { data: existing } = await supabase
      .from('finance_transactions')
      .select('date, amount, notes')
      .eq('user_id', userId)
      .gte('date', fromDate);

    if (!existing?.length) return txs;

    return txs.map(tx => {
      const isDuplicate = existing.some(ex => {
        const sameDate = ex.date === tx.date;
        const sameAmount = Math.abs(Number(ex.amount) - Math.abs(tx.amount)) < 0.01;
        const sameDesc = ex.notes && tx.description &&
          ex.notes.slice(0, 30).toLowerCase() === tx.description.slice(0, 30).toLowerCase();
        return sameDate && sameAmount && sameDesc;
      });
      return { ...tx, isDuplicate };
    });
  }

  const handleFile = (f: File) => {
    if (!f.type.includes('pdf') && !f.name.endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }
    setFile(f);
    setTransactions([]);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${WORKER_URL}/import-bank`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as {
        transactions: Omit<ImportedTransaction, 'selected'>[];
        statement_period?: string;
        provider?: string;
      };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const withDuplicates = await checkDuplicates(
        data.transactions.map(tx => ({ ...tx, selected: true })),
        user.id,
      );

      const finalTransactions = withDuplicates.map(tx => ({
        ...tx,
        selected: !tx.isDuplicate,
      }));

      setTransactions(finalTransactions);
      setMeta({ period: data.statement_period, provider: data.provider });

      const dupCount = finalTransactions.filter(tx => tx.isDuplicate).length;
      if (dupCount > 0) {
        toast.warning(`${dupCount} possible duplicate(s) — deselected automatically`);
        toast.success(`Found ${data.transactions.length} transactions (${dupCount} duplicates)`);
      } else {
        toast.success(`Found ${data.transactions.length} transactions — no duplicates`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    const selected = transactions.filter(tx => tx.selected);
    if (!selected.length) {
      toast.error('No transactions selected');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const rows = selected.map(tx => ({
        user_id: user.id,
        type: tx.type,
        amount: Math.abs(tx.amount),
        category: tx.category,
        date: tx.date,
        notes: tx.description,
      }));

      const { error: dbError } = await supabase.from('finance_transactions').insert(rows);
      if (dbError) throw dbError;

      toast.success(`Saved ${rows.length} transactions`);
      onImportComplete();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAll = (val: boolean) => {
    setTransactions(prev => prev.map(tx => ({ ...tx, selected: val })));
  };

  const selectedCount = transactions.filter(tx => tx.selected).length;
  const totalExpenses = transactions
    .filter(tx => tx.selected && tx.type === 'expense')
    .reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const totalIncome = transactions
    .filter(tx => tx.selected && tx.type === 'income')
    .reduce((s, tx) => s + tx.amount, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Import Bank Statement
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Upload your Sparkasse PDF — AI will extract transactions automatically
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Drop zone */}
          {!transactions.length && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
                isDragging
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : file
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50',
              )}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-slate-400 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Drop your bank statement here</p>
                    <p className="text-slate-400 text-sm mt-1">PDF format · Sparkasse, ING, Deutsche Bank</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Meta info */}
          {meta && (
            <div className="flex items-center gap-4 text-xs text-slate-400">
              {meta.period && <span>📅 {meta.period}</span>}
              {meta.provider && <span>🤖 {meta.provider}</span>}
            </div>
          )}

          {/* Transactions table */}
          {transactions.length > 0 && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">Selected</p>
                  <p className="text-lg font-semibold text-white">{selectedCount}/{transactions.length}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">Total Expenses</p>
                  <p className="text-lg font-semibold text-red-400">-{totalExpenses.toFixed(2)} €</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">Total Income</p>
                  <p className="text-lg font-semibold text-green-400">+{totalIncome.toFixed(2)} €</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">Duplicates</p>
                  <p className="text-lg font-semibold text-yellow-400">
                    {transactions.filter(tx => tx.isDuplicate).length}
                  </p>
                </div>
              </div>

              {/* Select all / clear */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCount === transactions.length}
                    onChange={e => toggleAll(e.target.checked)}
                    className="w-4 h-4 rounded accent-cyan-500"
                  />
                  <span className="text-sm text-slate-400">Select all</span>
                </div>
                <button
                  onClick={() => { setTransactions([]); setFile(null); setMeta(null); }}
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>

              {/* Transaction rows */}
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {transactions.map((tx, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      tx.isDuplicate && 'bg-yellow-500/5 border-yellow-500/20',
                      !tx.isDuplicate && tx.selected && 'bg-slate-800 border-slate-700',
                      !tx.isDuplicate && !tx.selected && 'bg-slate-900 border-slate-800 opacity-50',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={tx.selected}
                      onChange={e => setTransactions(prev => prev.map((t, j) =>
                        j === i ? { ...t, selected: e.target.checked } : t,
                      ))}
                      className="w-4 h-4 rounded accent-cyan-500 flex-shrink-0"
                    />
                    <span className="text-xs text-slate-400 w-20 flex-shrink-0">{tx.date}</span>
                    <span className="text-sm text-white flex-1 truncate">{tx.description}</span>
                    {tx.isDuplicate && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex-shrink-0 whitespace-nowrap">
                        Duplicate
                      </span>
                    )}
                    <select
                      value={tx.category}
                      onChange={e => setTransactions(prev => prev.map((t, j) =>
                        j === i ? { ...t, category: e.target.value } : t,
                      ))}
                      className="text-xs bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-28 flex-shrink-0"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className={cn(
                      'text-sm font-medium w-24 text-right flex-shrink-0',
                      tx.type === 'income' ? 'text-green-400' : 'text-red-400',
                    )}>
                      {tx.type === 'income' ? '+' : '-'}{Math.abs(tx.amount).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {file && !transactions.length && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 transition-all text-sm font-medium"
              >
                {isAnalyzing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                  : <><FileText className="w-4 h-4" /> Analyze with AI</>
                }
              </button>
            )}

            {transactions.length > 0 && (
              <button
                onClick={handleSave}
                disabled={isSaving || !selectedCount}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 transition-all text-sm font-medium"
              >
                {isSaving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> Save {selectedCount} transactions</>
                }
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
