# dailyFlow — Project Overview

## What is dailyFlow?
Personal productivity web app (React SPA) for one user (barakzahi@web.de).
Unified workspace for tasks, calendar, finances, family scheduling,
documents, music, photos, and AI-powered learning.

## Live URLs
- App: https://barakzai.cloud
- AI Worker: https://api.barakzai.cloud/analyze
- Repo: https://github.com/aryanbarak/dailyflow
- Supabase: taqxwnlwllbywaklwyno (FREE tier)

## Tech Stack
- Frontend: React 18.3.1 + TypeScript 5.8.3 + Vite 7 + SWC
- UI: Tailwind CSS 3.4 + Radix UI + Framer Motion
- State: TanStack React Query v5 + Zustand v5
- Router: React Router DOM v6
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Hosting: Cloudflare Pages (auto-deploy from main via GitHub Actions)
- AI Cloud: Cloudflare Worker + Gemini 2.5 Flash
- AI Local: Ollama (qwen2.5-coder:7b, qwen2.5-coder:14b, llama3.1:8b)
- Toasts: Sonner
- Icons: Lucide React
- Fonts: Sora, Inter, Vazirmatn (RTL/Farsi)

## Key Architectural Decisions
- Supabase credentials hardcoded in client.ts (not in GitHub secrets) — intentional
- VITE_SUPABASE_URL must NOT be added to GitHub secrets (caused broken auth in the past)
- OLLAMA_VULKAN=1 required for Intel Arc 140V GPU
- Models stored in E:\ollamaModels
- All tables use RLS with user_id FK to auth.users
- PWA: navigateFallback=null to prevent SW crashes on navigation
- Calendar: Supabase primary + localStorage offline fallback
- i18n: lightweight custom useT() hook (no i18next), en/de/fa, RTL for fa
