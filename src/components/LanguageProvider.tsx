import { useEffect } from 'react';
import { useAppearance } from '@/features/settings/appearanceStore';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useAppearance(s => s.language);

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

  return <>{children}</>;
}
