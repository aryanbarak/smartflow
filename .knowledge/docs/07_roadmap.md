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
- Workspace Interaction Tracking V1
- Interaction Feedback Engine V1
- Decision Intelligence V1
- Workspace Personalization V1
- Priority Engine V1
- Goal Engine V1
- Planner Engine V1
- Approval Model V1
- Approval Interaction Boundary V1
- Tool Registry V1
- Tool Resolver V1
- Execution Policy V1
- Execution Engine V1
- Execution Audit V1
- Read-only Runtime Boundary V1
- Write Runtime Boundary V1
- Reflection Engine V1
- Reflection Integration V1
- Reflection UI V1
- LLM Reasoning Layer V1
- multilingual Reasoning UX correction
- Response Composer V1
- Context Synthesis V1
- first safe read-only learning loop
- first approved write vertical slice: `tasks.complete`

Current deterministic workspace pipeline:

```text
useWorkspace()
-> signalEngine()
-> memoryEngine()
-> interactionFeedbackEngine()
-> decisionIntelligenceEngine()
-> personalizationEngine()
-> priorityEngine()
-> goalEngine()
-> plannerEngine()
-> approvalEngine()
-> workspaceEngine()
-> Dashboard
```

Current agent reasoning and execution pipeline:

```text
User Message
-> AI Response Language Resolution
-> LLM Reasoning Layer
-> Structured Intent Proposal
-> Deterministic Intent Validator
-> Tool Resolver
-> Approval Model / Approval Interaction
-> explicit user action
-> Read-only Runtime or Write Runtime
-> Execution Policy
-> Execution Engine / explicit handler
-> Execution Audit
-> Reflection Engine
-> Reflection Integration
-> safe Memory Evidence
-> Context Synthesis
-> Response Composer
-> Chat UI
```

## Current Phase

SmartFlow is no longer only a productivity dashboard. It is now an AI Personal
Operating System with a deterministic workspace architecture, proposal-only LLM
reasoning, explicit approval and execution boundaries, reflection, and
deterministic response composition.

Current focus: Agent Response UX Validation V1.

## Current Validation Status

Latest confirmed automated validation:

- Agent tests: 235 passed
- Workspace tests: 73 passed
- ChatPage tests: 5 passed
- TypeScript: passed
- Production build: passed

Existing non-failing build warnings:

- large chunk warning
- empty `vendor-pdfjs` chunk warning

Live browser validation completed:

- TasksPage answers correctly in Persian, German, and English.
- Flow AI correctly resolves baseline task requests in Persian, German, and
  English.
- Calendar distinction remains correct.
- Explicit execution remains required.
- No false English-only capability response remains.

## Next Milestone

Agent Response UX Validation V1

Goal: validate that final user-facing responses provide concise meaning without
exposing internal policy, audit, prompt, memory, engine, request, or raw payload
details. The response path must preserve runtime facts, resolved response
language, explicit execution boundaries, and contradiction suppression.

## Future Milestones

Not implemented:

- manual multi-step plan execution
- conversation memory
- semantic memory
- vector/RAG memory
- additional approved write tools
- calendar write
- task creation
- document/email agent capabilities
- autonomous execution
- live AI-generated recommendations
- real multi-session conversation memory

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
- Additional write tools must wait for separate safety review beyond
  `tasks.complete`.
