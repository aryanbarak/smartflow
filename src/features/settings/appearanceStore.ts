import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'compact' | 'normal' | 'comfortable';
export type AccentColor = 'indigo' | 'violet' | 'rose' | 'amber' | 'emerald' | 'sky';
export type Language = 'en' | 'de' | 'fa';

interface AppearanceState {
  density: Density;
  accentColor: AccentColor;
  reducedMotion: boolean;
  language: Language;
  setDensity: (d: Density) => void;
  setAccentColor: (c: AccentColor) => void;
  setReducedMotion: (v: boolean) => void;
  setLanguage: (l: Language) => void;
}

export const ACCENT_COLORS: Record<AccentColor, { label: string; hex: string; hsl: string }> = {
  indigo:  { label: 'Indigo',  hex: '#6366f1', hsl: '239 84% 67%' },
  violet:  { label: 'Violet',  hex: '#8b5cf6', hsl: '258 90% 66%' },
  rose:    { label: 'Rose',    hex: '#f43f5e', hsl: '347 77% 60%' },
  amber:   { label: 'Amber',   hex: '#f59e0b', hsl: '38 92% 50%'  },
  emerald: { label: 'Emerald', hex: '#10b981', hsl: '160 84% 39%' },
  sky:     { label: 'Sky',     hex: '#0ea5e9', hsl: '199 89% 48%' },
};

export const DENSITY_OPTIONS: { value: Density; label: string; desc: string }[] = [
  { value: 'compact',     label: 'Compact',      desc: 'Less space, more content' },
  { value: 'normal',      label: 'Normal',        desc: 'Default layout' },
  { value: 'comfortable', label: 'Comfortable',   desc: 'More spacing, easier reading' },
];

export const useAppearance = create<AppearanceState>()(
  persist(
    set => ({
      density: 'normal',
      accentColor: 'indigo',
      reducedMotion: false,
      language: 'en',
      setDensity: density => set({ density }),
      setAccentColor: accentColor => {
        const { hsl } = ACCENT_COLORS[accentColor];
        document.documentElement.style.setProperty('--primary', hsl);
        set({ accentColor });
      },
      setReducedMotion: reducedMotion => set({ reducedMotion }),
      setLanguage: language => set({ language }),
    }),
    { name: 'dailyflow:appearance' },
  ),
);
