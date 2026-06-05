import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Scan, Copy, Download, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useT } from '@/i18n';
import type { TranslateLang } from '../translationService';

const BASE_URL = (import.meta.env.VITE_AI_AGENT_URL as string | undefined)
  ?.replace('/analyze', '') ?? 'https://api.barakzai.cloud';
const OCR_URL = `${BASE_URL}/ocr`;

const LANGUAGES: { code: TranslateLang; label: string; flag: string }[] = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
];

interface Props {
  onSave?: (file: File, title?: string) => Promise<void>;
}

export function PdfOcrTool({ onSave }: Props) {
  const { t } = useT();
  const { session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<TranslateLang>('de');
  const [result, setResult] = useState('');

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult('');
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

      const data = await response.json() as { text?: string };
      return data.text ?? '';
    },
    onSuccess: (text) => {
      setResult(text);
      toast.success('Text extracted');
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

  return (
    <div className="max-w-xl mx-auto space-y-4">
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

      {file && (
        <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-3">
          <FileText size={16} className="text-primary flex-shrink-0" />
          <p className="text-sm font-medium truncate flex-1">{file.name}</p>
          <button type="button" onClick={() => { setFile(null); setResult(''); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Remove
          </button>
        </div>
      )}

      {file && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t('ocr_language')}</p>
            <div className="flex gap-1">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className="flex-1 text-xs py-2 rounded-lg border transition-colors"
                  style={{
                    background: language === lang.code ? 'hsl(var(--primary))' : 'transparent',
                    color: language === lang.code ? 'white' : undefined,
                    borderColor: language === lang.code ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  }}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => extractText()}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Scan size={15} />
            {isPending ? t('ocr_extracting') : t('extract_text')}
          </button>
        </div>
      )}

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
          <textarea
            readOnly
            value={result}
            rows={12}
            dir={language === 'fa' ? 'rtl' : 'ltr'}
            className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm resize-none focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
