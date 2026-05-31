import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAiService } from '../documentAiService';
import { toast } from 'sonner';
import type { Lang } from '@/i18n';

interface DocumentAiFields {
  id: string;
  file_name: string;
  summary?: string | null;
  key_points?: string[] | null;
  word_count?: number | null;
  summary_language?: string | null;
  summary_generated_at?: string | null;
}

interface Props {
  document: DocumentAiFields;
  file?: File | null;
}

const SUMMARY_LANGS: { code: Lang; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fa', label: 'فارسی' },
];

export function DocumentSummary({ document, file }: Readonly<Props>) {
  const [expanded, setExpanded] = useState(false);
  const [summaryLang, setSummaryLang] = useState<Lang>('de');
  const qc = useQueryClient();

  const { mutate: generateSummary, isPending } = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('No file selected — pick the PDF below');
      return documentAiService.processDocument(file, document.id, summaryLang);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Summary generated');
      setExpanded(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hasSummary = !!document.summary;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-primary" />
          <span className="text-sm font-medium">AI Summary</span>
          {document.word_count != null && (
            <span className="text-xs text-muted-foreground">
              {document.word_count.toLocaleString()} words
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasSummary && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {document.summary_language?.toUpperCase()}
            </span>
          )}
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {hasSummary ? (
                <>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {document.summary}
                  </p>

                  {document.key_points && document.key_points.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                        Key Points
                      </p>
                      <ul className="space-y-1">
                        {document.key_points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {document.summary_generated_at
                        ? new Date(document.summary_generated_at).toLocaleDateString('en-GB')
                        : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => generateSummary()}
                      disabled={isPending || !file}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                    >
                      <RefreshCw size={12} className={isPending ? 'animate-spin' : ''} />
                      Regenerate
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No summary yet. Generate one with AI.
                  </p>

                  <div className="flex gap-2">
                    {SUMMARY_LANGS.map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setSummaryLang(lang.code)}
                        className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                        style={{
                          background: summaryLang === lang.code ? 'hsl(var(--primary))' : 'transparent',
                          color: summaryLang === lang.code ? 'white' : undefined,
                          borderColor: summaryLang === lang.code ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                        }}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => generateSummary()}
                    disabled={isPending || !file}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    <Sparkles size={14} />
                    {isPending ? 'Generating…' : 'Generate Summary'}
                  </button>

                  {!file && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText size={11} />
                      Load the PDF file below to generate a summary
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
