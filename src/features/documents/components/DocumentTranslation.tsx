import { useState } from 'react';
import { Languages, ArrowRight, Copy, Download } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { translationService, type TranslateLang } from '../translationService';
import { documentAiService } from '../documentAiService';
import { toast } from 'sonner';

interface DocumentTransFields {
  id: string;
  file_name: string;
  extracted_text?: string | null;
}

interface Props {
  document: DocumentTransFields;
  file?: File | null;
}

interface LangOption {
  code: TranslateLang;
  label: string;
  flag: string;
}

const LANGUAGES: LangOption[] = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
];

export function DocumentTranslation({ document, file }: Readonly<Props>) {
  const [sourceLang, setSourceLang] = useState<TranslateLang>('de');
  const [targetLang, setTargetLang] = useState<TranslateLang>('fa');
  const [result, setResult] = useState('');
  const [charCount, setCharCount] = useState(0);

  const { mutate: translate, isPending } = useMutation({
    mutationFn: async () => {
      let text = document.extracted_text ?? '';
      if (!text && file) {
        text = await documentAiService.extractTextFromPdf(file);
      }
      if (!text) throw new Error('No text available — load the PDF file below first');
      return translationService.translateDocument(text, targetLang, sourceLang);
    },
    onSuccess: (translated) => {
      setResult(translated);
      setCharCount(translated.length);
      toast.success('Translation complete');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyResult = () => {
    navigator.clipboard.writeText(result).then(() => toast.success('Copied to clipboard'));
  };

  const downloadResult = () => {
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.file_name.replace('.pdf', '')}_${targetLang}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const targetOptions = LANGUAGES.filter(l => l.code !== sourceLang);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1.5">From</p>
          <div className="flex gap-1">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSourceLang(lang.code);
                  if (targetLang === lang.code) {
                    setTargetLang(LANGUAGES.find(l => l.code !== lang.code)!.code);
                  }
                }}
                className="flex-1 text-xs py-2 rounded-lg border transition-colors"
                style={{
                  background: sourceLang === lang.code ? 'hsl(var(--primary))' : 'transparent',
                  color: sourceLang === lang.code ? 'white' : undefined,
                  borderColor: sourceLang === lang.code ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                }}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
        </div>

        <ArrowRight size={16} className="text-muted-foreground mt-5 flex-shrink-0" />

        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1.5">To</p>
          <div className="flex gap-1">
            {targetOptions.map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setTargetLang(lang.code)}
                className="flex-1 text-xs py-2 rounded-lg border transition-colors"
                style={{
                  background: targetLang === lang.code ? 'hsl(var(--primary))' : 'transparent',
                  color: targetLang === lang.code ? 'white' : undefined,
                  borderColor: targetLang === lang.code ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                }}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => translate()}
        disabled={isPending || sourceLang === targetLang || (!document.extracted_text && !file)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        <Languages size={15} />
        {isPending ? 'Translating…' : 'Translate Document'}
      </button>

      {!document.extracted_text && !file && (
        <p className="text-xs text-muted-foreground text-center">
          Load the PDF file below to enable translation
        </p>
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{charCount.toLocaleString()} characters</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyResult}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-muted transition-colors"
              >
                <Copy size={12} /> Copy
              </button>
              <button
                type="button"
                onClick={downloadResult}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-muted transition-colors"
              >
                <Download size={12} /> Download
              </button>
            </div>
          </div>
          <div
            className="bg-muted rounded-xl p-4 text-sm leading-relaxed max-h-64 overflow-y-auto"
            dir={targetLang === 'fa' ? 'rtl' : 'ltr'}
          >
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
