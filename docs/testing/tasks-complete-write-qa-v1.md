# Tasks Complete Write QA v1

## Purpose

This checklist verifies the first user-visible SmartFlow write flow: `tasks.complete`.

It is production hardening documentation only. It does not approve any additional write tool.

## Scope

Covered:

- `tasks.complete`
- explicit approval
- separate run action
- Write Runtime
- Execution Policy
- Supabase-backed task completion
- post-write verification
- Execution Audit
- Reflection
- task refresh

Out of scope:

- `tasks.create`
- `tasks.update`
- task delete
- calendar write tools
- autonomous execution
- automatic retries
- chained execution
- backend schema changes

## Production Readiness Checklist

- `tasks.complete` is the only user-visible write tool.
- The UI does not pass `userId`.
- Runtime derives user identity from the authenticated browser session.
- Task service queries and updates by both `taskId` and `userId`.
- Supabase RLS remains enabled for the `tasks` table.
- No service-role key is used in frontend execution.
- No service-role key appears in browser-visible `VITE_*` variables.
- Supabase URL and anonymous key are the only browser-side Supabase credentials.
- Build output does not include server-only credentials.
- Approval is bound to the exact `stepId`, `toolId`, task target, scope and risk.
- Approve and Run remain separate user actions.
- No execution occurs on mount, render, approval, close, Escape or rerender.
- The write handler verifies persisted state after mutation.
- Already-completed tasks return a no-change success.
- Duplicate UI clicks are blocked.
- Duplicate runtime request IDs are rejected.
- Execution Audit records one started event and one terminal event under normal execution.
- Audit metadata is redacted and does not store task title, notes, user ID, raw payloads, raw Supabase errors or stack traces.
- Reflection does not claim new completion for already-completed tasks.
- Verified success triggers task refresh.
- Refresh failure does not convert a verified write into a failed write.
- Terminal UI messages are safe and do not render raw JSON, IDs, stack traces or Supabase errors.

## Manual QA Scenarios

### A. Incomplete Task

1. Create or identify one incomplete task.
2. Confirm the workspace proposes exactly one eligible `tasks.complete` action.
3. Click `Review action`.
4. Click `Approve`.
5. Confirm the task is not mutated immediately after approval.
6. Click `Complete task`.
7. Confirm the result says `Task marked as completed.`
8. Confirm the task list refreshes and the task appears completed or leaves incomplete views.
9. Refresh the browser and confirm the completed state persists.

### B. Already Completed Task

1. Use a task that is already completed.
2. Run the approved `tasks.complete` action for that task.
3. Confirm the UI reports no additional change.
4. Confirm `completed_at` remains unchanged.
5. Confirm Reflection does not claim a new completion.

### C. Reject

1. Open the approval dialog.
2. Click `Reject`.
3. Confirm no `Complete task` execution is authorized.
4. Confirm no task mutation occurs.

### D. Close Dialog

1. Open the approval dialog.
2. Close it with Cancel, close control or Escape.
3. Confirm no approval is created.
4. Confirm no mutation occurs.

### E. Double Click

1. Approve a valid `tasks.complete` step.
2. Double-click `Complete task`.
3. Confirm only one execution request is processed.
4. Confirm final persisted state is completed.

### F. Deleted Task After Approval

1. Approve a valid `tasks.complete` step.
2. Delete the target task from another session or tab before clicking Run.
3. Click `Complete task`.
4. Confirm the action fails closed with a safe failure message.
5. Confirm no target substitution occurs.

### G. Wrong User Or Unowned Task

1. Approve a step whose target is no longer owned or accessible by the authenticated user.
2. Click `Complete task`.
3. Confirm the action fails safely.
4. Confirm no other user's task is mutated.

### H. Refresh Failure

1. Complete a valid task and force the post-write refresh to fail.
2. Confirm the verified write result remains visible.
3. Confirm a safe refresh warning appears.
4. Confirm the write is not reported as failed.

## Verification Commands

Run before production release:

```bash
npm run test -- src/features/tasks
npm run test -- src/features/agent
npm run test -- src/features/workspace
npm run build
```

## Go/No-Go Rule

Do not add a second write tool until `tasks.complete` passes this checklist in browser QA and production-like Supabase/RLS conditions.
