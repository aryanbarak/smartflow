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

Current focus: production-readiness review of the proposal boundary after
completing controlled browser integration and local real-worker reasoning
validation. Production deployment itself has not been validated.

## Current Validation Status

Latest confirmed automated validation:

- Agent tests: 241 passed
- Workspace tests: 75 passed
- ChatPage tests: 14 passed
- TypeScript: passed
- Production build: passed

Existing non-failing build warnings:

- large chunk warning
- empty `vendor-pdfjs` chunk warning

Live browser validation completed before the current ARUX matrix:

- TasksPage answers correctly in Persian, German, and English.
- Flow AI correctly resolves baseline task requests in Persian, German, and
  English.
- Calendar distinction remains correct.
- Explicit execution remains required.
- No false English-only capability response remains.

Current Agent Response UX Validation V1 status:

- deterministic response and intent tests pass,
- bounded authentication smoke passes against local Supabase,
- canonical ARUX evidence exists at
  `docs/testing/evidence/agent-response-ux-validation-v1.json`,
- Controlled Authenticated Browser Integration passed all 15 rows,
- ARUX-11 verifies already-complete state as an idempotent no-op without a
  duplicate mutation,
- ARUX-13 and ARUX-15 preserve Persian RTL flow while isolated Latin content
  computes as LTR,
- ARUX-14 keeps proposal, composed answer, and runtime summary in German,
- deterministic browser stubs are not treated as proof of real LLM intent
  recognition, worker transport, or real multilingual reasoning behavior,
- the separate local real-worker reasoning matrix passed all 8 rows through
  `real-gemini` and `local-real-worker`,
- canonical real-worker evidence exists at
  `docs/testing/evidence/real-worker-arux-matrix-v1.json`,
- every accepted real-worker row used exactly one Gemini request and exercised
  local Supabase Auth, Worker transport, deterministic validation, and resolver
  output,
- the real-worker matrix granted no approval, executed no tool, persisted no
  reasoning request, and contacted no production service,
- neither matrix is production deployment validation.

## Next Milestone

Perform a production proposal-boundary readiness review without expanding tool
execution or claiming production validation.

Selection criteria:

- preserve explicit approval and execution boundaries,
- require separate safety review before additional write tools,
- keep runtime facts authoritative in final responses,
- keep browser QA mandatory for user-visible agent behavior,
- disclose proposal source and worker transport in every evidence row.
- retain fail-closed local/production configuration separation before any
  deployment validation.

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
