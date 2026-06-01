import { useState } from 'react';
import { ArrowRight, Copy, Languages } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { translationService, type TranslateLang } from '../translationService';
import { toast } from 'sonner';

const LANGUAGES = [
  { code: 'de' as TranslateLang, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en' as TranslateLang, label: 'English', flag: '🇬🇧' },
  { code: 'fa' as TranslateLang, label: 'فارسی', flag: '🇮🇷' },
];

export function TextTranslator() {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState<TranslateLang>('de');
  const [targetLang, setTargetLang] = useState<TranslateLang>('fa');
  const [result, setResult] = useState('');

  const { mutate: translate, isPending } = useMutation({
    mutationFn: () => translationService.translate(inputText, targetLang, sourceLang),
    onSuccess: (data) => {
      setResult(data.translated);
      toast.success('Translation complete');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const targetOptions = LANGUAGES.filter(l => l.code !== sourceLang);

  const langButton = (lang: typeof LANGUAGES[number], active: boolean, onClick: () => void) => (
    <button
      key={lang.code}
      type="button"
      onClick={onClick}
      className="flex-1 text-xs py-2 rounded-lg border transition-colors"
      style={{
        background: active ? 'hsl(var(--primary))' : 'transparent',
        color: active ? 'white' : undefined,
        borderColor: active ? 'hsl(var(--primary))' : 'hsl(var(--border))',
      }}
    >
      {lang.flag} {lang.label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1.5">From</p>
          <div className="flex gap-1">
            {LANGUAGES.map(lang => langButton(lang, sourceLang === lang.code, () => {
              setSourceLang(lang.code);
              if (targetLang === lang.code) {
                setTargetLang(LANGUAGES.find(l => l.code !== lang.code)!.code);
              }
            }))}
          </div>
        </div>

        <ArrowRight size={16} className="text-muted-foreground mt-5 flex-shrink-0" />

        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1.5">To</p>
          <div className="flex gap-1">
            {targetOptions.map(lang => langButton(lang, targetLang === lang.code, () => setTargetLang(lang.code)))}
          </div>
        </div>
      </div>

      <textarea
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        placeholder="Enter text to translate…"
        rows={5}
        dir={sourceLang === 'fa' ? 'rtl' : 'ltr'}
        className="w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      <button
        type="button"
        onClick={() => translate()}
        disabled={isPending || !inputText.trim() || sourceLang === targetLang}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        <Languages size={15} />
        {isPending ? 'Translating…' : 'Translate'}
      </button>

      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{result.length.toLocaleString()} characters</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(result).then(() => toast.success('Copied'))}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              <Copy size={12} /> Copy
            </button>
          </div>
          <textarea
            readOnly
            value={result}
            rows={5}
            dir={targetLang === 'fa' ? 'rtl' : 'ltr'}
            className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm resize-none focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
