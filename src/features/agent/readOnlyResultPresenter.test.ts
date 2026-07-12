import { describe, expect, it } from "vitest";
import { presentReadOnlyResult } from "./readOnlyResultPresenter";
import type { ExecutionResult } from "./executionTypes";

const now = "2026-07-10T09:00:00.000Z";

function result(overrides: Partial<ExecutionResult>): ExecutionResult {
  return {
    requestId: "request-1",
    stepId: "step-1",
    toolId: "tasks.list",
    status: "success",
    success: true,
    policyDecision: {
      status: "allowed",
      allowed: true,
      reasons: [],
      effectiveRiskLevel: "none",
      requiredApprovalScope: "view_only",
      stepId: "step-1",
      evaluatedAt: now,
      policyVersion: "execution-policy-v1",
      checks: [],
    },
    startedAt: now,
    completedAt: now,
    durationMs: 0,
    executionVersion: "execution-engine-v1",
    metadata: {
      readOnly: true,
      effectiveRiskLevel: "none",
    },
    ...overrides,
  };
}

describe("readOnlyResultPresenter", () => {
  it("summarizes tasks.list zero, one, and many active tasks safely", () => {
    expect(presentReadOnlyResult(result({ data: { tasks: [] } })).safeSummary).toBe("No active tasks found.");
    expect(presentReadOnlyResult(result({
      data: { tasks: [{ title: "One", status: "open" }] },
    })).safeSummary).toBe("1 active task found.");
    const many = presentReadOnlyResult(result({
      data: {
        tasks: [
          { title: "One", status: "open" },
          { title: "Done", status: "completed" },
          { title: "Two", status: "open" },
        ],
      },
    }));

    expect(many.safeSummary).toBe("2 active tasks found.");
    expect(many.safePreviewItems).toEqual(["One", "Two"]);
  });

  it("summarizes calendar.list_today zero, one, and many events", () => {
    expect(presentReadOnlyResult(result({
      toolId: "calendar.list_today",
      data: { events: [] },
    })).safeSummary).toBe("No events today.");
    expect(presentReadOnlyResult(result({
      toolId: "calendar.list_today",
      data: { events: [{ title: "Standup" }] },
    })).safeSummary).toBe("1 event found today.");
    expect(presentReadOnlyResult(result({
      toolId: "calendar.list_today",
      data: { events: [{ title: "A" }, { title: "B" }] },
    })).safeSummary).toBe("2 events found today.");
  });

  it("summarizes learning.get_progress zero, one, and many items", () => {
    expect(presentReadOnlyResult(result({
      toolId: "learning.get_progress",
      data: { lessons: [] },
    })).safeSummary).toBe("No learning progress found.");
    expect(presentReadOnlyResult(result({
      toolId: "learning.get_progress",
      data: { lessons: [{ title: "Sorting" }] },
    })).safeSummary).toBe("1 learning item found.");
    expect(presentReadOnlyResult(result({
      toolId: "learning.get_progress",
      data: { lessons: [{ title: "A" }, { title: "B" }] },
    })).safeSummary).toBe("2 learning items found.");
  });

  it("summarizes workspace.get_context without exposing workspace payload", () => {
    const presentation = presentReadOnlyResult(result({
      toolId: "workspace.get_context",
      data: { workspace: { memory: "private", signals: [{ reason: "details" }] } },
    }));

    expect(presentation.safeSummary).toBe("Workspace context loaded.");
    expect(presentation.safeSummary).not.toContain("private");
    expect(presentation.safeSummary).not.toContain("{");
  });

  it("normalizes failures without raw payloads or stack traces", () => {
    const presentation = presentReadOnlyResult(result({
      status: "failed",
      success: false,
      error: {
        code: "HANDLER_FAILED",
        message: "Sensitive stack trace",
        retryable: false,
      },
      data: { tasks: [{ title: "Private title" }] },
    }));

    expect(presentation.safeSummary).toBe("The read-only action could not run.");
    expect(presentation.safeSummary).not.toContain("Private title");
    expect(presentation.safeSummary).not.toContain("Sensitive");
  });
});
