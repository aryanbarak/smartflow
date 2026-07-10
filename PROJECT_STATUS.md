# SmartFlow - Project Status

Last updated: 2026-07-10

---

## 1. Executive Summary

SmartFlow has completed the Living Workspace Architecture milestone. The Dashboard is no longer treated as a static widget grid; it is now driven by a deterministic frontend workspace pipeline that collects existing activity data, derives signals, preserves lightweight client-side memory, personalizes ordering, selects priorities, and returns a typed Workspace object for presentation.

Flow AI is now represented as a persistent product presence through the sidebar identity Orb and an active right-rail assistant surface. The workspace experience supports both established users and low-data first-run users through the Living Workspace and Welcome Workspace states.

The current implementation remains frontend-only for workspace intelligence. No backend, Supabase schema, AI service, route, or business-logic expansion was required for this milestone.

---

## 2. Current Project Phase

Current phase: Living Workspace V1 complete; preparing for Workspace Interaction Tracking and AI-assisted planning.

Engineering focus has shifted from visual dashboard redesign to architecture readiness:

- Deterministic workspace generation is in place.
- Client-side memory is versioned and bounded.
- Personalization is weak, explainable, and rule-based.
- Urgent current signals remain dominant.
- The UI can now evolve without placing business logic back into `Dashboard.tsx`.

---

## 3. Completed Milestones

- Flow AI Orb visual identity and sidebar identity variant.
- Launch Experience and Workspace Birth synchronization.
- App shell gating to prevent dashboard visibility before launch reveal.
- Workspace Reveal orchestration.
- Living Workspace V1 dashboard hierarchy.
- Welcome Workspace for new or low-data users.
- Flow AI right rail as persistent assistant surface.
- Right rail scrolling UX moved to page-owned scrolling.
- Smart Academy external linking via configurable app URL.
- Workspace architecture refactor into feature-level engines.
- Signal Engine V1.
- Memory Engine V1.
- Personalization Engine V1.
- Priority Engine V1.
- Workspace Engine V1.

---

## 4. Living Workspace Architecture

The Living Workspace is now generated through a dedicated architecture under:

`src/features/workspace/`

Current pipeline:

```text
useWorkspace()
-> signalEngine()
-> memoryEngine()
-> personalizationEngine()
-> priorityEngine()
-> workspaceEngine()
-> Dashboard
```

Completed engines:

- Workspace Engine: converts typed workspace inputs into the final Workspace object consumed by the Dashboard.
- Signal Engine: derives deterministic task, calendar, finance, learning, and onboarding signals from existing frontend data.
- Memory Engine: stores bounded, versioned, client-side workspace memory in localStorage.
- Personalization Engine: applies weak domain affinity based on recent activity, repeated activity, and memory insights.
- Priority Engine: selects the primary workspace domain, secondary domains, mission copy, confidence, and ordered signal IDs.

Completed UI milestones:

- Living Workspace Hero.
- Flow AI Right Rail.
- Welcome Workspace.
- Sidebar Orb Identity.
- Continue Learning.
- Ecosystem navigation.
- Smart Academy external linking.

The Dashboard now acts primarily as a presentation layer. Workspace decision-making belongs to the workspace feature folder, not the page component.

---

## 5. Current Workspace Pipeline

`useWorkspace()` collects existing frontend data through current hooks:

- tasks
- events
- finance transactions
- habits
- documents
- Learn AI activity
- chat sessions

`signalEngine()` creates deterministic signals such as:

- many open tasks
- events today
- focus opportunity
- monthly finance activity
- active learning history
- low-data onboarding

`memoryEngine()` reads and updates lightweight client memory:

- recent domains
- domain usage counts
- preferred usage windows
- previous primary domain
- lightweight latest conversation metadata
- lightweight learning continuity
- bounded workspace history

`personalizationEngine()` uses current activity plus memory insights as weak preference evidence. It may reorder medium and low-priority surfaces but cannot override urgent current signals or low-data onboarding.

`priorityEngine()` determines:

- primary domain
- secondary domains
- mission title
- mission summary
- confidence
- ordered signal IDs

`workspaceEngine()` returns the final typed Workspace object used by the Dashboard UI.

---

## 6. Current Capabilities

The current system can:

- Generate a decision-first Living Workspace from existing frontend data.
- Detect low-data users and show an honest Welcome Workspace.
- Preserve lightweight client-side workspace context across browser sessions.
- Personalize safe ordering of hero skills, suggested actions, secondary domains, and recommendations.
- Keep high-severity current signals above memory and personalization.
- Keep Flow AI present through the sidebar identity Orb and right rail.
- Open Smart Academy as an external configurable application when configured.
- Fall back safely when workspace memory is unavailable, corrupt, or unsupported.

Current workspace memory storage:

- Storage key: `smartflow.workspace.memory.v1`
- Version: `1`
- Storage type: localStorage
- Scope: single browser/device
- Sensitive content policy: metadata only

---

## 7. Remaining Major Systems

The following systems are not complete and remain future work:

- Workspace Interaction Tracking.
- Semantic Memory.
- LLM Integration.
- Vector Memory.
- RAG.
- Planner.
- Action Execution.
- Cross-device Memory.
- Autonomous Flow AI.

These systems should build on the existing deterministic architecture rather than replacing it.

---

## 8. Technical Debt

- Workspace memory is localStorage-only and does not sync across devices.
- Right rail recommendation and learning-memory examples still include placeholder/static data where live sources are not available.
- Workspace interaction events are not yet tracked, so action memory has typed support but limited real event input.
- Some personalization for habits and documents depends on available date-like fields in existing frontend data.
- The production build still reports large Vite chunks; code splitting should be revisited.
- Some older feature areas still contain hardcoded UI strings and incomplete i18n/RTL polish.
- Error tracking is still not centralized.
- Some historical data growth risks remain open, including unbounded Learn AI/chat-related storage areas.

---

## 9. Next Sprint

Recommended next sprint: Workspace Interaction Tracking V1.

Primary goals:

- Track real user interactions with suggested actions.
- Record shown, clicked, completed, and dismissed action events where the UI genuinely exposes those events.
- Feed real interaction events into Memory Engine V1.
- Keep action tracking lightweight and privacy-safe.
- Preserve the current Dashboard layout.
- Avoid AI/LLM behavior until deterministic event tracking is reliable.

Secondary goals:

- Replace remaining right-rail placeholders with available live frontend data where possible.
- Add focused tests around action memory updates.
- Document memory reset/debug behavior for local development.

---

## 10. Long-Term Roadmap

Near term:

- Workspace Interaction Tracking.
- Stronger live data mapping for Continue Learning and Recent Conversation.
- Better deterministic recommendation ranking.
- More test coverage for workspace engines.

Mid term:

- Semantic Memory design.
- Cross-device memory backed by Supabase.
- Planner model that can propose multi-step daily plans.
- Safe action execution boundaries.
- Flow AI page-transition architecture originating from the sidebar Orb.

Long term:

- LLM-assisted reasoning layered on top of deterministic signals.
- Vector memory and RAG for documents, learning, and workspace history.
- Autonomous Flow AI that can plan, explain, and execute user-approved actions.
- Full multi-device continuity for memory, preferences, and workspace context.
