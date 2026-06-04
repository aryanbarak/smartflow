import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Clock, Cpu, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useBriefing } from '@/features/briefing/useBriefing';
import { useT } from '@/i18n';

export default function BriefingPage() {
  const { briefing, provider, generatedAt, isLoading, error, generate, loadFromCache } = useBriefing();
  const { t } = useT();

  useEffect(() => {
    if (!loadFromCache()) void generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formattedTime = generatedAt ? new Date(generatedAt).toLocaleString() : null;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold mb-1 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              {t('briefing_title')}
            </h1>
            <p className="text-muted-foreground">{t('briefing_subtitle')}</p>
          </div>
          <button
            onClick={() => void generate(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 transition-all text-sm flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? t('briefing_generating') : t('briefing_refresh')}
          </button>
        </div>
      </motion.div>

      {(provider || formattedTime) && (
        <div className="flex items-center gap-4 mb-6 text-xs text-muted-foreground">
          {provider && (
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" /> {provider}
            </span>
          )}
          {formattedTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formattedTime}
            </span>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">{t('briefing_loading_message')}</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {briefing && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-sm max-w-none
            prose-headings:text-white prose-headings:font-semibold
            prose-h2:text-base prose-h2:mt-6 prose-h2:mb-2
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-muted-foreground prose-li:my-0.5
            prose-strong:text-white"
        >
          <ReactMarkdown>{briefing}</ReactMarkdown>
        </motion.div>
      )}

      {!briefing && !isLoading && !error && (
        <div className="text-center py-24 text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="mb-4">{t('briefing_empty')}</p>
          <button
            onClick={() => void generate()}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {t('briefing_generate')} →
          </button>
        </div>
      )}
    </div>
  );
}
