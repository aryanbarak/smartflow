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
-> personalizationEngine()
-> priorityEngine()
-> goalEngine()
-> plannerEngine()
-> approvalEngine()
-> workspaceEngine()
-> Dashboard
```

Layer responsibilities:

- `useWorkspace`: collects existing frontend data and orchestrates the workspace pipeline.
- `signalEngine`: converts current user data into normalized workspace signals.
- `memoryEngine`: maintains bounded, versioned client-side continuity metadata.
- `interactionFeedbackEngine`: turns tracked workspace interactions into weak feedback evidence.
- `personalizationEngine`: applies weak preference evidence from recent and repeated activity.
- `priorityEngine`: selects primary and secondary workspace priorities while protecting urgent signals.
- `goalEngine`: converts priorities into a daily goal model.
- `plannerEngine`: proposes deterministic, non-executing workspace plan steps.
- `approvalEngine`: annotates planned steps with approval requirements and safety state.
- `workspaceEngine`: composes the final typed Workspace model consumed by Dashboard.

Workspace memory:

- localStorage key: `smartflow.workspace.memory.v1`
- Memory Engine V1 is client-local, deterministic, and non-semantic.
- No LLM, vector database, RAG, or backend memory is active yet.
- Urgent current signals always outrank personalization and memory.
- Low-data onboarding remains protected.

## Current Agent Architecture

SmartFlow now has a deterministic agent stack that prepares for safe execution
without enabling autonomy:

```text
Signals
->
Memory
->
Interaction Feedback
->
Personalization
->
Priority
->
Goal
->
Planner
->
Approval
->
Approval Interaction Boundary
->
Tool Registry
->
Execution Policy
->
Execution Engine
->
Execution Audit
```

Completed agent systems:

- Workspace Engine V1
- Signal Engine V1
- Memory Engine V1
- Interaction Tracking V1
- Interaction Feedback Loop V1
- Personalization Engine V1
- Priority Engine V1
- Goal Engine V1
- Planner Engine V1
- Approval Model V1
- Approval Interaction Boundary V1
- Tool Registry V1
- Execution Policy V1
- Execution Engine V1 (read-only)
- Execution Audit V1

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

Approvals bind to a specific `WorkspacePlanStep.id`. They cannot approve a
different step, escalate from `single_step` to broader scopes, lower the
declared risk level, or attach arbitrary planner metadata. Approval is only
intent capture; execution still requires the Tool Registry, Execution Policy,
Execution Engine, and Execution Audit path.

## Execution Engine V1

Execution Engine V1 is intentionally narrow and read-only.

It provides:

- explicit handler registry,
- policy-enforced execution,
- read-only tool support only,
- typed execution results,
- deterministic failure handling,
- execution audit recording,
- no write execution,
- no backend execution,
- no Supabase execution,
- no network execution,
- no autonomous behavior.

Supported read-only handlers:

- `tasks.list`
- `calendar.list_today`
- `learning.get_progress`
- `workspace.get_context`

Handlers are framework-independent. They must not import React hooks, UI code,
Supabase clients, or route components.

## Tool Registry

Tool Registry V1 contains contracts only:

- tool IDs,
- domains,
- capabilities,
- input schemas,
- risk levels,
- approval requirements,
- execution support metadata.

It does not contain handlers, API calls, secrets, backend calls, or execution
logic.

## AI Architecture

```text
User -> React App -> Cloudflare Worker -> Gemini 2.5 Flash (primary)
                                     -> Ollama Local fallback
```

Current workspace and agent architecture does not depend on LLM execution. LLM
reasoning remains a future layer above deterministic signals, memory, planning,
approval, and execution policy.

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
