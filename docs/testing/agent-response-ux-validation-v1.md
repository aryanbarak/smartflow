# Agent Response UX Validation V1

This document tracks validation for the response path:

```text
Verified runtime result
+ bounded workspace context
+ safe reflection
+ bounded decision profile
-> Context Synthesis
-> Response Composer
-> Chat UI
```

Scope:

- Supported tools: `tasks.list`, `calendar.list_today`, `learning.get_progress`,
  `workspace.get_context`, `tasks.complete`
- Languages: English, German, Persian
- Validation type: deterministic automated/static validation plus authenticated
  local browser QA

Out of scope:

- New tool execution
- New LLM calls
- Backend or Supabase production changes
- Autonomous behavior
- Semantic memory or vector storage

## Evidence Integrity

The canonical evidence artifact is:

```text
docs/testing/evidence/agent-response-ux-validation-v1.json
```

Every evidence row must disclose:

- `proposalSource`: `real-agent-worker`, `local-real-worker`, or
  `deterministic-browser-stub`
- `networkTransport`: whether worker transport was real or intercepted
- `layersExercised`: architectural layers actually exercised
- `layersExcluded`: architectural layers not exercised

A deterministic browser fetch stub may validate visible Chat UI, deterministic
intent validation, resolver behavior, approval separation, runtime/policy,
response composition, local persistence, and RTL rendering. It does not prove
real LLM intent recognition, actual worker request/response transport, or real
multilingual reasoning through the proposal path.

## Current Browser QA Status

Status: CONTROLLED AUTHENTICATED BROWSER INTEGRATION: PASS (15/15); LOCAL
REAL-WORKER REASONING MATRIX: PASS (8/8).

The bounded authentication smoke passed against local Supabase:

- The browser started at `/auth` with no stale authenticated session.
- The expected email, password, and sign-in controls were present.
- Local Supabase was reachable from the browser with HTTP 200.
- Authentication completed and the runner returned to `/chat` with the composer
  enabled.
- No network request failed. Existing React Router and PWA meta warnings remain
  non-blocking.

The controlled 15-row browser matrix completed with 15 `PASS` results. Every
row used `proposalSource: deterministic-browser-stub` and
`networkTransport: intercepted-browser-fetch`. These results validate only the
explicitly listed downstream browser-integration layers; they do not validate
the real proposal path.

## Real Reasoning Coverage

Rows intended to validate multilingual intent proposal and Worker transport use
one of these sources:

- `real-agent-worker`: deployed worker request/response path, with synthetic QA
  prompts and no production data mutation.
- `local-real-worker`: repository-supported local worker path.

The deployed worker authenticates against and persists to production Supabase,
so it was not used for synthetic QA. The fail-closed, stateless local reasoning
boundary at `POST /agent/reason` completed an eight-row authenticated matrix
through real Gemini and local Supabase Auth. Canonical sanitized evidence is at
`docs/testing/evidence/real-worker-arux-matrix-v1.json`.

The real-worker matrix covers task, calendar, learning, workspace, exact task
completion proposal, clarification, unsupported intent, and English/German/
Persian reasoning. Each accepted row made exactly one real Gemini request and
then passed through the deterministic validator and resolver. No row approved
or executed a tool, persisted through `/agent/reason`, or contacted production.

## Browser QA Matrix

Synthetic local data only.

| Test ID | Tool | Language | Input message | Expected response meaning | Automated result | Browser result | Proposal source | Notes |
|---|---|---|---|---|---|---|---|---|
| ARUX-01 | `tasks.list` | EN | Show my open tasks. | Says there are no active tasks. | PASS | PASS | deterministic-browser-stub | Controlled downstream integration only. |
| ARUX-02 | `tasks.list` | EN | Show my open tasks. | Says one active task exists with bounded details. | PASS | PASS | deterministic-browser-stub | Controlled downstream integration only. |
| ARUX-03 | `tasks.list` | EN | What tasks do I have today? | Says six active tasks exist with bounded preview. | PASS | PASS | deterministic-browser-stub | Controlled downstream integration only. |
| ARUX-04 | `tasks.list` | EN | What tasks need attention? | Preserves active task and workspace signal facts. | PASS | PASS | deterministic-browser-stub | Controlled downstream integration only. |
| ARUX-05 | `calendar.list_today` | EN | What is on my calendar today? | Reports no events without claiming a created focus block. | PASS | PASS | deterministic-browser-stub | Controlled downstream integration only. |
| ARUX-06 | `calendar.list_today` | EN | Show today's calendar. | Reports two events. | PASS | PASS | deterministic-browser-stub | Controlled downstream integration only. |
| ARUX-07 | `learning.get_progress` | EN | Show my learning progress. | Reports no visible progress without inventing a lesson. | PASS | PASS | deterministic-browser-stub | Controlled downstream integration only. |
| ARUX-08 | `learning.get_progress` | EN | Continue my learning. | Reports two learning items. | PASS | PASS | deterministic-browser-stub | Controlled downstream integration only. |
| ARUX-09 | `workspace.get_context` | EN | Summarize my workspace. | Gives a bounded workspace summary. | PASS | PASS | deterministic-browser-stub | Controlled downstream integration only. |
| ARUX-10 | `tasks.complete` | EN | Mark the selected task done. | Requires review, approval, run, and completion verification. | PASS | PASS | deterministic-browser-stub | Review, Approve, Complete Task, and local persistence verification passed. |
| ARUX-11 | `tasks.complete` | EN | Mark the selected task done again. | Reports already-complete with no new state change. | PASS | PASS | deterministic-browser-stub | Exact owned persisted state was verified; no duplicate mutation occurred and the UI reported an idempotent no-op. |
| ARUX-12 | `tasks.list` | EN | Show my open tasks. | Preserves runtime zero-task result over stale context. | PASS | PASS | deterministic-browser-stub | Controlled downstream integration only. |
| ARUX-13 | `tasks.list` | FA fixed | Persian task-list prompt. | Persian RTL response preserves two active tasks. | PASS | PASS | deterministic-browser-stub | Persian flow remained RTL; independent Latin blocks computed as LTR and screenshot review passed. |
| ARUX-14 | `calendar.list_today` | DE fixed | Zeig mir die heutigen Termine. | German response reports no events today. | PASS | PASS | deterministic-browser-stub | Proposal, composed answer, and visible runtime summary were German. |
| ARUX-15 | `learning.get_progress` | auto | Persian learning prompt. | Auto language resolves to Persian and preserves two learning items. | PASS | PASS | deterministic-browser-stub | Persian flow remained RTL; independent Latin lesson blocks computed as LTR and screenshot review passed. |

## Deterministic Findings

- Runtime summaries remain authoritative.
- Context Synthesis suppresses cross-source facts when runtime and workspace
  counts conflict.
- `tasks.complete` responses are based on write runtime status and do not claim
  success before verified runtime success.
- Already-completed tasks produce a no-new-change response.
- Zero task and zero learning results no longer receive generic action
  suggestions.
- Response scrubbing covers `taskId`, `schemaVersion`, confidence/score tokens,
  engine names, request IDs, audit/policy fields, raw JSON, prompts, and
  Supabase structures.

Finding: deterministic tests, the controlled authenticated browser matrix, and
the local real-worker reasoning matrix pass. The two evidence classes remain
separate: the 15-row controlled matrix validates downstream browser integration,
while the 8-row real-worker matrix validates the real local proposal transport
and multilingual model proposal path without tool execution.

## Final Result

Agent Response UX Validation V1 is complete for its bounded local scope:

- controlled authenticated browser integration: 15/15 `PASS`, using
  `deterministic-browser-stub` and intercepted browser fetch;
- local real-worker reasoning: 8/8 `PASS`, using `real-gemini` and
  `local-real-worker` transport.

This result is not production deployment validation. It does not validate
autonomous execution, additional tools, approval grant, or tool execution in
the real-worker matrix. The controlled rows must still not be interpreted as
proof of natural-language understanding or real Worker transport.
