import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Scan, Copy, Download, FileText, Save,
  Sparkles, CheckSquare, Plus, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useT } from '@/i18n';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { TranslateLang } from '../translationService';

const BASE_URL = (import.meta.env.VITE_AI_AGENT_URL as string | undefined)
  ?.replace('/analyze', '') ?? 'https://api.barakzai.cloud';
const OCR_URL = `${BASE_URL}/ocr`;

const LANGUAGES: { code: TranslateLang; label: string; flag: string }[] = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
];

interface ActionItem {
  title: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  selected: boolean;
}

interface DocumentSummary {
  title: string;
  summary: string;
  key_points: string[];
  action_items: ActionItem[];
}

interface Props {
  onSave?: (file: File, title?: string) => Promise<void>;
}

export function PdfOcrTool({ onSave }: Props) {
  const { t } = useT();
  const { session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<TranslateLang>('de');
  const [result, setResult] = useState('');
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [isSavingTasks, setIsSavingTasks] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult('');
    setSummary(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: false,
  });

  const { mutate: extractText, isPending } = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      if (!session?.access_token) throw new Error('You must be signed in');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);

      const response = await fetch(OCR_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Server error ${response.status}`);
      }

      return response.json() as Promise<{
        text?: string;
        summary?: {
          title: string;
          summary: string;
          key_points: string[];
          action_items: { title: string; reason: string; priority: 'low' | 'medium' | 'high' }[];
        } | null;
      }>;
    },
    onSuccess: (data) => {
      setResult(data.text ?? '');
      if (data.summary) {
        setSummary({
          ...data.summary,
          action_items: data.summary.action_items.map(item => ({
            ...item,
            selected: true,
            dueDate: '',
          })),
        });
        toast.success('Text extracted + AI analysis ready');
      } else {
        toast.success('Text extracted');
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyResult = () =>
    navigator.clipboard.writeText(result).then(() => toast.success('Copied'));

  const downloadTxt = () => {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace(/\.[^.]+$/, '') ?? 'ocr_result') + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveToDocuments = async () => {
    if (!result || !onSave) return;
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const name = (file?.name.replace(/\.[^.]+$/, '') ?? 'ocr_result') + '.txt';
    const f = new File([blob], name, { type: 'text/plain' });
    await onSave(f, name);
    toast.success('Saved to Documents');
  };

  const handleAddToTasks = async () => {
    if (!summary) return;
    const selected = summary.action_items.filter(i => i.selected && i.title.trim());
    if (!selected.length) return;

    setIsSavingTasks(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const rows = selected.map(item => ({
        user_id: user.id,
        title: item.title.trim(),
        notes: item.reason,
        due_date: item.dueDate || null,
        completed: false,
      }));

      const { error } = await supabase.from('tasks').insert(rows);
      if (error) throw error;

      toast.success(`Added ${rows.length} task${rows.length === 1 ? '' : 's'} successfully!`);
      setSummary(prev => prev ? {
        ...prev,
        action_items: prev.action_items.map(a => ({ ...a, selected: false })),
      } : null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add tasks');
    } finally {
      setIsSavingTasks(false);
    }
  };

  const updateActionItem = <K extends keyof ActionItem>(
    index: number,
    field: K,
    value: ActionItem[K],
  ) => {
    setSummary(prev => prev ? {
      ...prev,
      action_items: prev.action_items.map((a, j) => j === index ? { ...a, [field]: value } : a),
    } : null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
        style={{
          borderColor: isDragActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          background: isDragActive ? 'hsl(var(--primary) / 0.05)' : 'transparent',
        }}
      >
        <input {...getInputProps()} />
        <Scan size={32} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isDragActive ? 'Drop file here' : 'Drag a PDF or image here, or click to select'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WebP</p>
      </div>

      {/* Selected file */}
      {file && (
        <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-3">
          <FileText size={16} className="text-primary flex-shrink-0" />
          <p className="text-sm font-medium truncate flex-1">{file.name}</p>
          <button type="button" onClick={() => { setFile(null); setResult(''); setSummary(null); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Remove
          </button>
        </div>
      )}

      {/* Language + Extract */}
      {file && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t('ocr_language')}</p>
            <div className="flex gap-1">
              {LANGUAGES.map(lang => (
                <button key={lang.code} type="button" onClick={() => setLanguage(lang.code)}
                  className="flex-1 text-xs py-2 rounded-lg border transition-colors"
                  style={{
                    background: language === lang.code ? 'hsl(var(--primary))' : 'transparent',
                    color: language === lang.code ? 'white' : undefined,
                    borderColor: language === lang.code ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  }}>
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => extractText()} disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
            {isPending
              ? <><Loader2 size={15} className="animate-spin" /> Extracting &amp; analyzing…</>
              : <><Scan size={15} /> {t('extract_text')}</>
            }
          </button>
        </div>
      )}

      {/* Raw text result */}
      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {result.length.toLocaleString()} characters
            </span>
            <div className="flex gap-1">
              <button type="button" onClick={copyResult}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-muted transition-colors">
                <Copy size={12} /> Copy
              </button>
              <button type="button" onClick={downloadTxt}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-muted transition-colors">
                <Download size={12} /> {t('editor_export_txt')}
              </button>
              {onSave && (
                <button type="button" onClick={saveToDocuments}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-muted transition-colors">
                  <Save size={12} /> {t('editor_save_docs')}
                </button>
              )}
            </div>
          </div>
          <textarea readOnly value={result} rows={8} dir={language === 'fa' ? 'rtl' : 'ltr'}
            className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm resize-none focus:outline-none" />
        </div>
      )}

      {/* AI Summary + Action Items */}
      {summary && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              AI Summary
            </h3>
            <div>
              <p className="text-base font-medium text-white">{summary.title}</p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">{summary.summary}</p>
            </div>
            {summary.key_points.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Key Points</p>
                <ul className="space-y-1">
                  {summary.key_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-cyan-400 mt-0.5 flex-shrink-0">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Items */}
          {summary.action_items.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-green-400" />
                  Action Items
                </h3>
                <span className="text-xs text-slate-400">
                  {summary.action_items.filter(i => i.selected).length} selected
                </span>
              </div>

              <div className="space-y-3">
                {summary.action_items.map((item, i) => (
                  <div key={i} className={cn(
                    'p-3 rounded-lg border transition-colors',
                    item.selected ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-900/50 border-slate-800 opacity-60',
                  )}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={item.selected}
                        aria-label={`Select action item: ${item.title}`}
                        onChange={e => updateActionItem(i, 'selected', e.target.checked)}
                        className="w-4 h-4 rounded accent-cyan-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <input value={item.title}
                          title="Edit action item title"
                          placeholder="Action item title"
                          onChange={e => updateActionItem(i, 'title', e.target.value)}
                          className="w-full text-sm font-medium text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-cyan-500 focus:outline-none pb-0.5" />
                        <p className="text-xs text-slate-400">{item.reason}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1">
                            {(['low', 'medium', 'high'] as const).map(p => (
                              <button key={p} type="button"
                                onClick={() => updateActionItem(i, 'priority', p)}
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded capitalize transition-colors',
                                  item.priority === p
                                    ? p === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      : p === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'text-slate-500 hover:text-slate-300',
                                )}>
                                {p}
                              </button>
                            ))}
                          </div>
                          <input type="date" value={item.dueDate ?? ''}
                            title="Due date"
                            aria-label="Due date"
                            onChange={e => updateActionItem(i, 'dueDate', e.target.value)}
                            className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => void handleAddToTasks()}
                disabled={isSavingTasks || !summary.action_items.some(i => i.selected)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 transition-all text-sm font-medium">
                {isSavingTasks
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding tasks…</>
                  : <><Plus className="w-4 h-4" /> Add {summary.action_items.filter(i => i.selected).length} task{summary.action_items.filter(i => i.selected).length === 1 ? '' : 's'} to Tasks</>
                }
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
