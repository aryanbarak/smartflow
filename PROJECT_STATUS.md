# dailyFlow — PROJECT STATUS
# Last updated: 2026-06-04
# Keep this file under 2 pages — update after every session

---

## Current Branch

- **Branch:** `cleanup/audit-2026-05-30`
- **Last commit:** 4c7cbf2 - fix: move ToolCard to module scope — stops TextEditorTool from remounting
- **Last deployment:** 2026-06-04 - Cloudflare Pages (auto)

---

## Recent Decisions
| Date | Decision | Reason |
|------|----------|--------|
| 2026-05-30 | Audit-first before new features | Found 19 unused files, 1,625 lines of dead code |
| 2026-05-30 | Drop user_api_keys table + feature | Hook had zero importers; feature never built |
| 2026-05-30 | OLLAMA_VULKAN=1 for Intel Arc 140V | CPU was 13 t/s, GPU 14.5 t/s |
| 2026-05-30 | OLLAMA_MODELS=E:\ollamaModels | F: drive didn't exist |
| 2026-05-30 | Skip Continue.dev for now | Crash with Ollama on Windows/Intel Arc |
| 2026-05-30 | Use kb-load + Claude.ai as primary workflow | Most reliable, largest context window |
| 2026-05-28 | English-only for all docs/prompts | Better AI embedding quality |
| 2026-05-28 | config.yaml over config.json | Continue.dev v1.2+ dropped config.json |

---

## Known Bugs
| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 1 | learn_ai_messages grows unbounded | Low | Open |
| 2 | Family JSONB arrays grow unbounded | Low | Open |
| 3 | No optimistic rollback on write failure | Medium | Open |
| 4 | Single Gemini model — no fallback | Medium | Partial (Ollama ready) |
| 5 | No rate limiting on /analyze endpoint | Medium | Open |
| 6 | Short signed URL lifetime for documents | Low | Open |
| 7 | No error tracking (Sentry) | Low | Open |
| 8 | dailyflow-ai-worker: no git, no CI/CD | Low | Open |
| 9 | Supabase types not regenerated for new tables | Low | Open |

---

## Next Priorities
1. **Rate limiting on AI Worker** — Cloudflare KV counter (Bug #5)
2. **Gemini → Ollama fallback** in Worker (Bug #4)
3. **Supabase types regeneration** — remove `as any` casts (Bug #9)
4. **Phase 3** — AI Gateway + provider routing
5. **Fix Continue.dev** — debug Ollama crash on Windows/Intel Arc

---

## Blocked Tasks
| Task | Blocked by | Notes |
|------|-----------|-------|
| Continue.dev local AI | Ollama crash on Windows/Intel Arc | Use Claude.ai instead for now |
| Optimistic rollback | Needs planning | Affects all mutation hooks |
| Supabase types | Need to run `supabase gen types` | Then fix all `as any` |

---

## Local AI Status
| Model | Size | Location | GPU | Speed |
|-------|------|----------|-----|-------|
| qwen2.5-coder:7b | 4.7 GB | E:\ollamaModels | ✅ Vulkan | ~14 t/s |
| qwen2.5-coder:14b | 9.0 GB | E:\ollamaModels | ✅ Vulkan | ~8 t/s |
| llama3.1:8b | 4.9 GB | E:\ollamaModels | ✅ Vulkan | ~12 t/s |
| nomic-embed-text | 0.3 GB | E:\ollamaModels | ✅ Vulkan | embeddings only |

---

## Completed This Week (2026-05-28 to 2026-06-01)

- ✅ All High Impact features (Habit Tracker, Budget Goals, Push Notifications, Global Search)
- ✅ All Medium Impact features (Journal, Recurring, CSV, Pomodoro+Task, Links)
- ✅ All Nice-to-Have features (Mood Tracker, Flashcards, Shopping List)
- ✅ Settings page (full — 5 tabs)
- ✅ i18n (en/de/fa — English default, RTL for Farsi)
- ✅ Phase 1: Ollama + GPU setup (OLLAMA_VULKAN=1, 4 models, E:\ollamaModels)
- ✅ Phase 2: Knowledge Base (ChromaDB + nomic-embed-text, 32 vectors)
- ✅ Prompt Library (.prompts/ — 24 files, 7 categories)
- ✅ Project Audit & Cleanup (19 files removed, 1,625 lines deleted)
- ✅ Document Intelligence — PDF Merge (pdf-lib, client-side, drag-to-reorder)
- ✅ AI Summary — PDF text extraction + Gemini summary + key points (cached in DB)
- ✅ DeepL Translation — integrated in Cloudflare Worker (de/en/fa, 1M free chars/month)
- ✅ Text Translator — standalone component replacing document-tied translation
- ✅ Filename fix — removed timestamp prefix from uploaded document names

---

## AI Workflow (Current)
```
Morning:
  kb-load                     → generate context_output.md
  paste into Claude.ai        → AI Technical Architect ready

During development:
  Claude Code (VSCode/terminal) → implement features, build, push
  Claude.ai + context           → planning + architecture review

After significant changes:
  update .knowledge/docs/       → roadmap, lessons learned
  python .knowledge/build_kb.py → rebuild knowledge base vectors
  update PROJECT_STATUS.md      → keep status current
```
