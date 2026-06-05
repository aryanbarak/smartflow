# dailyFlow — PROJECT STATUS

Last updated: 2026-06-05 — Keep this file under 2 pages, update after every session.

---

## Current Branch

- **Branch:** `main`
- **Last commit:** f5c120f - feat: show tasks on calendar grid, AlarmPicker on events and tasks
- **Last deployment:** 2026-06-05 - Cloudflare Pages (auto)

---

## Recent Decisions

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-06-04 | TextEditorTool → forwardRef + loadFromLibrary | Props + key remount had unfixable timing race |
| 2026-06-04 | Move ToolCard to module scope | Defined inside DocumentsPage → remounted editor on every re-render |
| 2026-06-04 | StarterKit.configure({ link: false, underline: false }) | TipTap v3 includes Link+Underline in StarterKit |
| 2026-06-04 | Ctrl+S → export .docx | Browser was intercepting Ctrl+S and opening Save Page dialog |
| 2026-06-04 | Rate limit by user_id from JWT (IP fallback) | Shared NAT would block multiple users |
| 2026-05-30 | Audit-first before new features | Found 19 unused files, 1,625 lines of dead code |
| 2026-05-30 | Use kb-load + Claude.ai as primary workflow | Most reliable, largest context window |

---

## Known Bugs

| # | Bug | Severity | Status |
| --- | --- | --- | --- |
| 1 | learn_ai_messages grows unbounded | Low | Open |
| 2 | Family JSONB arrays grow unbounded | Low | Open |
| 3 | No optimistic rollback on write failure | Medium | Open |
| 4 | Single Gemini model — no fallback | Medium | Open |
| 5 | Short signed URL lifetime for documents | Low | Open |
| 6 | No error tracking (Sentry) | Low | Open |

---

## Next Priorities

1. **Gemini → Ollama fallback** in Worker (Bug #4)
2. **Optimistic rollback** — affects all mutation hooks
3. **Prune learn_ai_messages** — DB trigger or scheduled function (Bug #1)
4. **Phase 3** — AI Gateway + provider routing
5. **Mobile layout** — Finance and Family pages

---

## Blocked Tasks

| Task | Blocked by | Notes |
| --- | --- | --- |
| Continue.dev local AI | Ollama crash on Windows/Intel Arc | Use Claude.ai instead |
| Optimistic rollback | Needs architecture planning | Affects all mutation hooks |

---

## Completed This Session (2026-06-04)

### Documents Feature — Major fixes

- ✅ HTML files now appear in Library (filter was PDF-only)
- ✅ Edit button loads file content — forwardRef + useImperativeHandle + loadFromLibrary
- ✅ Root cause: ToolCard inside DocumentsPage remounted editor on every re-render
- ✅ TipTap v3 duplicate extension warning fixed (StarterKit v3 includes Link + Underline)
- ✅ View button renders HTML with proper styling in new window
- ✅ Download uses clean filename (doc.title, no timestamp suffix)
- ✅ Upload: unique filename + upsert: true on Supabase Storage

### Text Editor UI

- ✅ Title integrated into toolbar Row 1 (compact 4-row layout, no wasted space)
- ✅ Toolbar rows horizontally scrollable on mobile
- ✅ Editor uses full page width (max-w-6xl removed when editor tab active)
- ✅ Ctrl+S exports .docx (global keydown listener, latest-ref pattern)
- ✅ Warmer page background (#eeeae4), ring on paper, my-8 spacing
- ✅ Library doc actions: icon-only on mobile, text on desktop

### AI Worker

- ✅ Rate limiting: user_id from JWT sub (IP fallback) — per endpoint, 1h window
- ✅ Deployed via wrangler deploy

### TypeScript

- ✅ All as any casts removed (familyService, familyHubService, errorMessages, tasksService)

---

## Completed Previously (2026-05-28 → 2026-06-03)

- ✅ All core features (Tasks, Calendar, Finance, Family, Documents, Music, Photos, Links, AI, Habits, Journal, Flashcards, Settings)
- ✅ i18n (en/de/fa — RTL for Farsi), PWA (installable + offline badge)
- ✅ Project Audit & Cleanup (19 files, 1,625 lines deleted)
- ✅ PDF tools (Merge, Split, Compress, OCR, Image→PDF)
- ✅ DeepL Translation + ElevenLabs TTS + Photo AI tagging via Cloudflare Worker
- ✅ Rate limiting on AI Worker (KV-based, per user)
- ✅ Supabase types regenerated — all as any casts eliminated
- ✅ MASTER_CONTEXT.md created (architecture, patterns, critical rules)

---

## Local AI Status

| Model | Size | GPU | Speed |
| --- | --- | --- | --- |
| qwen2.5-coder:7b | 4.7 GB | ✅ Vulkan | ~14 t/s |
| qwen2.5-coder:14b | 9.0 GB | ✅ Vulkan | ~8 t/s |
| llama3.1:8b | 4.9 GB | ✅ Vulkan | ~12 t/s |
| nomic-embed-text | 0.3 GB | ✅ Vulkan | embeddings |

Location: E:\ollamaModels — OLLAMA_VULKAN=1
