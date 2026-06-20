# dailyFlow — PROJECT STATUS

Keep this file under 2 pages; update after every session.

---

## Recent Decisions

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-06-16 | Retired old `/briefing` endpoint + Weekly Life Briefing widget | Superseded by unified AgentBriefingCard with Today/This Week toggle |
| 2026-06-15 | `agent_briefings.mode` column (daily/weekly, default daily) | Mode-filtered reads keep daily and weekly briefings separate |
| 2026-06-15 | Memory writes deferred to Phase C (chat) | Briefing has no user input — wrong place to extract durable facts |
| 2026-06-15 | `user_settings.language` as source of truth for agent language | UI previously wrote only to localStorage; agent always read DB |
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

## Next / Backlog

### Chat / Agent

1. **C3b: file upload in chat** — reuse Learn AI's existing file-handling approach rather than building a parallel one
2. **Agent Tools / function calling** — web search so the agent can answer real-world/real-time questions (sports schedules, weather, news); deferred — agent currently has Gemini knowledge but no internet access
3. **Decide later**: merge Learn AI into the agent as a mode vs keep separate — still separate by deliberate decision

### Infrastructure

1. **Prune learn_ai_messages** — DB trigger or scheduled function (Bug #1; FREE-tier 500 MB risk)
2. **Azure TTS key security** — move from Plaintext → Secret in Cloudflare
3. **Supabase explicit GRANTs** — run `20260530000000_explicit_grants.sql` before 2026-10-30
4. **Multi-provider AI Gateway** — true Gemini/Claude/OpenAI routing; isolate model call in single function now so the swap is easy later

### Polish / Known gaps

1. **i18n audit** — many UI strings hardcoded English when language is `fa` or `de`; full RTL polish for Farsi
2. **a11y** — `DialogContent` missing `DialogTitle` / `aria-describedby` console warnings
3. **Ergänzungsprüfung** — add OOP, DB, Network, Software-Eng question sets

### Future (only when memory grows large)

- RAG / semantic retrieval with `pgvector` + embeddings for `user_context`
- Long-conversation summarisation/compaction

---

## Blocked Tasks

| Task | Blocked by | Notes |
| --- | --- | --- |
| Persian TTS (fa-AF) | Azure key + region must be set in Cloudflare | AZURE_TTS_KEY ✅, AZURE_TTS_REGION ✅ |
| Continue.dev local AI | Ollama crash on Windows/Intel Arc | Use Claude.ai instead |

---

## Completed This Session (2026-06-20) — Flow AI Page Redesign

### Flow AI Page — Phase 1 ✅

- ✅ **Two-column layout**: center column (hero + quick actions + conversation) + right sidebar (280px, sticky) reusing existing Dashboard widgets (TodaysFocusWidget, AiInsightsWidget, SmartAcademyWidget — no duplicated code)
- ✅ **Hero card**: greeting with user name (from useProfile), animated AI orb, 2 live stats (conversation count from messages, task count from useTasks) with icon-tiles
- ✅ **Quick Actions grid**: 6 action cards (Study / Plan / Habits / Finance / Weekly / Career) with distinct colored icon-tiles; clicking sends the prompt directly via existing handleSend — no navigation, instant conversation start
- ✅ **Conversation card**: glass-card styled, max-h scroll, assistant messages now have Bot avatar icon, glass-card bubble styling; user messages rounded with accent color
- ✅ **Input area**: gradient Send button, inside the conversation card below messages
- ✅ **All existing functionality preserved**: message history, Supabase persistence, auto-send from location.state.initialPrompt, keyboard handling
- ✅ **i18n**: 18 new keys added (en/de/fa) for greeting, hero description, stats, quick action labels/descriptions, conversation title
- ✅ **Responsive**: mobile stacks center + sidebar vertically; sidebar widgets below main content on mobile

### Flow AI Page — Deferred (Phase 2+)

- AI Suggestions section (requires real AI-powered recommendations — no fake data added)
- Recent Documents widget (no existing hook/service — needs new backend query)
- Conversation action buttons (Copy/Regenerate/Like/Dislike — needs backend support)
- File upload / voice / code buttons in input (C3b still in backlog)
- Animated orb with particles (cosmetic polish, not functional)
- "New Chat" button (would need conversation threading — architecture change)

---

## Completed This Session (2026-06-17/19) — Dashboard Redesign

Branch: `redesign/ui-cleanup`

### UI Cleanup ✅

- ✅ Removed Links page, Flashcards page (routes, sidebar, services, i18n)
- ✅ Removed Tutor from sidebar (route/page kept — linked from Smart Academy)
- ✅ Renamed Tutor App → Smart Academy, Agent Chat → Flow AI (sidebar, mobile nav, i18n all 3 languages)
- ✅ Merged standalone TTS into Documents Audio tab (replaced broken ElevenLabs `AudioGeneratorTool` with working Azure `TtsTool`); deleted `TTSPage.tsx`, `AudioGeneratorTool.tsx`, `/tts` route, nav entries
- ✅ Relocated Learn AI into Smart Academy's breadcrumb row (removed from sidebar/mobile nav; `/learn-ai` route kept)
- ✅ Sidebar reordered: Dashboard → Flow AI → Smart Academy → Tasks → Calendar → Habits → Journal → Finance → Family → Documents → Photos → Music → Settings (mobile bottom bar updated to match)

### Design System Improvements ✅

- ✅ **`.glass-card` made theme-aware** — was hardcoded `background: #0F1621` and cyan border; now uses `hsl(var(--glass-bg))` background + `hsl(var(--primary) / 0.12)` border; works in both dark and light modes
- ✅ **New utilities** (`@layer components`): `.gradient-primary-text` (gradient text clip), `.surface-elevated` (gradient card + deeper shadow), `.icon-tile` (rounded tinted icon background, `bg-primary/10` default, overridable)
- ✅ **New tokens** (`:root` + `.dark`): `--glass-bg`, `--gradient-accent`, `--shadow-elevated`; `shadow-elevated` added to Tailwind config
- ✅ **`--gradient-primary`** now starts with `hsl(var(--primary))` — accent color changes flow through to card-accent strip and gradient text
- ✅ `AgentBriefingCard.css` intentionally untouched (dark-mode-only hardcoded colors, to migrate later)

### Dashboard Redesign ✅

- ✅ **Two-column responsive layout**: left column = 3 equal stat cards (grid-cols-3) + Daily Briefing + Today/Tasks/Finance widgets; right narrow sidebar (~280px) = Flow AI card (top-aligned with stats), Quick Actions, Focus Playlist. Mobile reflows to single column (briefing first via `contents` + `order-*`)
- ✅ **Extracted inline widgets** to `src/components/dashboard/`: `TodayWidget` (`useEvents`), `TasksWidget` (`useTasks`), `FinanceWidget` (`useFinance`) — each self-contained with own hook calls, loading/error/empty states, icon-tile headers, compact spacing
- ✅ **Stat cards**: accent icon-tiles + real Recharts `AreaChart` sparklines (same pattern as MoodWidget): Net this month = daily running net, Events today = 7-day events/day; Open tasks shows real "X created this week" secondary stat (no fake sparkline — `completed_at` column doesn't exist)
- ✅ **Flow AI card**: orb illustration (`src/assets/dashboard-briefing-192.png`, ~16KB) + "How can I help you today?" heading + 4 suggested-prompt buttons (Daily planning / Job search help / Study with me / Analyze my habits) + gradient CTA. Prompts pass `initialPrompt` via router location state
- ✅ **ChatPage auto-send**: `handleSend` refactored to accept optional `overrideText` argument; on mount after history loads, reads `location.state?.initialPrompt`, auto-sends once (guarded by ref), clears location state to prevent re-send on back navigation
- ✅ **Quick Actions wired**: New Task → `/tasks`, Journal (renamed from "New Note", BookOpen icon) → `/journal`, Add Habit → opens reusable `AddHabitModal` inline, Record Expense → `/finance`. Square aspect-ratio buttons with colorful icon-tiles (violet/blue/orange/emerald) — deliberate exception to accent-only rule, only these 4
- ✅ **Focus Playlist widget**: wired to global music system (`useMusicPlayer()` + `loadHistory()[0]` from localStorage); shows current/last-played track with YouTube thumbnail + play/pause toggle; empty state links to `/music`. No fake timestamps
- ✅ Removed greeting header (getGreeting + firstName + date subtitle)
- ✅ Added `glass-card` to both briefing wrappers (mobile + desktop) with `p-2` inset for better visual presence

### Dashboard — Backlog / Still Open

- AgentBriefingCard header toggle (Today / This Week) cramps on narrow mobile — needs `flex-wrap` inside `AgentBriefingCard.css` (deferred to avoid touching that component)
- `AgentBriefingCard.css` still outside design-system tokens (dark-mode-only hardcoded colors) — migrate later
- Other pages still need the same visual redesign (Dashboard is now the reference template)
- `dashboard-calendar.png` (~1.5MB) in `src/assets/`, unused + unoptimized — for a future page

---

## Completed This Session (2026-06-16)

### AI Personal Agent — Phase C: Chat + Automatic Memory ✅

- ✅ **C1: `agent_chat_messages` table** — columns `(id, user_id, role, content, created_at)`; RLS policies for select/insert/delete own rows; AFTER INSERT trigger `prune_agent_chat_messages` keeps only the most recent 100 messages per user (mirrors the `learn_ai_messages` TTL pattern); migration `20260616000000_agent_chat_messages_cap.sql`
- ✅ **C2: chat core in agent worker** — exported `supabaseGet`; added `supabasePost` and `fetchUserLanguage` in `context-builder.ts`; added `callGeminiChat` (multi-turn Gemini, maps `assistant→model` role, `system_instruction`, `thinkingBudget: 0`); added `handleChat` orchestrator (auth → language + memory in parallel → last 20 messages history desc+reverse → chat system prompt → Gemini → persist both turns atomically); routed `POST /chat` by pathname; briefing path untouched
- ✅ **C3a: Chat page frontend** — new `/chat` route + sidebar + mobile nav entry + i18n keys (en/de/fa); loads full prior history from `agent_chat_messages` (RLS-protected) on mount, persists across refresh; reuses `VITE_AGENT_WORKER_URL`, Supabase session, and existing i18n; per-message bidi via `dir="auto"` so RTL/LTR is detected per message content independent of system language; assistant bubbles render markdown via `react-markdown` (same approach as `AgentBriefingCard`); text-only (file upload deferred to C3b)
- ✅ **C4: automatic memory-writing in chat** — added `preferred_name` to `EXTRACTABLE_KEYS`; new `buildChatExtractionPrompt(userMessage, existingMemory)` extracts durable facts the user states about themselves (not from the assistant reply) using same selective/eager logic as briefing extractor; `extractAndSaveMemoryFromChat` runs in background via `ctx.waitUntil` after the reply is returned (user gets `{ reply }` immediately); upserts to `user_context` with `source='agent'`, `on_conflict=user_id,key`; `ENABLE_AUTO_MEMORY_WRITE = true`; briefing extraction path uses same flag, untouched
- ✅ **DB constraint fix** — `user_context_source_check` updated in production to allow `'agent'`; documented in migration `20260616120000_user_context_allow_agent_source.sql`

---

## Completed This Session (2026-06-15/16)

### AI Personal Agent — Phase A: Memory-aware briefings ✅

- ✅ Worker reads all `user_context` entries (sources: manual / auto / agent / ai) and injects them into the Gemini prompt before finance/calendar data; manual entries flagged highest priority
- ✅ Habit data added to briefing context
- ✅ Fixed `maxOutputTokens` truncation — Gemini 2.5 Flash thinking tokens count against the budget; fix: `thinkingConfig: { thinkingBudget: 0 }` + `maxOutputTokens: 1024`; briefings now finish with `finishReason: STOP`
- ✅ Auto memory-write scaffolded (`extractAndSaveMemory`) but disabled behind `ENABLE_AUTO_MEMORY_WRITE = false` — briefing flow has no user input, so it's the wrong place to extract durable facts (deferred to Phase C chat)

### AI Personal Agent — Phase B: Advisory prompt + language + daily/weekly ✅

- ✅ **Advisory prompt**: rewrote all three system prompts (en/de/fa) from descriptive to advisory — warm personal opener + 1–2 sentence connective analysis + 2–3 `•` bullet recommendations tied to user's real goals from memory
- ✅ **Markdown rendering**: `AgentBriefingCard` now uses `react-markdown`; `•` bullets pre-processed to `"-"` for proper `<li>` rendering; language badge footer removed
- ✅ **Output language**: briefing written in user's `user_settings.language` (en/de/fa); language instruction at start AND end of user prompt; explicit mandate at top of each system prompt
- ✅ **Language persistence fix**: root cause — UI only wrote language to localStorage, never to DB; fixed: `SettingsPage` upserts `{ user_id, language }` to `user_settings` on change; `LanguageProvider` loads from DB on mount + `SIGNED_IN` event; UI and agent now share one source of truth
- ✅ **Daily/Weekly merge**: added `mode` column to `agent_briefings` (migration `20260615000000`); `/generate` accepts `mode=daily|weekly`; weekly mode fetches tasks, habits, journal + uses week-scope Gemini prompts with 1500 token budget; journal context (last 7 days, mood + notes) added for both modes
- ✅ **Today / This Week toggle**: `AgentBriefingCard` has a two-button pill toggle; switches fetch query (filtered by mode) and the `/generate` call; each mode's briefings stay separate
- ✅ **Retired old Weekly Life Briefing**: removed `handleBriefing` from `dailyflow-ai-worker` + its route in `wrangler.toml` (redeployed); deleted `briefingService.ts`, `useBriefing.ts`, `BriefingPage.tsx`; removed Dashboard widget, `/briefing` route, sidebar entry, and all `briefing_*` + `nav_briefing` i18n keys (en/de/fa); one unified system remains

### AI Personal Agent — Worker security ✅

- ✅ `/generate` requires a valid Supabase JWT (`Authorization: Bearer`), verified via `/auth/v1/user`; `user_id` derived from the token (removed the query-param `user_id` attack surface)
- ✅ Cron scheduled handler continues to run server-side with `service_role` key — no JWT needed
- ✅ Verified with negative tests (401 without token, 401 with manipulated `user_id`) and positive test from the live app

> ⚠️ **Reminder:** `VITE_*` env vars are baked at Vite build time. Must be set in **both** local `.env` **and** Cloudflare Pages → Settings → Environment variables (Production + Preview).

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
