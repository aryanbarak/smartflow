# dailyFlow — PROJECT STATUS

Last updated: 2026-06-14 — Keep this file under 2 pages, update after every session.

---

## Current Branch

- **Branch:** `main`
- **Last commit:** 0e72d96 - feat(agent): add Daily Briefing card (Phase 1 AI agent) to Dashboard
- **Last deployment:** 2026-06-14 - Cloudflare Pages (auto)

---

## Recent Decisions

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-06-12 | Azure Neural TTS via Cloudflare Worker (not direct) | CORS + key security; Supabase JWT auth gates cost |
| 2026-06-12 | Text chunking 1500 chars (Azure) / 180 chars (Web Speech) | Web Speech API cuts off beyond ~200 chars |
| 2026-06-12 | Persian locale fa-AF (Dari) not fa-IR | User preference; flag 🇦🇫 |
| 2026-06-04 | TextEditorTool → forwardRef + loadFromLibrary | Props + key remount had unfixable timing race |
| 2026-06-04 | Move ToolCard to module scope | Defined inside DocumentsPage → remounted editor on every re-render |
| 2026-06-04 | StarterKit.configure({ link: false, underline: false }) | TipTap v3 includes Link+Underline in StarterKit |
| 2026-06-04 | Ctrl+S → export .docx | Browser was intercepting Ctrl+S and opening Save Page dialog |
| 2026-06-04 | Rate limit by user_id from JWT (IP fallback) | Shared NAT would block multiple users |
| 2026-05-30 | Audit-first before new features | Found 19 unused files, 1,625 lines of dead code |

---

## Known Bugs

| # | Bug | Severity | Status |
| --- | --- | --- | --- |
| 1 | learn_ai_messages grows unbounded | Low | Open |
| 2 | Family JSONB arrays grow unbounded | Low | Open |
| 3 | No optimistic rollback on write failure | Medium | **Fixed** (all 4 hooks) |
| 4 | Single Gemini model — no fallback | Medium | **Fixed** (callGeminiWithFallback) |
| 5 | Short signed URL lifetime for documents | Low | Open |
| 6 | No error tracking (Sentry) | Low | Open |
| 7 | Persian TTS requires Azure (no Web Speech fa-AF on Windows) | Medium | Azure configured |

---

## Next Priorities

1. **Prune learn_ai_messages** — DB trigger or scheduled function (Bug #1)
2. **Phase 3** — AI Gateway + provider routing
3. **Azure TTS key security** — move from Plaintext → Secret in Cloudflare
4. **Ergänzungsprüfung** — add OOP, DB, Network, Software-Eng question sets

---

## Blocked Tasks

| Task | Blocked by | Notes |
| --- | --- | --- |
| Persian TTS (fa-AF) | Azure key + region must be set in Cloudflare | AZURE_TTS_KEY ✅, AZURE_TTS_REGION ✅ |
| Continue.dev local AI | Ollama crash on Windows/Intel Arc | Use Claude.ai instead |

---

## Completed This Session (2026-06-14)

### Phase 1 AI Agent — Daily Briefing card ✅ live on production

- ✅ Cloudflare Worker (`dailyflow-agent-worker`) — Gemini 2.5 Flash, cron 06:00 UTC + on-demand POST `/generate`
- ✅ `agent_briefings` table + RLS + `language` column on `user_settings` (migration `20260613000000`)
- ✅ `AgentBriefingCard` on Dashboard: fetches latest briefing, refresh button, language badge, shimmer loading
- ✅ `context-builder.ts`: replaced raw SQL helper with direct Supabase `/rest/v1/` REST calls
- ✅ `PageTitleContext` + `useSetPageTitle` hook — Dashboard title + date aligned with sidebar logo in one header bar
- ✅ CORS: production origins (`barakzai.cloud`) + private-LAN regex (192.168.x.x, 10.x, 172.16-31.x, localhost) echoed back; no wildcard; `Vary: Origin`

**Bugs fixed this session:**

1. Wrong import path `@/lib/supabase` → `@/integrations/supabase/client`
2. CORS blocked local LAN origin `http://192.168.2.106:8080` — fixed with private-IP regex allowlist
3. `.single()` → `.maybeSingle()` to avoid 406 when `agent_briefings` table is empty for the user
4. `maxOutputTokens: 200` truncated briefing mid-sentence — raised to `1024`; added `finishReason` + full-text logging
5. `VITE_AGENT_WORKER_URL` missing from Cloudflare Pages production build — must be added to Pages → Settings → Environment variables

> ⚠️ **Note:** `VITE_*` env vars are baked at build time by Vite. Setting them only in local `.env` has no effect on the production build. They must also be added in **Cloudflare Pages → Settings → Environment variables** (Production + Preview).

---

## Completed This Session (2026-06-12/13)

### TTS — Text-to-Speech System (new feature)

- ✅ `/tts` page (`TTSPage.tsx`): language selector de🇩🇪/fa🇦🇫, textarea, rate/pitch sliders, progress bar, engine badge
- ✅ `useAzureTTS` hook: gets Supabase JWT → tries Azure → falls back to Web Speech per chunk
- ✅ Text chunking: 1500 chars/chunk Azure, 180 chars Web Speech (split at sentence boundaries)
- ✅ Nav: `Volume2` icon + `nav_tts` added to Sidebar, MobileNav, i18n (en/de/fa)
- ✅ Persian flag 🇦🇫, locale `fa-AF`, voice `fa-AF-FatimahNeural`; Persian install guide in UI

### TutorErgaenzungspruefungPage (new page)

- ✅ Full page: Überblick, Themen, Vorbereitung, Beispielfragen, 🔊 Sprachausgabe (5 tabs)
- ✅ Überblick: 6 info cards (definition, Zulassung, Dauer, Bewertung, Rechtsgrundlage, Tipp) + AP2 Prüfungsbereiche table
- ✅ Themen: 5 topic blocks (Algorithmen, OOP, DB, Netzwerke, SW-Entwicklung) with Prüfungsfallen boxes
- ✅ Vorbereitung: 6 tip cards + 10-Tage-Plan table
- ✅ Beispielfragen: 25 MEP Algorithmen Q&A from PDF + OOP, DB, Netzwerke questions — accordion + TTS per item
- ✅ MEP questions also shown as accordion at bottom of Themen tab
- ✅ `pickGermanVoice()`: priority order Katja → Conrad → Google Deutsch → Anna → any de-DE
- ✅ Voice selector dropdown in Beispielfragen toolbar
- ✅ Sprachausgabe tab: migrated to `useAzureTTS`, language selector de/fa, no char limit, progress bar
- ✅ Nav: accessible from TutorAppPage and TutorWisoPage breadcrumb

### AI Worker — Azure TTS endpoint

- ✅ `POST /tts-azure`: `handleTtsAzure()` — voices `de-DE-KatjaNeural` / `fa-AF-FatimahNeural`
- ✅ Auth: requires Supabase JWT; 503 if env vars missing; SSML with XML escaping
- ✅ Router refactored: if-chain → `ROUTES` dispatch table (fixes S3776 complexity)
- ✅ `/tts-azure` route added to `wrangler.toml`; auto-deployed via CI/CD

### Optimistic Rollback (Bug #3 fixed)

- ✅ `useTasks`: snapshot before mutate, revert + toast on failure; temp ID replaced by server ID on add
- ✅ `useFinance`: same pattern for transactions
- ✅ `useFamily`: same pattern for family members
- ✅ `useEvents`: same pattern for calendar events

### Mobile Layout Fixes

- ✅ `FinancePage`: controls split to 2 rows on mobile (Tabs+month / GroupBy); icons shrink; date label hidden
- ✅ `FamilyPage`: children list → horizontal scroll on mobile; TabsList uses `grid-cols-4` on small screens

### SonarJS Diagnostics Fixed (this session)

- ✅ S3776 Cognitive Complexity: `play()` → extracted `speakChunk()` at module level; router → ROUTES table
- ✅ S7721 Inner function: `getEngineLabel` moved to module scope
- ✅ S4325 Unnecessary assertion: `token!` → `if (token !== null)` narrowing
- ✅ S7735 Negated conditions: `!x` → `x === 0`; ternary directions flipped
- ✅ S3735 / S3358 / S7748 / S6759 / S7741 / S7764: void, nested ternary, zero fraction, readonly props, typeof window, window→globalThis

---

## Completed Previously (2026-06-10)

### AI Worker — /analyze upgrade

- ✅ File attachment support: PDF, PNG, JPEG, WebP, TXT via `fileData { base64, mimeType, name }`
- ✅ `requireAuth` added (JWT check); rate limit raised to 30/hour per user
- ✅ `callGeminiWithFallback`: gemini-2.5-flash → 2.0-flash → Workers AI llama-3.1-8b
- ✅ Cloudflare AI Gateway routing when `CF_ACCOUNT_ID` + `CF_GATEWAY_NAME` set
- ✅ CI/CD: `.github/workflows/deploy-worker.yml` — auto-deploy on push to main

### Learn AI — File attachment UI

- ✅ Paperclip button: PDF, PNG, JPEG, WebP, TXT, max 10 MB; base64 before send
- ✅ File preview badge with name, size, × remove; Ctrl+Enter to send

---

## Completed Previously (2026-06-04)

### Documents Feature

- ✅ HTML files in Library; Edit loads content via forwardRef + useImperativeHandle
- ✅ TipTap v3 duplicate extension fixed; View, Download, Upload all fixed

### Text Editor UI

- ✅ Title in toolbar; rows scrollable on mobile; full-width; Ctrl+S → .docx

### AI Worker

- ✅ Rate limiting by JWT sub (IP fallback); deployed via wrangler

### TypeScript

- ✅ All `as any` casts removed (familyService, familyHubService, errorMessages, tasksService)

---

## Local AI Status

| Model | Size | GPU | Speed |
| --- | --- | --- | --- |
| qwen2.5-coder:7b | 4.7 GB | ✅ Vulkan | ~14 t/s |
| qwen2.5-coder:14b | 9.0 GB | ✅ Vulkan | ~8 t/s |
| llama3.1:8b | 4.9 GB | ✅ Vulkan | ~12 t/s |
| nomic-embed-text | 0.3 GB | ✅ Vulkan | embeddings |

Location: E:\ollamaModels — OLLAMA_VULKAN=1
