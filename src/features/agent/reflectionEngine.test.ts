import { describe, expect, it } from "vitest";
import { reflectOnExecution } from "./reflectionEngine";
import type { ExecutionAuditRecord } from "./executionAuditTypes";
import type { ExecutionResult, ExecutionStatus } from "./executionTypes";
import type { ToolResolutionResult } from "./toolResolverTypes";
import type {
  WorkspaceGoal,
  WorkspacePlan,
  WorkspacePlanStep,
  WorkspaceSignalDomain,
} from "../workspace/workspaceTypes";

const now = new Date("2026-07-10T09:00:00.000Z");

function step(domain: WorkspaceSignalDomain, overrides: Partial<WorkspacePlanStep> = {}): WorkspacePlanStep {
  return {
    id: `step:${domain}`,
    order: 1,
    title: `Review ${domain}`,
    description: `Gather ${domain} information.`,
    domain,
    estimatedMinutes: 5,
    status: "proposed",
    actionType: "review",
    reason: "Read-only information gathering.",
    requiresApproval: false,
    dependencies: [],
    optional: false,
    ...overrides,
  };
}

function goal(primaryDomain: WorkspaceSignalDomain, supportingDomains: WorkspaceSignalDomain[] = []): WorkspaceGoal {
  return {
    id: `goal:${primaryDomain}`,
    title: `Focus ${primaryDomain}`,
    summary: `Use ${primaryDomain} evidence.`,
    primaryDomain,
    supportingDomains,
    successCriteria: [],
    estimatedEffortMinutes: 20,
    confidence: "high",
    reasons: [],
    constraints: [],
    generatedAt: now.toISOString(),
    sourceSignalIds: [],
    sourcePriorityDomains: [primaryDomain],
    status: "proposed",
  };
}

function plan(sourceGoal: WorkspaceGoal): WorkspacePlan {
  return {
    id: "plan-1",
    goalId: sourceGoal.id,
    title: "Plan",
    summary: "Read-only plan.",
    status: "proposed",
    steps: [],
    totalEstimatedMinutes: 20,
    confidence: "high",
    constraints: [],
    reasons: [],
    generatedAt: now.toISOString(),
    sourceGoal,
    sourceSignalIds: [],
  };
}

function resolution(sourceStep: WorkspacePlanStep, toolId: string): ToolResolutionResult {
  return {
    status: "resolved",
    resolved: true,
    stepId: sourceStep.id,
    toolId,
    tool: {
      id: toolId,
      name: toolId,
      description: "Read-only tool.",
      domain: toolId.split(".")[0] as never,
      capability: "inspect",
      mode: "read",
      riskLevel: "none",
      requiresApproval: false,
      approvalScope: "view_only",
      reversible: true,
      externalEffect: false,
      inputSchema: [],
      outputSchema: {
        type: "object",
        description: "Output.",
      },
      enabled: true,
      version: "v1",
      tags: [],
      examples: [],
      constraints: [],
    },
    confidence: "high",
    reasons: [],
    candidates: [],
    requiredInput: [],
    generatedAt: now.toISOString(),
    resolverVersion: "tool-resolver-v1",
  };
}

function execution(
  sourceStep: WorkspacePlanStep,
  toolId: string,
  status: ExecutionStatus,
  data?: unknown,
): ExecutionResult {
  return {
    requestId: `request:${toolId}:${status}`,
    stepId: sourceStep.id,
    toolId,
    status,
    success: status === "success",
    data,
    error: status === "success"
      ? undefined
      : {
          code: status.toUpperCase(),
          message: "Normalized error.",
          retryable: status === "timeout",
        },
    policyDecision: {
      status: status === "policy_denied" ? "approval_required" : "allowed",
      allowed: status !== "policy_denied",
      reasons: [],
      effectiveRiskLevel: "none",
      requiredApprovalScope: "view_only",
      stepId: sourceStep.id,
      evaluatedAt: now.toISOString(),
      policyVersion: "execution-policy-v1",
      checks: [],
    },
    startedAt: now.toISOString(),
    completedAt: now.toISOString(),
    durationMs: 0,
    executionVersion: "execution-engine-v1",
    metadata: {
      readOnly: true,
      handlerId: toolId,
      effectiveRiskLevel: "none",
    },
  };
}

function auditRecords(result: ExecutionResult): ExecutionAuditRecord[] {
  const base = {
    requestId: result.requestId,
    stepId: result.stepId,
    toolId: result.toolId,
    policyStatus: result.policyDecision.status,
    startedAt: result.startedAt,
    riskLevel: "none" as const,
    source: "agent" as const,
    executionVersion: "execution-engine-v1" as const,
    policyVersion: "execution-policy-v1" as const,
    auditVersion: "execution-audit-v1" as const,
    metadata: { redacted: true },
  };

  return [
    {
      ...base,
      auditId: `audit:${result.requestId}:started`,
      status: "started",
    },
    {
      ...base,
      auditId: `audit:${result.requestId}:${result.status}`,
      status: result.status,
      completedAt: result.completedAt,
      durationMs: result.durationMs,
      errorCode: result.error?.code,
    },
  ];
}

function reflect(
  sourceStep: WorkspacePlanStep,
  sourceGoal: WorkspaceGoal,
  result: ExecutionResult,
  records = auditRecords(result),
) {
  return reflectOnExecution({
    executionResult: result,
    auditRecords: records,
    step: sourceStep,
    goal: sourceGoal,
    plan: plan(sourceGoal),
    toolResolution: resolution(sourceStep, result.toolId),
    reflectedAt: now,
  });
}

describe("reflectionEngine", () => {
  it("reflects successful tasks.list without implying completion", () => {
    const sourceStep = step("tasks");
    const result = execution(sourceStep, "tasks.list", "success", {
      tasks: [{ title: "Private task title", status: "open" }],
    });
    const reflection = reflect(sourceStep, goal("tasks"), result);

    expect(reflection.outcome).toBe("successful");
    expect(reflection.usefulness).toBe("high");
    expect(reflection.goalProgress).toBe("supported");
    expect(reflection.stepAssessment).toBe("information_gathered");
    expect(reflection.summary).toBe("Active task information was gathered.");
    expect(reflection.summary).not.toContain("Private task title");
    expect(JSON.stringify(reflection)).not.toContain("completed");
  });

  it("treats empty tasks.list as valid information, not failure", () => {
    const sourceStep = step("tasks");
    const reflection = reflect(
      sourceStep,
      goal("tasks"),
      execution(sourceStep, "tasks.list", "success", { tasks: [] }),
    );

    expect(reflection.outcome).toBe("empty");
    expect(reflection.usefulness).toBe("medium");
    expect(reflection.stepAssessment).toBe("information_gathered");
    expect(reflection.retainAsMemoryEvidence).toBe(true);
  });

  it("reflects calendar relevance for day-planning goals", () => {
    const sourceStep = step("calendar");
    const reflection = reflect(
      sourceStep,
      goal("calendar"),
      execution(sourceStep, "calendar.list_today", "success", {
        events: [{ title: "Private event" }],
      }),
    );

    expect(reflection.outcome).toBe("successful");
    expect(reflection.usefulness).toBe("high");
    expect(reflection.suggestedFollowUp).toBe("Review today's events before choosing the next focus block.");
    expect(JSON.stringify(reflection)).not.toContain("Private event");
  });

  it("reflects learning progress relevance", () => {
    const sourceStep = step("learning");
    const reflection = reflect(
      sourceStep,
      goal("learning"),
      execution(sourceStep, "learning.get_progress", "success", {
        lessons: [{ title: "Private lesson", completionPercentage: 82 }],
      }),
    );

    expect(reflection.outcome).toBe("successful");
    expect(reflection.usefulness).toBe("high");
    expect(reflection.suggestedFollowUp).toBe("Continue the most recent unfinished learning item.");
    expect(JSON.stringify(reflection)).not.toContain("Private lesson");
  });

  it("reflects workspace context without exposing raw context", () => {
    const sourceStep = step("documents");
    const reflection = reflect(
      sourceStep,
      goal("tasks", ["documents"]),
      execution(sourceStep, "workspace.get_context", "success", {
        workspace: { memory: "private memory", interactionHistory: ["secret"] },
      }),
    );

    expect(reflection.outcome).toBe("successful");
    expect(reflection.summary).toBe("Workspace context was gathered.");
    expect(reflection.usefulness).toBe("medium");
    expect(JSON.stringify(reflection)).not.toContain("private memory");
  });

  it("reflects policy denial without suggesting bypass", () => {
    const sourceStep = step("tasks");
    const reflection = reflect(
      sourceStep,
      goal("tasks"),
      execution(sourceStep, "tasks.list", "policy_denied"),
    );

    expect(reflection.outcome).toBe("policy_denied");
    expect(reflection.stepAssessment).toBe("blocked");
    expect(reflection.goalProgress).toBe("none");
    expect(reflection.suggestedFollowUp).toBeUndefined();
    expect(reflection.retainAsMemoryEvidence).toBe(false);
  });

  it("reflects timeout and failure with normalized summaries", () => {
    const sourceStep = step("tasks");
    const timeout = reflect(sourceStep, goal("tasks"), execution(sourceStep, "tasks.list", "timeout"));
    const failed = reflect(sourceStep, goal("tasks"), execution(sourceStep, "tasks.list", "failed"));

    expect(timeout.outcome).toBe("timeout");
    expect(timeout.suggestedFollowUp).toBe("Try the read-only action again later.");
    expect(failed.outcome).toBe("failed");
    expect(failed.summary).toBe("The read-only action failed.");
  });

  it("marks audit correlation mismatch as invalid", () => {
    const sourceStep = step("tasks");
    const result = execution(sourceStep, "tasks.list", "success", { tasks: [{ status: "open" }] });
    const mismatchedRecords = auditRecords(result).map((record) =>
      record.status === "success"
        ? { ...record, toolId: "calendar.list_today" }
        : record,
    );
    const reflection = reflect(sourceStep, goal("tasks"), result, mismatchedRecords);

    expect(reflection.outcome).toBe("invalid");
    expect(reflection.confidence).toBe("low");
    expect(reflection.retainAsMemoryEvidence).toBe(false);
  });

  it("does not claim goal progress for unrelated evidence", () => {
    const sourceStep = step("tasks");
    const reflection = reflect(
      sourceStep,
      goal("learning", ["calendar"]),
      execution(sourceStep, "tasks.list", "success", { tasks: [{ status: "open" }] }),
    );

    expect(reflection.usefulness).toBe("low");
    expect(reflection.goalProgress).toBe("none");
    expect(reflection.retainAsMemoryEvidence).toBe(false);
  });

  it("retains memory evidence only for valid, safe, relevant evidence", () => {
    const sourceStep = step("tasks");
    const relevant = reflect(
      sourceStep,
      goal("tasks"),
      execution(sourceStep, "tasks.list", "success", { tasks: [{ title: "Private", status: "open" }] }),
    );
    const failed = reflect(sourceStep, goal("tasks"), execution(sourceStep, "tasks.list", "failed"));

    expect(relevant.retainAsMemoryEvidence).toBe(true);
    expect(relevant.evidence).toEqual([
      {
        toolId: "tasks.list",
        domain: "tasks",
        outcome: "successful",
        usefulness: "high",
        goalProgress: "supported",
        itemCount: 1,
        timestamp: now.toISOString(),
      },
    ]);
    expect(JSON.stringify(relevant.evidence)).not.toContain("Private");
    expect(failed.retainAsMemoryEvidence).toBe(false);
    expect(failed.evidence).toEqual([]);
  });

  it("reflects a verified tasks.complete write without exposing task payloads", () => {
    const sourceStep = step("tasks", {
      id: "step:complete-task",
      actionType: "complete",
      targetId: "task-1",
    });
    const result = execution(sourceStep, "tasks.complete", "success", {
      taskId: "task-1",
      completed: true,
      completedAt: now.toISOString(),
      alreadyCompleted: false,
      verified: true,
      title: "Private task title",
    });
    const reflection = reflect(sourceStep, goal("tasks"), result);

    expect(reflection.outcome).toBe("successful");
    expect(reflection.summary).toBe("Task completion was verified.");
    expect(reflection.retainAsMemoryEvidence).toBe(true);
    expect(reflection.evidence).toEqual([expect.objectContaining({
      toolId: "tasks.complete",
      domain: "tasks",
      itemCount: 1,
    })]);
    expect(JSON.stringify(reflection)).not.toContain("Private task title");
  });

  it("reflects already-completed tasks.complete as no-change and does not retain positive completion evidence", () => {
    const sourceStep = step("tasks", {
      id: "step:complete-task",
      actionType: "complete",
      targetId: "task-1",
    });
    const result = execution(sourceStep, "tasks.complete", "success", {
      taskId: "task-1",
      completed: true,
      completedAt: now.toISOString(),
      alreadyCompleted: true,
      verified: true,
    });
    const reflection = reflect(sourceStep, goal("tasks"), result);

    expect(reflection.outcome).toBe("empty");
    expect(reflection.summary).toBe("Task was already completed. No new change was needed.");
    expect(reflection.retainAsMemoryEvidence).toBe(false);
    expect(reflection.evidence).toEqual([]);
    expect(reflection.suggestedFollowUp).toBeUndefined();
  });

  it("does not mutate input and is deterministic", () => {
    const sourceStep = step("tasks");
    const sourceGoal = goal("tasks");
    const result = execution(sourceStep, "tasks.list", "success", { tasks: [{ status: "open" }] });
    const records = auditRecords(result);
    const input = {
      executionResult: result,
      auditRecords: records,
      step: sourceStep,
      goal: sourceGoal,
      toolResolution: resolution(sourceStep, result.toolId),
      reflectedAt: now,
    };
    const before = JSON.stringify(input);

    const first = reflectOnExecution(input);
    const second = reflectOnExecution(input);

    expect(second).toEqual(first);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("reflection does not alter the execution result or invoke tools", () => {
    const sourceStep = step("tasks");
    const result = execution(sourceStep, "tasks.list", "success", { tasks: [{ status: "open" }] });
    const before = JSON.stringify(result);

    reflect(sourceStep, goal("tasks"), result);

    expect(JSON.stringify(result)).toBe(before);
  });
});
