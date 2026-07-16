# Agent Response UX Validation V1

This document validates the deterministic response path:

Verified runtime result + bounded workspace context + safe reflection + bounded decision profile
-> Context Synthesis -> Response Composer -> Chat UI

Scope:
- Supported tools: `tasks.list`, `calendar.list_today`, `learning.get_progress`, `workspace.get_context`, `tasks.complete`
- Languages: English, German, Persian
- Validation type: deterministic automated/static validation plus browser QA matrix for manual retest

Out of scope:
- New tool execution
- New LLM calls
- Backend or Supabase changes
- Autonomous behavior
- Semantic memory or vector storage

## Pass Criteria

Final responses must:
- summarize first,
- remain concise,
- preserve verified runtime facts,
- include at most one bounded suggestion,
- avoid duplicate or contradictory counts,
- avoid personality, emotion, motivation, or productivity claims,
- avoid implying read-only inspection changed data,
- avoid exposing internal metadata.

Final responses must not expose:
- `requestId`
- `stepId`
- `taskId`
- `schemaVersion`
- audit or policy information
- reflection or memory evidence
- internal confidence or scores
- engine names
- prompts
- raw JSON
- Supabase structures
- private task notes

## Browser QA Matrix

Synthetic data only. The automated result records deterministic unit/component validation. Live browser result remains for manual QA.

| Test ID | Tool | Language | Input message | Verified source facts | Expected response meaning | Forbidden claims | Automated result | Live browser result | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ARUX-01 | `tasks.list` | EN | Show my open tasks. | `0 active tasks found.` | Says there are no active tasks. | Must not suggest choosing an active task. Must not invent task titles. | PASS | BLOCKED | Regression added for zero-result suggestion suppression. |
| ARUX-02 | `tasks.list` | EN | Show my open tasks. | `1 active task found.` with one safe preview title. | Says one active task exists and may show the verified title. | Must not expose `taskId` or imply completion. | PASS | BLOCKED | Runtime preview remains authoritative. |
| ARUX-03 | `tasks.list` | EN | What tasks do I have today? | `6 active tasks found.` with three safe preview titles. | Says six active tasks exist and shows a bounded preview. | Must not dump raw task data or private notes. | PASS | BLOCKED | Details remain bounded. |
| ARUX-04 | `tasks.list` | EN | What tasks need attention? | Runtime: six open tasks. Workspace snapshot: one due today, three unscheduled, four completed this week. | Says one of six open tasks is due, three lack due dates, four were completed this week. | Must not call the user productive/lazy/disciplined. Must not command completion. | PASS | BLOCKED | Context synthesis supplies bounded facts. |
| ARUX-05 | `calendar.list_today` | EN | What is on my calendar today? | `No events today.` and one due task in bounded workspace context. | Says calendar is open and one task is due. | Must not claim a focus block was reserved. | PASS | BLOCKED | Suggestion may mention focused work as optional. |
| ARUX-06 | `calendar.list_today` | EN | Show today's calendar. | `2 events found today.` | Says two events exist today. | Must not infer availability beyond supplied data. | PASS | BLOCKED | Runtime count remains authoritative. |
| ARUX-07 | `learning.get_progress` | EN | Show my learning progress. | `No learning progress found.` | Says no learning progress is visible yet. | Must not suggest continuing an item. Must not infer mastery. | PASS | BLOCKED | Zero-result suggestion suppression applies. |
| ARUX-08 | `learning.get_progress` | EN | Continue my learning. | `2 learning items found.` and learning is the current goal domain. | Says learning is part of today's goal and active items are ready to continue. | Must not claim a lesson was completed unless verified. | PASS | BLOCKED | Suggestion may mention continuing the recent item. |
| ARUX-09 | `workspace.get_context` | EN | Summarize my workspace. | Workspace context loaded; goal title and primary domain are bounded. | Says verified workspace context is available and may mention the current goal/domain. | Must not mention Decision Intelligence, Priority Engine, WorkspaceMemory, or scores. | PASS | BLOCKED | Internal names are scrubbed. |
| ARUX-10 | `tasks.complete` | EN | Mark the selected task done. | Write runtime success and verification completed. | Says the task is marked complete. | Must not claim success before verification. Must not expose task id. | PASS | BLOCKED | Write runtime remains authoritative. |
| ARUX-11 | `tasks.complete` | EN | Mark the selected task done again. | Write runtime reports already complete. | Says the task was already complete and no new change was made. | Must not claim a new state change. | PASS | BLOCKED | Existing composer behavior retained. |
| ARUX-12 | `tasks.list` | EN | Show my open tasks. | Runtime says zero active tasks; stale workspace snapshot says six. | Preserves runtime zero-task result and omits disputed synthesized facts. | Must not show contradictory counts. Must not guess. | PASS | BLOCKED | Contradiction handling lowers synthesis confidence and suppresses insight. |
| ARUX-13 | `tasks.list` | FA fixed | کارهای باز من را نشان بده. | `2 active tasks found.` with English task titles. | Persian response with same verified count; English titles remain readable as titles. | Must not fall back to English-only assistant copy. | PASS | BLOCKED | Chat bubble keeps language metadata for RTL. |
| ARUX-14 | `calendar.list_today` | DE fixed | Zeig mir die heutigen Termine. | `0 events today.` | German response states the calendar is free/open today. | Must not use broken literal wording or English fallback. | PASS | BLOCKED | German deterministic copy validated. |
| ARUX-15 | `learning.get_progress` | auto | ادامه درس من را نشان بده. | `2 learning items found.` | Auto language resolves to Persian and preserves the verified learning count. | Must not change facts across languages. | PASS | BLOCKED | Language resolution path remains existing Chat UI behavior. |

## Factual Correctness Findings

- Runtime summaries remain authoritative.
- Context Synthesis suppresses cross-source facts when runtime and workspace counts conflict.
- `tasks.complete` responses are based on write runtime status and do not claim success before verified runtime success.
- Already-completed tasks produce a no-new-change response.

Finding: PASS after focused fix.

## Multilingual Findings

- English responses remain concise and summary-first.
- German deterministic copy is grammar-safe for supported count cases.
- Persian deterministic copy is available for supported tools, and Chat UI preserves assistant language metadata for RTL rendering.
- English task titles are only displayed when they come from safe runtime preview items.

Finding: PASS by deterministic tests; live browser RTL visual retest remains manual.

## Contradiction Handling Findings

- Task and calendar count conflicts suppress synthesized context.
- The composer no longer backfills a generic suggestion when synthesis was suppressed by contradiction.

Finding: PASS.

## Suggestion Safety Findings

Allowed suggestions remain:
- add due dates for unscheduled tasks,
- use open calendar for focused work,
- continue the recent learning item when active learning exists.

Focused fix:
- zero task and zero learning results no longer receive generic action suggestions.

Finding: PASS.

## Privacy Findings

Focused fix:
- response scrubbing now covers `taskId`, `schemaVersion`, internal confidence/score tokens, and engine names in addition to request/audit/policy fields.

Finding: PASS.

## Remaining Manual Browser QA

The matrix above is ready for live browser retest. Automated tests validate deterministic output and ChatPage formatting, but this pass did not execute an interactive browser session.
