import { useEffect } from 'react';
import { useAppearance } from '@/features/settings/appearanceStore';
import { supabase } from '@/integrations/supabase/client';

export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const language = useAppearance(s => s.language);
  const setLanguage = useAppearance(s => s.setLanguage);

  // Apply language attributes to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', language);
    html.setAttribute('dir', language === 'fa' ? 'rtl' : 'ltr');
    if (language === 'fa') {
      html.classList.add('font-vazirmatn');
    } else {
      html.classList.remove('font-vazirmatn');
    }
  }, [language]);

  // Load saved language from user_settings on mount and after sign-in,
  // so the agent worker and the UI always share one source of truth.
  useEffect(() => {
    let active = true;

    async function syncFromDb() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data } = await supabase
        .from('user_settings')
        .select('language')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!active) return;
      const lang = data?.language;
      if (lang === 'en' || lang === 'de' || lang === 'fa') {
        setLanguage(lang);
      }
    }

    syncFromDb();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN') syncFromDb();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setLanguage]);

  return <>{children}</>;
}
