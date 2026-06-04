import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { collectBriefingData, generateBriefing } from './briefingService';
import { supabase } from '@/integrations/supabase/client';
import { useT } from '@/i18n';

const CACHE_KEY = 'dailyflow:briefing-cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CachedBriefing {
  briefing: string;
  provider: string;
  generatedAt: string;
  cachedAt: number;
}

export function useBriefing() {
  const { lang } = useT();
  const [briefing, setBriefing] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromCache = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const cached = JSON.parse(raw) as CachedBriefing;
      if (Date.now() - cached.cachedAt > CACHE_TTL) return false;
      setBriefing(cached.briefing);
      setProvider(cached.provider);
      setGeneratedAt(cached.generatedAt);
      return true;
    } catch {
      return false;
    }
  }, []);

  const generate = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && loadFromCache()) return;

    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const data = await collectBriefingData();
      const result = await generateBriefing(data, lang, session.access_token);

      setBriefing(result.briefing);
      setProvider(result.provider);
      setGeneratedAt(result.generatedAt);

      const cached: CachedBriefing = { ...result, cachedAt: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate briefing';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [lang, loadFromCache]);

  return { briefing, provider, generatedAt, isLoading, error, generate, loadFromCache };
}
