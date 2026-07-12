# SmartFlow - Roadmap

## Completed Product Features

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
- Habit Tracker
- Daily Journal
- Flashcards with SM-2 spaced repetition
- Mood Tracker
- Global Search
- Shopping List
- Settings
- i18n (English, German, Farsi)
- Local AI setup with Ollama
- Prompt Library
- Knowledge Base
- Document Intelligence - PDF merge and AI summary
- Text Translator via DeepL Cloudflare Worker

## Completed Living Workspace and Agent Milestones

- Living Workspace
- Welcome Workspace
- Living Hero
- Flow AI Right Rail
- Sidebar Orb Identity
- Continue Learning
- Learning Memory
- Smart Academy integration
- Smart Academy ecosystem navigation
- Responsive workspace
- Responsive/mobile layout improvements
- Nested scroll removal
- Workspace Engine V1
- Signal Engine V1
- Memory Engine V1
- Interaction Tracking V1
- Interaction Feedback Loop V1
- Workspace Personalization V1
- Priority Engine V1
- Goal Engine V1
- Planner Engine V1
- Tool Resolver V1
- Approval Model V1
- Approval Interaction Boundary V1
- Tool Registry V1
- Execution Policy V1
- Execution Engine V1 (read-only)
- Execution Audit V1

Current deterministic workspace pipeline:

```text
useWorkspace()
-> signalEngine()
-> memoryEngine()
-> interactionFeedbackEngine()
-> personalizationEngine()
-> priorityEngine()
-> goalEngine()
-> plannerEngine()
-> toolResolver()
-> approvalEngine()
-> workspaceEngine()
-> Dashboard
```

Current agent stack:

```text
Signals
-> Memory
-> Interaction Feedback
-> Personalization
-> Priority
-> Goal
-> Planner
-> Tool Resolver
-> Approval
-> Approval Interaction Boundary
-> Tool Registry
-> Execution Policy
-> Execution Engine
-> Execution Audit
```

## Current Phase

SmartFlow is no longer only a productivity dashboard. It is now an AI Personal
Operating System with a deterministic agent architecture.

Current focus: safe execution infrastructure before autonomous capabilities.

## Next Milestone

Write Tool Execution Readiness

Goal: prepare the safety design for user-approved write execution without
enabling autonomous side effects. This includes narrowing supported write
contracts, preserving exact-step approval, keeping audit mandatory, and defining
rollback/failure behavior before any write handler ships.

## Future Milestones

- Write Tool Execution
- Reflection Engine
- Semantic Memory
- Vector Memory
- RAG
- LLM Reasoning Layer
- Execution Planner
- Cross-device Memory
- Autonomous Flow AI
- Live AI-generated recommendations
- Real multi-session conversation memory

## In Progress / Blocked

- Continue.dev integration remains blocked by Ollama crashes on Windows/Intel Arc.
  Current workflow uses generated knowledge context with Claude.ai or ChatGPT.

## Technical Debt / Known Gaps

- Learn AI messages and chat-related storage still need pruning policies.
- Family JSONB arrays can grow unbounded.
- Error tracking is not centralized.
- Supabase generated types should be regenerated after schema changes.
- Some older UI strings still need i18n/RTL polish.
- Right-rail learning/recommendation content still includes static placeholders.
- Execution is read-only; write execution must wait for stronger rollback and
  failure-handling design.
