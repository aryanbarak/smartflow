# smartFlow - Roadmap

## Completed Features

- Authentication (Supabase email + password)
- Dashboard / Living Workspace
- Tasks (CRUD + recurrence + overdue filter)
- Calendar (Supabase + localStorage fallback + recurrence)
- Finance (CRUD + CSV export/import + charts + PDF export)
- Family Hub (members + shopping list tab)
- Documents (PDF upload + Supabase Storage + signed URLs)
- Learn with AI (Gemini + 4 modes + 3 languages + chat history)
- Photos (masonry grid + lightbox + tags + AI tagging)
- Music (YouTube + local files + Pomodoro + task link + playlists)
- PWA (installable + service worker + offline badge)
- Habit Tracker (streak + progress bar + notifications)
- Daily Journal (mood + auto-save + calendar navigation)
- Flashcards (SM-2 spaced repetition - Again/Hard/Good/Easy)
- Mood Tracker (dashboard widget + 14-day recharts chart)
- Global Search (Ctrl+K - tasks + events + links + journal)
- Shopping List (FamilyPage tab, grouped by category)
- Recurring Tasks & Events
- Settings page
- i18n (en/de/fa - English default, RTL for Farsi)
- Local AI Setup (Ollama + GPU via OLLAMA_VULKAN=1 + models on E:\ollamaModels)
- Prompt Library (.prompts/)
- Knowledge Base (ChromaDB + nomic-embed-text, kb-build/load/query shortcuts)
- Project Audit & Cleanup
- Document Intelligence - PDF Merge
- AI Summary - PDF text extraction + Gemini summary
- Text Translator - DeepL API via Cloudflare Worker
- Auto text extraction on document upload

## Completed Living Workspace Milestone

- Living Workspace Foundation
- Welcome Workspace
- Workspace Engine V1
- Signal Engine V1
- Priority Engine V1
- Workspace Personalization V1
- Memory Engine V1
- Flow AI Right Rail
- Sidebar Orb Identity
- Continue Learning / Learning Memory UI
- Smart Academy ecosystem navigation
- Responsive/mobile layout improvements
- Right rail nested scroll removal

Current workspace pipeline:

```text
useWorkspace()
-> signalEngine()
-> memoryEngine()
-> personalizationEngine()
-> priorityEngine()
-> workspaceEngine()
-> Dashboard
```

## Next Sprint

Workspace Interaction Tracking V1

Goal: capture real user interactions and feed genuine behavioral evidence into
Memory Engine V1.

Target interaction events:

- suggested action clicks
- AI skill opens
- continue learning clicks
- dismiss events only when genuinely available
- completion events only when genuinely available

This sprint should remain deterministic and privacy-safe. It must not introduce
LLM reasoning, fake interaction events, or backend memory unless explicitly
scoped later.

## Planned / Not Implemented

- semantic memory
- vector database
- RAG
- LLM reasoning layer
- cross-device memory sync
- planner
- action execution
- autonomous Flow AI
- live AI-generated recommendations
- real multi-session conversation memory

## In Progress / Blocked

- Continue.dev integration remains blocked by Ollama crashes on Windows/Intel Arc; current workflow uses Claude.ai or ChatGPT with `kb-load`.

## Technical Debt / Known Gaps

- learn_ai_messages grows unbounded and still needs pruning.
- Family JSONB arrays can grow unbounded.
- Error tracking is not centralized.
- Supabase generated types should be regenerated after schema changes.
- Some older UI strings still need i18n/RTL polish.
- Some right-rail learning/recommendation content is static until live data or AI layers replace it.
