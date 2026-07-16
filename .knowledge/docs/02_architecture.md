# SmartFlow - Architecture

## Frontend Structure

```text
src/
+-- features/
|   +-- agent/
|   +-- workspace/
|   +-- tasks/
|   +-- calendar/
|   +-- finance/
|   +-- family/
|   +-- learn-ai/
|   +-- habits/
|   +-- journal/
|   +-- flashcards/
|   +-- mood/
|   +-- search/
|   +-- links/
|   +-- settings/
+-- pages/
+-- components/
|   +-- layout/
+-- hooks/
+-- lib/
+-- i18n/
+-- integrations/
    +-- supabase/
```

## Feature Module Pattern

Most product features follow this structure:

1. `src/features/<feature>/types.ts`
2. `src/features/<feature>/<feature>Service.ts`
3. `src/features/<feature>/use<Feature>.ts`
4. `src/pages/<Feature>Page.tsx`

The workspace and agent systems are engine-based feature modules because they
compose multiple domains and must keep decision logic out of page components.

## Living Workspace Architecture

The Dashboard is driven by the workspace feature architecture, not page-local
decision logic. Current deterministic pipeline:

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

Execution Audit remains outside the workspace generation pipeline. It observes
actual execution only.

Layer responsibilities:

- `useWorkspace`: collects existing frontend data and orchestrates the workspace pipeline.
- `signalEngine`: converts current user data into normalized workspace signals.
- `memoryEngine`: maintains bounded, versioned client-side continuity metadata.
- `interactionFeedbackEngine`: turns tracked workspace interactions into weak feedback evidence.
- `decisionIntelligenceEngine`: derives a deterministic domain-level decision profile from validated reflection evidence and bounded interaction feedback.
- `personalizationEngine`: applies weak preference evidence from recent and repeated activity.
- `priorityEngine`: selects primary and secondary workspace priorities while protecting urgent signals.
- `goalEngine`: converts priorities into a daily goal model.
- `plannerEngine`: proposes deterministic, non-executing workspace plan steps.
- `approvalEngine`: annotates planned steps with approval requirements and safety state.
- `workspaceEngine`: composes the final typed Workspace model consumed by Dashboard.

Workspace memory:

- localStorage key: `smartflow.workspace.memory.v1`
- Memory Engine V1 is client-local, deterministic, and non-semantic.
- No semantic memory, vector database, RAG, or backend memory is active yet.
- Urgent current signals always outrank personalization and memory.
- Low-data onboarding remains protected.

Decision Intelligence V1:

- deterministic,
- input-only,
- read-only,
- uses validated reflection evidence and bounded interaction feedback,
- produces domain-level decision profile only,
- weakly influences medium/low ordering,
- never overrides urgent signals or onboarding,
- does not mutate memory,
- does not execute or initiate autonomous behavior.

## Current Agent Architecture

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

Completed workspace and agent systems:

- Workspace Engine V1
- Signal Engine V1
- Memory Engine V1
- Workspace Interaction Tracking V1
- Interaction Feedback Engine V1
- Decision Intelligence V1
- Personalization Engine V1
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
- multilingual reasoning-domain correction
- Response Composer V1
- Context Synthesis V1

## LLM Reasoning Layer V1

The LLM Reasoning Layer is proposal-only. It proposes a structured intent, then
a deterministic validator decides whether the request can continue.

Supported intents:

- `inspect_tasks`
- `inspect_calendar`
- `inspect_learning`
- `inspect_workspace`
- `complete_task`
- `ask_clarification`
- `unsupported`

Intent mappings:

- `inspect_tasks` -> `tasks.list`
- `inspect_calendar` -> `calendar.list_today`
- `inspect_learning` -> `learning.get_progress`
- `inspect_workspace` -> `workspace.get_context`
- `complete_task` -> `tasks.complete`

Security boundary:

- LLM proposes only.
- Deterministic validation always runs.
- LLM cannot execute.
- LLM cannot approve.
- LLM cannot supply authenticated user ID.
- LLM cannot invent arbitrary executable tools.
- Unsupported and mixed requests fail closed.
- Ambiguous task targets require clarification.
- Read and write actions still require explicit user interaction.

Multilingual domain correction:

- task markers override generic `today` / `heute` / `امروز` markers,
- strong task, calendar, learning, and workspace evidence is bounded,
- conflicting strong evidence still asks clarification,
- this is not a general semantic classifier.

## Tool Resolver V1

Tool Resolver V1 is deterministic and conservative. It maps a proposed
`WorkspacePlanStep` to one explicitly registered `AgentToolDefinition` only when
the mapping is safe.

Supported mappings:

- task review/open/inspect -> `tasks.list`
- calendar review/open/plan -> `calendar.list_today`
- learning review/open/continue -> `learning.get_progress`
- workspace review/reflect/inspect/open -> `workspace.get_context`
- exact task completion -> `tasks.complete`

It does not execute tools, import handlers, call backend services, call
Supabase, use network APIs, or perform autonomous matching. It fails closed for
disabled tools, unsupported external effects, ambiguous candidates, domain
mismatch, capability mismatch, unsupported actions, and unsafe write requests.

Tool Resolver V1 does not authorize execution. Execution Policy still
independently verifies the step/tool mapping, enabled state, approval step ID,
approval tool ID, scope, and risk before Execution Engine can invoke a handler.

## Approval Interaction Boundary V1

Approval Interaction Boundary V1 is the first trusted human approval surface.

It provides:

- exact-step approval and rejection,
- deterministic close/cancel behavior without synthesizing approval,
- scope and risk checks before creating an approval object,
- immutable approval decisions,
- no tool execution,
- no handler imports,
- no backend calls,
- no Supabase calls,
- no network calls,
- no autonomous behavior.

Approvals bind to a specific `WorkspacePlanStep.id` and, when a tool has been
resolved, the exact resolved tool ID. They cannot approve a different step,
substitute a different tool, escalate from `single_step` to broader scopes,
lower the declared risk level, or attach arbitrary planner metadata. Approval is
only intent capture; execution still requires the Tool Registry, Execution
Policy, Execution Engine, and Execution Audit path.

## Runtime and Execution V1

Execution Engine V1 is intentionally narrow. It supports explicit handlers only
and must be reached through runtime, policy, and audit boundaries.

It provides:

- explicit handler registry,
- policy-enforced execution,
- typed execution results,
- deterministic failure handling,
- execution audit recording,
- no network execution,
- no autonomous behavior.

Supported read-only handlers:

- `tasks.list`
- `calendar.list_today`
- `learning.get_progress`
- `workspace.get_context`

Supported write handlers:

- `tasks.complete` only

`tasks.complete` guarantees:

- exact step, tool, and target approval binding is required,
- approval and execution are separate user actions,
- authenticated user identity is injected by the runtime,
- task completion is state-idempotent,
- post-write verification is required,
- no automatic retry,
- no chained execution,
- no autonomous execution,
- no other write tool is enabled.

Handlers are framework-independent. They must not import React hooks, UI code,
Supabase clients into UI surfaces, route components, or LLM logic.

## Tool Registry

Tool Registry V1 contains contracts only:

- tool IDs,
- domains,
- capabilities,
- input schemas,
- risk levels,
- approval requirements,
- execution support metadata.

It does not contain handlers, API calls, secrets, backend calls, Supabase calls,
or execution logic.

## Response Language, Context Synthesis, and Response Composer

SmartFlow separates interface language from AI response language.

Supported AI response language values:

- `auto`
- `en`
- `de`
- `fa`

Resolution rules:

- fixed response language wins,
- `auto` follows the latest user message,
- unclear detection falls back safely,
- response RTL/LTR applies to AI response content only,
- interface direction remains independent.

TasksPage AI and Flow AI Chat have been browser-validated in English, German,
and Persian.

Context Synthesis V1 runs after verified execution and reflection:

```text
Verified Runtime Result
+ bounded Workspace snapshot
+ safe Reflection summary
+ bounded Decision profile
-> Context Synthesis
-> Response Composer
-> Chat UI
```

Supported synthesis domains:

- tasks
- calendar
- learning
- workspace

`tasks.complete` receives only verified safe response facts and currently no
broad cross-context synthesis.

Safeguards:

- runtime result is authoritative,
- contradictions suppress synthesis rather than guessing,
- supporting facts are bounded,
- suggestions are optional and non-executing,
- no personality, emotional, mastery, motivation, importance, or future-action
  inference,
- Decision Intelligence may only produce neutral continuity wording under
  sufficient evidence,
- no raw memory, audit, policy, prompt, private note, document body, user ID, or
  Supabase structure is consumed or exposed.

Response Composer V1 is deterministic. It creates a headline, summary, bounded
details, and optional safe suggestion for the five current tools. It does not
call another LLM, does not inspect raw handler payloads, does not alter runtime
results, does not expose policy, audit, request IDs, raw JSON, or internal
metadata, and preserves resolved response language.

## AI Architecture

```text
User -> React App -> Cloudflare Worker -> Gemini 2.5 Flash (primary)
                                     -> Ollama Local fallback
```

LLM reasoning is active only as a proposal layer. Deterministic validation,
approval, runtime policy, execution audit, reflection, context synthesis, and
response composition remain authoritative boundaries.

## All Routes

`/auth`, `/`, `/tasks`, `/calendar`, `/finance`, `/family`, `/family-hub`,
`/documents`, `/learn-ai`, `/tutor`, `/tutor/app`, `/tutor/wiso`, `/photos`,
`/music`, `/habits`, `/journal`, `/flashcards`, `/links`, `/settings`

## i18n Architecture

- Hook: `useT()` from `src/i18n/index.ts`
- Languages: English, German, Farsi
- RTL: only for Farsi
- LanguageProvider syncs `html[lang]`, `html[dir]`, and Vazirmatn font class.
- All UI strings should use `t('key')` where practical.
- Language is stored in appearanceStore with the `smartflow:appearance` key.

## Global State

- `appearanceStore`: density, accent color, reduced motion, language
- `notificationSettings`: task, habit, calendar, daily-summary reminder prefs
- `pomodoroStore`: Pomodoro timer and linked task

## Local AI Architecture

- Ollama server: `http://localhost:11434`
- `OLLAMA_VULKAN=1` for Intel Arc 140V iGPU
- Continue.dev config: `C:\Users\aryan\.continue\config.yaml`
- Prompt library: `.prompts/`
- Knowledge base: `.knowledge/` with ChromaDB and `nomic-embed-text`
