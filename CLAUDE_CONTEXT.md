# CLAUDE_CONTEXT.md — dailyFlow

*Last updated: 2026-05-28. Read this file at the start of every new session.*

---

## 1. Project Overview

**dailyFlow** is a personal productivity web app (React SPA) for one user (`barakzahi@web.de`). It provides a unified workspace for tasks, calendar, finances, family scheduling, documents, music, and AI-powered learning — all behind a Supabase authentication layer.

| | |
|---|---|
| **Live app** | `https://barakzai.cloud` |
| **AI Worker** | `https://api.barakzai.cloud/analyze` |
| **Repo** | `https://github.com/aryanbarak/dailyflow` |
| **Supabase project** | `taqxwnlwllbywaklwyno` (aryanbarak's Project, FREE tier) |
| **Supabase owner** | `barakzahi@web.de` |
| **Hosting** | Cloudflare Pages (auto-deploy from `main` via GitHub Actions) |

---

## 2. Tech Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18.3.1 + TypeScript 5.8.3 |
| Build | Vite 7.3.1 + SWC |
| UI Primitives | Radix UI |
| Styling | Tailwind CSS 3.4.17 |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| Server state | TanStack React Query 5 |
| Routing | React Router DOM 6 |
| Toasts | Sonner |
| PDF | react-pdf + pdfjs-dist + pdf-lib |
| Charts | Recharts |
| Icons | Lucide React |
| Fonts | Sora, Inter, Vazirmatn (RTL/Farsi) |

### Backend / Cloud
| Service | Role |
|---------|------|
| Supabase (PostgreSQL) | Primary database (6 tables) + Auth + Storage |
| Cloudflare Pages | Static frontend hosting |
| Cloudflare Worker (`dailyflow-ai-worker`) | AI proxy → Google Gemini 2.5 Flash |

### CI/CD
- **GitHub Actions** → `.github/workflows/deploy-cloudflare-pages.yml`
- Triggers on push to `main` or manual `workflow_dispatch`
- Build command: `npm run build`

### GitHub Secrets (as of 2026-05-28)
| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Wrangler deploy auth |
| `CLOUDFLARE_ACCOUNT_ID` | Wrangler deploy target |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | Wrangler deploy target |
| `VITE_AI_AGENT_URL` | URL of the AI worker |
| `VITE_APP_ENV` | App environment flag |
| `VITE_TUTOR_API_URL` | Tutor API base URL |
| `VITE_TUTOR_API_TOKEN` | Tutor API auth token |
| `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY_B64` | Legacy SSH deploy (unused) |

> ⚠️ `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are **intentionally NOT in GitHub secrets** — see section 7.

---

## 3. Features & Status

| Feature | Route | Status | Notes |
|---------|-------|--------|-------|
| Authentication | `/auth` | ✅ Working | Supabase Auth, email+password |
| Dashboard | `/` | ✅ Working | Aggregated overview, today's events, greeting |
| Tasks | `/tasks` | ✅ Working | CRUD, due dates, overdue filter, Supabase-backed |
| Calendar | `/calendar` | ✅ Working | Supabase-backed with localStorage offline fallback |
| Finance | `/finance` | ✅ Working | Income/expense CRUD, charts, PDF export |
| Family Hub | `/family` | ✅ Working | Members, roles, schedule, notes, calendar sync |
| Documents | `/documents` | ✅ Working | PDF upload, Supabase Storage, signed URLs |
| Learn with AI | `/learn-ai` | ✅ Working | Gemini 2.5 Flash, 4 modes, 3 languages (de/fa/en), chat history |
| Photos | `/photos` | ✅ Working | Masonry grid, lightbox, tags, search, AI tagging, R2 storage |
| Music | `/music` | ✅ Working | YouTube search + player, playlists, local files, Pomodoro timer |
| PWA | all | ✅ Working | Installable, service worker, offline badge |
| Tutor (Algorithms) | `/tutor` | 🔧 Partial | Static exam bank works; Python adapter optional |
| Tutor (WISO) | `/tutor/wiso` | 🔧 Partial | Same as above |
| Links | `/links` | 🔧 Partial | Basic list, no tagging/search |
| Settings | `/settings` | 🔧 Partial | Minimal; no full profile/password editing |
| Dark mode | all | ✅ Working | Default dark, `next-themes` |
| RTL/Farsi | Learn AI | ✅ Working | Vazirmatn font, per-message RTL |
| Mobile nav | all | ✅ Working | Bottom nav, auto-closes on navigation |
| Error boundaries | all | ✅ Working | Wraps all feature areas |
| Offline badge | all | ✅ Working | Network status indicator |

---

## 4. Database Schema (Supabase)

All tables use `user_id` FK → `auth.users` with RLS enforced.

### `tasks`
`id, user_id, title, notes, due_date (YYYY-MM-DD), completed, created_at, updated_at`

### `finance_transactions`
`id, user_id, type ('income'|'expense'), amount, category, date (YYYY-MM-DD), notes, created_at, updated_at`

### `family_children`
`id, user_id, name, age, color (hex), initials, role, schedule (jsonb), notes (jsonb), events (jsonb), created_at`

### `documents`
`id, user_id, storage_path, file_name, mime_type, size_bytes, title, description, created_at, updated_at`

### `learn_ai_messages`
`id, user_id, mode ('fiae_algorithms'|'general_it'|'wiso'|'planner'), language ('de'|'fa'|'en'), role ('user'|'assistant'), content, created_at`

### `calendar_events`
`id, user_id, title, date (YYYY-MM-DD), start_time (HH:MM|null), end_time (HH:MM|null), location, description, color, type, all_day, created_at, updated_at`

### Storage Buckets
- `documents` — user PDFs at `{userId}/{fileName}`

### localStorage Keys (fallback/offline only)
- `dailyflow:v1:events` — calendar events offline cache
- `dailyflow:v1:calendar-ui-state` — view state
- `dailyflow:learn-ai:{userId}:{mode}` — AI message fallback

---

## 5. Key Files

| File | Purpose |
|------|---------|
| `src/integrations/supabase/client.ts` | Supabase client — hardcoded URL+key as primary values |
| `src/integrations/supabase/types.ts` | Generated DB types |
| `src/features/calendar/calendarService.ts` | Calendar CRUD (Supabase + localStorage fallback) |
| `src/features/tasks/tasksService.ts` | Tasks CRUD |
| `src/features/finance/financeService.ts` | Finance CRUD |
| `src/features/family/familyService.ts` | Family CRUD |
| `src/features/learn-ai/aiService.ts` | Fetch → api.barakzai.cloud/analyze |
| `src/hooks/useAuth.ts` | Session/user state |
| `src/lib/storage.ts` | Safe localStorage wrappers |
| `vite.config.ts` | Proxy, chunk splitting, PWA config |
| `.github/workflows/deploy-cloudflare-pages.yml` | CI/CD pipeline |

---

## 6. Recent Changes (since 2026-05-23)

| Commit | Change |
|--------|--------|
| `254c327` | **fix(supabase):** hardcoded URL/key is primary; env var only overrides if valid (includes `supabase.co`) — prevents broken GitHub secrets from breaking auth |
| `46d58d2` | **fix(pwa):** set `navigateFallback: null` to fix SW "non-precached-url" crash on page navigation |
| `50227fc` | **fix(pwa):** stop caching index.html and Supabase API calls in service worker |
| `e9cd71d` | **fix(supabase):** hardcode public URL and anon key as fallbacks |
| `2fc852c` | **fix(dashboard):** deduplicate today's events from repeated localStorage migration |
| `7495a13` | **feat(family-hub):** add Family Hub page, components, hooks, routing |
| `62d405e` | **feat(family-hub):** member role field with age-based defaults and role selector |
| `dedd67a` | **feat(pwa):** add PWA support with service worker, offline page, install prompt, icons |
| `d0fbdac` | **feat(photos):** masonry grid, lightbox, tags, search, timeline, AI tagging |
| `1a942a8` | **feat(photos):** Photo Gallery with R2 storage, albums, lightbox |
| `844f8f7` | **feat(music):** add Playlists tab |
| `b690f49` | **feat(music):** YouTube search via Invidious API |
| `b5c8ba2` | **feat(music):** full music page (YouTube player, local files, Pomodoro timer) |
| `fdfa91f` | **feat(calendar):** migrate from localStorage to Supabase with offline fallback |

---

## 7. Critical Operational Notes

### Supabase Credentials — HARDCODED BY DESIGN
```
URL:  https://taqxwnlwllbywaklwyno.supabase.co
KEY:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...TmhuyWcwEUwnSvxXJiZ2HueY6Jr0sudmyJWlpM-X7_Y
```

- These are **public credentials** (anon key with RLS) — safe to commit
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` GitHub secrets were **intentionally deleted** on 2026-05-28 after repeated incidents where wrong secret values broke auth
- `client.ts` has a guard: if `VITE_SUPABASE_URL` doesn't contain `supabase.co`, it falls back to the hardcoded value
- **Do not re-add these as GitHub secrets** unless you also update the guard logic

### When Auth Breaks ("Failed to fetch" / "NetworkError")
1. Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in GitHub secrets — if they exist with wrong values, delete them
2. Open browser DevTools → Network → look at the Request URL in the failed Supabase call — wrong URL = wrong/truncated secret
3. Supabase Auth → URL Configuration must have Site URL = `https://barakzai.cloud` and redirect `https://barakzai.cloud/**`
4. After any fix: manually trigger workflow via `gh workflow run deploy-cloudflare-pages.yml --ref main`

### Supabase FREE Tier
- Projects **pause after 7 days of inactivity**
- If paused: go to Supabase dashboard → restart project
- Maintenance windows can cause temporary auth failures (check the banner in the dashboard)

### AI Worker
- Source lives in `dailyflow-ai-worker/` (NOT in this repo's git history — no version control)
- `GEMINI_API_KEY` must be set manually via `npx wrangler secret put GEMINI_API_KEY` inside `dailyflow-ai-worker/`
- CORS is hardcoded to `https://barakzai.cloud` only — localhost requests are blocked in production

### Deployment
```bash
# Push to main triggers auto-deploy
git push origin main

# Force a redeploy without code changes
gh workflow run deploy-cloudflare-pages.yml --ref main

# Watch deployment
gh run watch <run-id>
```

---

## 8. Known Bugs & Limitations

| # | Issue | Severity |
|---|-------|---------|
| 1 | `learn_ai_messages` grows unbounded — no pruning | Low |
| 2 | Family `events`/`schedule`/`notes` JSONB arrays grow unbounded | Low |
| 3 | No optimistic rollback on Supabase write failure (UI desyncs until reload) | Medium |
| 4 | Single Gemini model — no fallback if rate-limited | Medium |
| 5 | No rate limiting on `/analyze` endpoint | Medium |
| 6 | Signed URL lifetime for documents is short (~20s in some configs) | Low |
| 7 | No error tracking (Sentry / CF Analytics) | Low |
| 8 | `dailyflow-ai-worker` has no CI/CD and no git repo | Low |

---

## 9. Next Planned Features

| Priority | Feature |
|----------|---------|
| High | Full Settings page (password change, language, notification prefs) |
| High | Rate-limit AI Worker (Cloudflare Rate Limiting or KV counter) |
| High | Add RLS policies documentation + migration files to repo |
| Medium | Mobile-optimize Finance and Family pages |
| Medium | Prune `learn_ai_messages` (DB trigger or scheduled function) |
| Medium | Links page enhancements (tags, search, browser bookmark import) |
| Low | Sentry / error tracking |
| Low | Expand Vitest test coverage for service layer |
| Low | Git-initialize `dailyflow-ai-worker` and add deploy workflow |

---

## 10. Local Development

```bash
cd dailyflow
npm install
npm run dev          # starts on http://localhost:8080
```

Vite proxies `/__ai/*` → `VITE_AI_AGENT_URL` (default: `http://localhost:8000`) for the optional local Python tutor adapter.

The AI features in dev point to `https://api.barakzai.cloud/analyze` (production Worker) — CORS will block requests from localhost unless you run `wrangler dev` locally.
