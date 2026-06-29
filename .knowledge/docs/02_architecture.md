# smartFlow — Architecture

## Frontend Structure

```
src/
├── features/
│   ├── tasks/
│   ├── calendar/
│   ├── finance/
│   ├── family/
│   ├── learn-ai/
│   ├── habits/
│   ├── journal/
│   ├── flashcards/
│   ├── mood/
│   ├── search/
│   ├── links/
│   └── settings/       (appearanceStore, notificationSettings, dataExportService)
├── pages/
├── components/
│   └── layout/         (Sidebar, Header, MobileNav, AppLayout)
├── hooks/
├── lib/
├── i18n/               (en/de/fa translations, useT() hook)
└── integrations/
    └── supabase/
        └── client.ts   (hardcoded credentials — no env vars)
```

## Feature Module Pattern
Every feature follows this exact structure:
1. `src/features/<feature>/types.ts`
2. `src/features/<feature>/<feature>Service.ts`
3. `src/features/<feature>/use<Feature>.ts`
4. `src/pages/<Feature>Page.tsx`

## AI Architecture

```
User → React App → Cloudflare Worker → Gemini 2.5 Flash (primary)
                                     ↓ (on failure)
                                  Ollama Local (llama3.1:8b)
```

## All Routes
/auth, /, /tasks, /calendar, /finance, /family, /family-hub, /documents,
/learn-ai, /tutor, /tutor/app, /tutor/wiso, /photos, /music, /habits,
/journal, /flashcards, /links, /settings

## i18n Architecture
- Hook: useT() from src/i18n/index.ts
- Languages: en (default), de, fa
- RTL: only for fa (sets html[dir=rtl])
- LanguageProvider syncs html[lang], html[dir], Vazirmatn font class
- All UI strings must use t('key') — no hardcoded strings
- Language stored in appearanceStore (Zustand persist to smartflow:appearance)

## Global State (Zustand stores)
- appearanceStore: density, accentColor, reducedMotion, language
- notificationSettings: task/habit/calendar/daily-summary reminder prefs
- pomodoroStore: Pomodoro timer + linked task

## Local AI Architecture
- Ollama server: http://localhost:11434
- OLLAMA_VULKAN=1 (Intel Arc 140V iGPU — 14.5 t/s)
- Continue.dev: config at C:\Users\aryan\.continue\config.yaml
- Prompt library: .prompts/ (24 files across 7 categories)
- Knowledge Base: .knowledge/ (ChromaDB + nomic-embed-text)
