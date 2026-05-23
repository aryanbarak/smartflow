# dailyFlow — Project Report

*Generated: 2026-05-23*

---

## 1. Project Overview

**dailyFlow** is an intelligent personal productivity platform built as a React SPA. It provides a unified workspace for tasks, calendars, finances, family scheduling, documents, music, and AI-powered learning — all behind a single Supabase authentication layer.

### Status

| Dimension | Assessment |
|-----------|-----------|
| Overall maturity | Early production / MVP stage |
| Frontend quality | Well-structured, linted, typed |
| Backend completeness | Core features fully wired; some pages are stubs |
| Test coverage | Minimal (Vitest configured, few test files) |
| Documentation | None beyond code comments |

### Live URLs

| Service | URL |
|---------|-----|
| Frontend (Cloudflare Pages) | `https://barakzai.cloud` |
| AI Worker | `https://api.barakzai.cloud/analyze` |
| AI Worker health check | `https://api.barakzai.cloud/health` |

---

## 2. Technology Stack

### Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.8.3 |
| Build tool | Vite + SWC | 7.3.1 |
| UI primitives | Radix UI | various |
| Styling | Tailwind CSS | 3.4.17 |
| Animation | Framer Motion | 12.23.26 |
| Forms | React Hook Form + Zod | 7.61.1 / 3.25.76 |
| Server state | TanStack React Query | 5.83.0 |
| Routing | React Router DOM | 6.30.1 |
| Toasts | Sonner | 1.7.4 |
| PDF rendering | react-pdf + pdfjs-dist | 10.3.0 / 5.4.296 |
| PDF generation | pdf-lib | 1.17.1 |
| Charts | Recharts | 2.15.4 |
| Dark mode | Next Themes | 0.3.0 |
| Icons | Lucide React | latest |
| Fonts | Sora, Inter, Vazirmatn | — |

### Backend / Cloud Services

| Service | Role |
|---------|------|
| Supabase (PostgreSQL) | Primary database, 5 tables |
| Supabase Auth | Session management, JWT |
| Supabase Storage | Document/file uploads |
| Cloudflare Pages | Static frontend hosting |
| Cloudflare Workers | AI proxy Worker (`dailyflow-ai-worker`) |
| Google Gemini 2.5 Flash | AI completions (via Worker) |

### Development Tooling

| Tool | Purpose |
|------|---------|
| ESLint 9.32.0 | Linting with TypeScript + SonarJS rules |
| Vitest 2.1.9 | Unit / component testing |
| Wrangler 3.x | Cloudflare Worker dev & deploy |

### CI/CD

- **GitHub Actions** (`.github/workflows/deploy-cloudflare-pages.yml`)
- Triggers on push to `main`
- Required secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT_NAME`
- Build command: `npm run build` (or `npm run build:tutor` for tutor content)

---

## 3. Features Inventory

| Feature | Page | Status | Notes |
|---------|------|--------|-------|
| Authentication (sign-in/sign-up) | `/auth` | ✅ Fully working | Supabase Auth |
| Dashboard | `/` | ✅ Fully working | Aggregated overview, greeting, quick stats |
| Tasks | `/tasks` | ✅ Fully working | CRUD, due dates, overdue filter |
| Calendar | `/calendar` | ✅ Fully working | localStorage-backed, 3 view modes, family sync |
| Finance | `/finance` | ✅ Fully working | Income/expense, charts, PDF export |
| Family | `/family` | ✅ Fully working | Children, schedules, notes, events, calendar sync |
| Documents | `/documents` | ✅ Fully working | PDF upload, Supabase Storage, signed URLs |
| Learn with AI | `/learn-ai` | ✅ Fully working | Gemini 2.5 Flash, 4 modes, 3 languages, chat history |
| Tutor (FIAE Algorithms) | `/tutor` | 🔧 Partial | Static exam bank works; adapter (local Python) optional |
| Tutor (WISO) | `/tutor/wiso` | 🔧 Partial | Same as above; requires `npm run tutor:prep` |
| Music | `/music` | ❌ Stub | Page exists; no real functionality |
| Links | `/links` | 🔧 Partial | Basic link collection; limited UI |
| Settings | `/settings` | 🔧 Partial | Minimal preferences; no full profile editing |
| Offline support | all | 🔧 Partial | Calendar + Learn AI have localStorage fallbacks |
| Dark mode | all | ✅ Fully working | `next-themes`, dark as default |
| RTL / Farsi | Learn AI | ✅ Fully working | Vazirmatn font, RTL layout per-message |
| Multilingual UI | Learn AI | ✅ Fully working | German (de), Farsi (fa), English (en) |
| Responsive / mobile | all | 🔧 Partial | Mobile nav exists; some pages not optimized |
| Error boundaries | all | ✅ Fully working | `<ErrorBoundary>` wraps feature areas |
| Offline badge | all | ✅ Fully working | `<OfflineBadge>` in layout |

---

## 4. File & Folder Structure

```
dailyflow/
├── public/
│   ├── favicon.svg                  # 64×64 SVG icon (cyan→violet gradient)
│   ├── dailyflow-icon.svg           # 48×48 sidebar icon
│   ├── logo.svg                     # 200×48 full wordmark
│   └── tutor/                       # Static exam bank content (generated)
│       ├── manifest.json
│       └── *.json                   # Exam modules
├── src/
│   ├── main.tsx                     # Entry: ReactDOM.createRoot + providers
│   ├── App.tsx                      # Router, ProtectedRoute, layout shell
│   ├── index.css                    # Global styles, CSS variables, utility classes
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx            # Aggregated home view
│   │   ├── TasksPage.tsx            # Task management
│   │   ├── CalendarPage.tsx         # Calendar (localStorage)
│   │   ├── FinancePage.tsx          # Finance tracker
│   │   ├── FamilyPage.tsx           # Family scheduler
│   │   ├── DocumentsPage.tsx        # Document manager
│   │   ├── LearnAIPage.tsx          # AI chat interface
│   │   ├── MusicPage.tsx            # Stub
│   │   ├── LinksPage.tsx            # Link collection
│   │   ├── SettingsPage.tsx         # User preferences
│   │   ├── AuthPage.tsx             # Login / sign-up
│   │   ├── TutorPage.tsx            # Tutor entry (lazy)
│   │   ├── TutorAppPage.tsx         # Algorithms exam bank
│   │   ├── TutorWisoPage.tsx        # WISO exam bank
│   │   └── NotFoundPage.tsx         # 404
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # Desktop nav with DailyFlowIcon
│   │   │   ├── MobileNav.tsx        # Bottom nav for mobile
│   │   │   ├── AppLoader.tsx        # Full-screen loading spinner
│   │   │   └── OfflineBadge.tsx     # Network status indicator
│   │   ├── ui/                      # ~40 Radix-based primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── … (accordion, avatar, badge, calendar, checkbox, …)
│   │   ├── DailyFlowLogo.tsx        # <DailyFlowLogo> + <DailyFlowIcon> SVG components
│   │   ├── StatePanel.tsx           # Empty/error/loading state component
│   │   ├── ErrorBoundary.tsx        # React error boundary
│   │   └── Skeletons.tsx            # Loading skeletons
│   │
│   ├── features/
│   │   ├── tasks/
│   │   │   └── tasksService.ts      # Supabase CRUD for tasks
│   │   ├── calendar/
│   │   │   └── calendarService.ts   # localStorage CRUD for events
│   │   ├── finance/
│   │   │   └── financeService.ts    # Supabase CRUD for transactions
│   │   ├── family/
│   │   │   └── familyService.ts     # Supabase CRUD for family_children
│   │   ├── documents/
│   │   │   ├── documentsService.ts  # Supabase Storage + metadata CRUD
│   │   │   └── useDocuments.ts      # Hook wrapping documentsService
│   │   └── learn-ai/
│   │       ├── aiService.ts         # fetch → api.barakzai.cloud/analyze
│   │       ├── learnAiService.ts    # Supabase + localStorage message persistence
│   │       ├── errorMessages.ts     # Localised error strings (de/fa/en)
│   │       └── types.ts             # LearnAIMode, LearnAILanguage, LearnAIMessage
│   │
│   ├── hooks/
│   │   ├── useAuth.ts               # Session/user state, sign-in/out
│   │   ├── useTasks.ts              # Tasks state + CRUD + toasts
│   │   ├── useEvents.ts             # Calendar events (localStorage)
│   │   ├── useFinance.ts            # Finance state + CRUD
│   │   ├── useFamily.ts             # Family state + CRUD
│   │   └── useLearnAI.ts            # AI chat state, history, sendMessage
│   │
│   ├── lib/
│   │   ├── supabaseClient.ts        # Supabase client (env vars)
│   │   ├── date.ts                  # Date helpers (toDateOnly, isSameDay, …)
│   │   ├── storage.ts               # Safe localStorage wrappers + storageKey()
│   │   ├── id.ts                    # crypto.randomUUID() with fallback
│   │   └── errors.ts               # getErrorMessage(error) utility
│   │
│   ├── providers/
│   │   └── AuthProvider.tsx         # React context for auth state
│   │
│   └── integrations/supabase/
│       ├── client.ts                # Re-exports supabaseClient
│       └── types.ts                 # Generated Supabase DB types
│
├── index.html                       # Vite entry, fonts, favicon
├── package.json
├── vite.config.ts                   # Proxy, chunk splitting, path alias
├── tailwind.config.ts               # Custom tokens, fonts, animations
├── tsconfig.json
└── .env.example                     # Documented env vars

dailyflow-ai-worker/                 # Separate Cloudflare Worker project
├── src/
│   └── index.js                     # Worker handler (CORS, Gemini proxy)
├── wrangler.toml                    # Worker name, route, compatibility_date
└── package.json                     # { wrangler devDependency }
```

---

## 5. API Endpoints

### Cloudflare Worker — `api.barakzai.cloud`

| Method | Path | Auth | Request body | Response |
|--------|------|------|-------------|---------|
| `OPTIONS` | `/analyze` | — | — | 204, CORS preflight |
| `POST` | `/analyze` | Origin check | `{ message: string, history: [{role, content}] }` | `{ answer: string }` |
| `GET` | `/health` | None | — | `{ ok: true, service: "dailyflow-ai-worker" }` |

**CORS policy**: Only `https://barakzai.cloud` is allowed as Origin. Any other origin receives `403 Forbidden origin`.

**Worker internals**:
- Reads `env.GEMINI_API_KEY` (Cloudflare Worker Secret — must be set via `wrangler secret put GEMINI_API_KEY`)
- Maps `"assistant"` → `"model"` for Gemini's role format
- Calls `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

### Supabase (auto-generated REST + client SDK)

All Supabase access goes through the `@supabase/supabase-js` client SDK (not raw REST) using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Vite Dev Proxy

| Pattern | Proxies to |
|---------|-----------|
| `/__ai/*` | `VITE_AI_AGENT_URL` (default: `http://localhost:8000`) |

This proxy is for local development with the optional Python tutor adapter and is not active in production.

---

## 6. Database Schema

All tables are in Supabase (PostgreSQL). Row-level security is enforced through `user_id` columns and Supabase Auth.

### `tasks`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → auth.users |
| `title` | `text` | Required |
| `notes` | `text` | Nullable |
| `due_date` | `text` | `YYYY-MM-DD` format |
| `completed` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | Auto |
| `updated_at` | `timestamptz` | Auto |

### `finance_transactions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → auth.users |
| `type` | `text` | `'income'` or `'expense'` |
| `amount` | `numeric` | Positive value |
| `category` | `text` | User-defined string |
| `date` | `text` | `YYYY-MM-DD` |
| `notes` | `text` | Nullable |
| `created_at` | `timestamptz` | Auto |
| `updated_at` | `timestamptz` | Auto |

### `family_children`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → auth.users |
| `name` | `text` | Child's name |
| `age` | `integer` | Nullable |
| `color` | `text` | Avatar background color hex |
| `initials` | `text` | 1-2 chars |
| `schedule` | `jsonb` | `[{day: string, activity: string}]` |
| `notes` | `jsonb` | `string[]` |
| `events` | `jsonb` | `[{title, date, calendarEventId?}]` |
| `created_at` | `timestamptz` | Auto |

### `documents`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → auth.users |
| `storage_path` | `text` | Path in Supabase Storage bucket |
| `file_name` | `text` | Original filename |
| `mime_type` | `text` | e.g. `application/pdf` |
| `size_bytes` | `integer` | File size |
| `title` | `text` | User-provided title |
| `description` | `text` | Nullable |
| `created_at` | `timestamptz` | Auto |
| `updated_at` | `timestamptz` | Auto |

### `learn_ai_messages`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → auth.users |
| `mode` | `text` | `'fiae_algorithms'`, `'general_it'`, `'wiso'`, `'planner'` |
| `language` | `text` | `'de'`, `'fa'`, `'en'` |
| `role` | `text` | `'user'` or `'assistant'` |
| `content` | `text` | Message body |
| `created_at` | `timestamptz` | Auto |

### Storage Buckets

| Bucket | Purpose | Path pattern |
|--------|---------|-------------|
| `documents` (or `VITE_SUPABASE_STORAGE_BUCKET`) | User PDFs and files | `{userId}/{fileName}` |

### Local Storage Keys

| Key | Content |
|-----|---------|
| `dailyflow:v1:events` | Calendar events JSON array |
| `dailyflow:v1:calendar-ui-state` | View anchor, selected day, active filters |
| `dailyflow:learn-ai:{userId}:{mode}` | Message history fallback |

---

## 7. Current Limitations & Known Issues

### Incomplete Features

1. **Music page** (`/music`) — page exists with no functionality; completely stubbed out.
2. **Settings page** — minimal; no profile editing, password change, or notification preferences.
3. **Links page** — basic list only; no tagging, search, or import.
4. **Mobile layout** — MobileNav exists but several pages (Finance charts, Family schedule grid) have poor small-screen UX.

### Security

1. **CORS origin hardcoded to `https://barakzai.cloud`** — `localhost` is blocked by the Worker in production. Developers must use either Wrangler dev (`wrangler dev`) or accept CORS errors locally. Consider adding a `dev` build of the Worker that permits localhost origins.
2. **Signed URL lifetime** — Supabase Storage signed URLs expire after a short window (~20 seconds by default in some configurations). Users who copy a document link may find it expired quickly.
3. **No rate limiting** — The `/analyze` endpoint has no per-user or per-IP rate limit. Heavy use could exhaust the Gemini API quota.
4. **RLS enforcement unverified** — Row-level security is assumed but Supabase migration files were not present in the repository; it cannot be confirmed that RLS policies are correctly applied to all tables.

### Data / Architecture

5. **Calendar events in localStorage only** — Events are not synced to Supabase; clearing browser data or switching devices loses all calendar events.
6. **Family `events` / `schedule` / `notes` stored as JSONB arrays** — These arrays will grow without bound; no pagination or pruning is implemented.
7. **`learn_ai_messages` has no limit/pruning** — History grows indefinitely. The UI loads only the last 20 messages, but the database accumulates all records.
8. **No optimistic rollback** — If a Supabase write fails after an optimistic UI update (tasks, finance), the UI state is out of sync until reload.
9. **Single Gemini model / no fallback** — If `gemini-2.5-flash` is unavailable or rate-limited, the AI feature fails with no alternate model.

### Performance

10. **Large PDF dependencies** — `pdfjs-dist` and `react-pdf` are code-split but still large (~2-3MB); initial load for Documents page may be slow on slow connections.
11. **No image/avatar CDN** — No user avatars; family child avatars are CSS-only. Fine for now but limits future extensibility.

### Deployment / Ops

12. **`GEMINI_API_KEY` must be set manually** — The Cloudflare Worker will return `500 {"error":"GEMINI_API_KEY is not configured"}` until `npx wrangler secret put GEMINI_API_KEY` is run inside `dailyflow-ai-worker/`. This step is not automated in CI/CD.
13. **No logging / observability** — No Sentry, no Cloudflare Worker analytics beyond default CF dashboard, no structured logging for AI requests.
14. **`dailyflow-ai-worker` has no git repository** — The Worker source is not version-controlled; there is no CI/CD for it.

---

## 8. Suggested Next Steps

### High Priority

| # | Task | Effort |
|---|------|--------|
| 1 | **Move calendar events to Supabase** — Add a `calendar_events` table; keep localStorage as offline cache only | M |
| 2 | **Add RLS policies explicitly** — Verify and document Row-Level Security for all 5 tables | S |
| 3 | **Rate-limit the AI Worker** — Use Cloudflare Rate Limiting or a KV-based counter per IP/user | S |
| 4 | **Add `GEMINI_API_KEY` to CI/CD** — Automate Worker deployment + secret rotation via Wrangler in GitHub Actions | S |
| 5 | **Git-initialize `dailyflow-ai-worker`** — Add to the monorepo or a separate repo; add a deploy workflow | S |

### Medium Priority

| # | Task | Effort |
|---|------|--------|
| 6 | **Implement Music page** — Define scope: local playlist, Spotify embed, or custom player | L |
| 7 | **Full Settings page** — Password change, language preference, notification opt-in | M |
| 8 | **Prune `learn_ai_messages`** — Add a DB trigger or scheduled function to keep only last N messages per user+mode | S |
| 9 | **Optimistic rollback** — Wrap Supabase writes in try/catch that reverses the optimistic state update on failure | M |
| 10 | **Mobile-optimize Finance and Family pages** — Charts and schedule grids need responsive redesign | M |

### Lower Priority / Quality of Life

| # | Task | Effort |
|---|------|--------|
| 11 | **Add Sentry** (or Cloudflare Worker error tracking) — Structured error reporting for production issues | S |
| 12 | **Expand test coverage** — At minimum, test service layer (tasksService, financeService) with Vitest | M |
| 13 | **Document Supabase schema** — Add migration files to `supabase/migrations/` and commit them | S |
| 14 | **Links page enhancements** — Tagging, search, import from browser bookmarks | M |
| 15 | **AI system prompt per mode** — Pass a mode-specific system prompt (FIAE algorithms, WISO, planner) to Gemini for better relevance | S |

### Legend
- **S** = Small (< 1 day), **M** = Medium (1–3 days), **L** = Large (> 3 days)

---

*End of report.*
