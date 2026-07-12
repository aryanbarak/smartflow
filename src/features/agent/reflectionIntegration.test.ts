import { describe, expect, it } from "vitest";
import {
  appendWorkspaceReflectionEvidence,
  processReadOnlyReflection,
  toWorkspaceReflectionEvidence,
} from "./reflectionIntegration";
import { clearExecutionAuditRecords } from "./executionAudit";
import { runReadOnlyTool } from "./readOnlyRuntime";
import {
  createDefaultWorkspaceMemory,
  loadWorkspaceMemory,
  migrateWorkspaceMemory,
  saveWorkspaceMemory,
  WORKSPACE_MEMORY_STORAGE_KEY,
} from "../workspace/workspaceMemoryStorage";
import { memoryEngine } from "../workspace/memoryEngine";
import { personalizationEngine } from "../workspace/personalizationEngine";
import type { AgentReflectionResult } from "./reflectionTypes";
import type { ExecutionAuditRecord } from "./executionAuditTypes";
import type { ExecutionResult, ExecutionStatus } from "./executionTypes";
import type { ToolResolutionResult } from "./toolResolverTypes";
import type {
  Workspace,
  WorkspaceGoal,
  WorkspacePlan,
  WorkspacePlanStep,
  WorkspaceSignal,
  WorkspaceSignalDomain,
} from "../workspace/workspaceTypes";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

class FailingStorage extends MemoryStorage {
  setItem() {
    throw new Error("Storage unavailable.");
  }
}

const now = new Date("2026-07-10T09:00:00.000Z");

function step(domain: WorkspaceSignalDomain, overrides: Partial<WorkspacePlanStep> = {}): WorkspacePlanStep {
  return {
    id: `step:${domain}`,
    order: 1,
    title: `Review ${domain}`,
    description: "Read-only step.",
    domain,
    estimatedMinutes: 5,
    status: "proposed",
    actionType: "review",
    reason: "Gather information.",
    requiresApproval: false,
    dependencies: [],
    optional: false,
    ...overrides,
  };
}

function goal(primaryDomain: WorkspaceSignalDomain): WorkspaceGoal {
  return {
    id: `goal:${primaryDomain}`,
    title: `Goal ${primaryDomain}`,
    summary: "Goal.",
    primaryDomain,
    supportingDomains: [],
    successCriteria: [],
    estimatedEffortMinutes: 10,
    confidence: "high",
    reasons: [],
    constraints: [],
    generatedAt: now.toISOString(),
    sourceSignalIds: [],
    sourcePriorityDomains: [primaryDomain],
    status: "proposed",
  };
}

function plan(sourceGoal: WorkspaceGoal, sourceStep: WorkspacePlanStep): WorkspacePlan {
  return {
    id: "plan-1",
    goalId: sourceGoal.id,
    title: "Plan",
    summary: "Plan.",
    status: "proposed",
    steps: [sourceStep],
    totalEstimatedMinutes: 5,
    confidence: "high",
    constraints: [],
    reasons: [],
    generatedAt: now.toISOString(),
    sourceGoal,
    sourceSignalIds: [],
  };
}

function workspace(sourceStep = step("tasks"), sourceGoal = goal("tasks")): Workspace {
  return {
    today: { date: now, label: "Today", greeting: "Good morning" },
    isLowData: false,
    hero: {
      title: "Hero",
      summary: "Summary",
      dailyStory: { bullets: [] },
      signals: [],
      skills: [],
    },
    signals: {
      isLoading: false,
      totalSignals: 1,
      incompleteTasks: 1,
      eventsToday: 0,
      netThisMonth: 0,
      netThisMonthLabel: "0.00",
      tasksCreatedThisWeek: 0,
    },
    suggestedActions: [],
    reasons: [],
    continueLearning: null,
    recommendations: [],
    manualActions: [],
    focusPlaylist: { title: "Focus Playlist", tracks: [] },
    signalFeed: [],
    personalization: {
      domainAffinity: { tasks: 0, calendar: 0, learning: 0, habits: 0, finance: 0, documents: 0 },
      recentDomains: [],
      preferredDomains: [],
      confidence: "low",
      evidence: [],
      generatedAt: now.toISOString(),
    },
    priority: {
      primaryDomain: "tasks",
      secondaryDomains: [],
      missionTitle: "Tasks",
      missionSummary: "Tasks",
      confidence: "high",
      reasons: [],
      orderedSignalIds: [],
    },
    memoryInsights: {
      recentDomains: [],
      familiarDomains: [],
      preferredTimeDomains: [],
      repeatedActionPatterns: [],
      interactionDomains: [],
      recentReflectedDomains: [],
      reflectionEngagementByDomain: {},
      reflectionContinuityConfidence: "low",
      confidence: "low",
      evidence: [],
    },
    interactionFeedback: {
      domainEngagement: { tasks: 0, calendar: 0, learning: 0, habits: 0, finance: 0, documents: 0 },
      actionEngagement: [],
      repeatedInteractionPatterns: [],
      avoidedDomains: [],
      recentInteractionDomains: [],
      preferredSources: {},
      confidence: "low",
      evidence: [],
      generatedAt: now.toISOString(),
    },
    goal: sourceGoal,
    plan: plan(sourceGoal, sourceStep),
    toolResolutions: [],
    approval: {
      overallStatus: "not_required",
      riskLevel: "none",
      stepApprovals: [],
      requiredApprovalCount: 0,
      pendingApprovalCount: 0,
      generatedAt: now.toISOString(),
      approvalVersion: "approval-model-v1",
    },
    agentContext: {
      tasks: [{ id: "task-1", title: "Private task", completed: false, status: "open" }],
      events: [],
      learningProgress: null,
    },
    welcome: { setupActions: [], learningSignals: [] },
    rightRail: {
      statusMessage: "Ready",
      recentLessons: [],
      recommendations: [],
      recentConversation: null,
      isChatLoading: false,
    },
  };
}

function resolution(sourceStep: WorkspacePlanStep, toolId = "tasks.list"): ToolResolutionResult {
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
      outputSchema: { type: "object", description: "Output." },
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

function reflection(overrides: Partial<AgentReflectionResult> = {}): AgentReflectionResult {
  return {
    id: "reflection-1",
    requestId: "request-1",
    stepId: "step-1",
    goalId: "goal-1",
    toolId: "tasks.list",
    outcome: "successful",
    usefulness: "high",
    goalProgress: "supported",
    stepAssessment: "information_gathered",
    confidence: "high",
    summary: "Active task information was gathered.",
    evidence: [{
      toolId: "tasks.list",
      domain: "tasks",
      outcome: "successful",
      usefulness: "high",
      goalProgress: "supported",
      itemCount: 1,
      timestamp: now.toISOString(),
    }],
    suggestedFollowUp: "Review the active tasks and choose the next one.",
    retainAsMemoryEvidence: true,
    generatedAt: now.toISOString(),
    reflectionVersion: "reflection-engine-v1",
    ...overrides,
  };
}

function executionResult(sourceStep: WorkspacePlanStep, status: ExecutionStatus = "success"): ExecutionResult {
  return {
    requestId: "request-runtime",
    stepId: sourceStep.id,
    toolId: "tasks.list",
    status,
    success: status === "success",
    data: status === "success" ? { tasks: [{ title: "Private task", status: "open" }] } : undefined,
    error: status === "success" ? undefined : { code: "FAILED", message: "Normalized.", retryable: false },
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
    metadata: { readOnly: true, handlerId: "tasks.list", effectiveRiskLevel: "none" },
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
    { ...base, auditId: "audit-start", status: "started" },
    { ...base, auditId: "audit-terminal", status: result.status, completedAt: result.completedAt },
  ];
}

describe("reflectionIntegration", () => {
  it("converts valid successful and empty reflection into safe evidence", () => {
    const successful = toWorkspaceReflectionEvidence(reflection(), now);
    const empty = toWorkspaceReflectionEvidence(reflection({
      outcome: "empty",
      usefulness: "medium",
      goalProgress: "informed",
      evidence: [{
        toolId: "tasks.list",
        domain: "tasks",
        outcome: "empty",
        usefulness: "medium",
        goalProgress: "informed",
        itemCount: 0,
        timestamp: now.toISOString(),
      }],
    }), now);

    expect(successful).toMatchObject({
      requestId: "request-1",
      stepId: "step-1",
      toolId: "tasks.list",
      domain: "tasks",
      outcome: "successful",
      usefulness: "high",
      goalProgress: "supported",
      schemaVersion: 1,
    });
    expect(empty?.outcome).toBe("empty");
    expect(JSON.stringify(successful)).not.toContain("Active task information");
  });

  it("does not retain invalid, failed, timeout, policy denied, low-confidence, or unrelated evidence", () => {
    expect(toWorkspaceReflectionEvidence(reflection({ outcome: "invalid" }))).toBeUndefined();
    expect(toWorkspaceReflectionEvidence(reflection({ outcome: "failed" }))).toBeUndefined();
    expect(toWorkspaceReflectionEvidence(reflection({ outcome: "timeout" }))).toBeUndefined();
    expect(toWorkspaceReflectionEvidence(reflection({ outcome: "policy_denied" }))).toBeUndefined();
    expect(toWorkspaceReflectionEvidence(reflection({ confidence: "low" }))).toBeUndefined();
    expect(toWorkspaceReflectionEvidence(reflection({
      retainAsMemoryEvidence: false,
      goalProgress: "none",
    }))).toBeUndefined();
  });

  it("stores duplicate reflection once and bounds evidence to 30, removing oldest first", () => {
    let memory = createDefaultWorkspaceMemory(now);
    const evidence = toWorkspaceReflectionEvidence(reflection(), now);
    expect(evidence).toBeDefined();

    let result = appendWorkspaceReflectionEvidence(memory, evidence!);
    expect(result.retained).toBe(true);
    result = appendWorkspaceReflectionEvidence(result.memory, evidence!);
    expect(result.retained).toBe(false);
    expect(result.memory.recentReflectionEvidence).toHaveLength(1);

    memory = result.memory;
    for (let index = 0; index < 35; index += 1) {
      const next = toWorkspaceReflectionEvidence(reflection({
        requestId: `request-${index}`,
        stepId: `step-${index}`,
        toolId: "tasks.list",
      }), new Date(now.getTime() + index * 1000));
      memory = appendWorkspaceReflectionEvidence(memory, next!).memory;
    }

    expect(memory.recentReflectionEvidence).toHaveLength(30);
    expect(memory.recentReflectionEvidence[0].requestId).toBe("request-5");
    expect(memory.recentReflectionEvidence[29].requestId).toBe("request-34");
  });

  it("migrates existing memory with defaults and sanitizes reflection evidence", () => {
    const memory = migrateWorkspaceMemory({
      version: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      recentReflectionEvidence: Array(40).fill(null).map((_, index) => ({
        id: `id-${index}`,
        requestId: `request-${index}`,
        stepId: `step-${index}`,
        toolId: "tasks.list",
        domain: "tasks",
        outcome: "successful",
        usefulness: "high",
        goalProgress: "supported",
        reflectedAt: now.toISOString(),
        retainedAt: now.toISOString(),
        schemaVersion: 1,
        rawOutput: { title: "Private task" },
      })),
    });

    expect(memory.recentReflectionEvidence).toHaveLength(30);
    expect(JSON.stringify(memory.recentReflectionEvidence)).not.toContain("Private task");
  });

  it("falls back on corrupt storage", () => {
    const storage = new MemoryStorage();
    storage.setItem(WORKSPACE_MEMORY_STORAGE_KEY, "{bad json");

    expect(loadWorkspaceMemory(storage).recentReflectionEvidence).toEqual([]);
  });

  it("persists retained evidence through processReadOnlyReflection without raw payloads", () => {
    const storage = new MemoryStorage();
    const sourceStep = step("tasks");
    const sourceWorkspace = workspace(sourceStep, goal("tasks"));
    const result = executionResult(sourceStep);
    const processed = processReadOnlyReflection({
      executionResult: result,
      auditRecords: auditRecords(result),
      step: sourceStep,
      toolResolution: resolution(sourceStep),
      workspace: sourceWorkspace,
      reflectedAt: now,
      storage,
    });

    expect(processed.reflection?.outcome).toBe("successful");
    expect(processed.memoryEvidenceRetained).toBe(true);
    const stored = loadWorkspaceMemory(storage);
    expect(stored.recentReflectionEvidence).toHaveLength(1);
    expect(JSON.stringify(stored)).not.toContain("Private task");
  });

  it("does not retain policy denial, timeout, failed execution, or invalid correlation", () => {
    const storage = new MemoryStorage();
    const sourceStep = step("tasks");
    const sourceWorkspace = workspace(sourceStep, goal("tasks"));

    for (const status of ["policy_denied", "timeout", "failed"] as const) {
      const processed = processReadOnlyReflection({
      executionResult: executionResult(sourceStep, status),
      auditRecords: auditRecords(executionResult(sourceStep, status)),
      step: sourceStep,
        toolResolution: resolution(sourceStep),
        workspace: sourceWorkspace,
        reflectedAt: now,
        storage,
      });
      expect(processed.memoryEvidenceRetained).toBe(false);
    }

    const wrongResult = { ...executionResult(sourceStep), stepId: "wrong-step" };
    const processed = processReadOnlyReflection({
      executionResult: wrongResult,
      auditRecords: auditRecords(wrongResult),
      step: sourceStep,
      toolResolution: resolution(sourceStep),
      workspace: sourceWorkspace,
      reflectedAt: now,
      storage,
    });
    expect(processed.reflection?.outcome).toBe("invalid");
    expect(processed.memoryEvidenceRetained).toBe(false);
  });

  it("memory write failure and missing workspace do not alter execution result in runtime", async () => {
    clearExecutionAuditRecords();
    const storage = new FailingStorage();
    const sourceStep = step("tasks");
    const runtimeResult = await runReadOnlyTool({
      requestId: "request-runtime-isolated",
      step: sourceStep,
      toolResolution: resolution(sourceStep),
      executionContext: {
        tasks: [{ id: "task-1", title: "Private task", completed: false, status: "open" }],
        workspace: workspace(sourceStep, goal("tasks")),
      },
      reflectionStorage: storage,
      currentTime: now,
    }, { now: () => now });
    const noWorkspaceResult = await runReadOnlyTool({
      requestId: "request-runtime-no-workspace",
      step: sourceStep,
      toolResolution: resolution(sourceStep),
      executionContext: {
        tasks: [{ id: "task-1", title: "Private task", completed: false, status: "open" }],
      },
      currentTime: now,
    }, { now: () => now });

    expect(runtimeResult.status).toBe("success");
    expect(runtimeResult.reflection?.outcome).toBe("successful");
    expect(runtimeResult.memoryEvidenceRetained).toBe(false);
    expect(noWorkspaceResult.status).toBe("success");
    expect(noWorkspaceResult.reflection).toBeUndefined();
  });

  it("one reflection has weak personalization effect and repeated recent reflections are bounded", () => {
    const baseMemory = createDefaultWorkspaceMemory(now);
    const one = appendWorkspaceReflectionEvidence(
      baseMemory,
      toWorkspaceReflectionEvidence(reflection(), now)!,
    ).memory;
    const repeated = [0, 1, 2, 3].reduce((memory, index) => appendWorkspaceReflectionEvidence(
      memory,
      toWorkspaceReflectionEvidence(reflection({
        requestId: `request-repeat-${index}`,
        stepId: `step-repeat-${index}`,
      }), new Date(now.getTime() + index * 1000))!,
    ).memory, baseMemory);
    const signals: WorkspaceSignal[] = [];
    const input = {
      now,
      tasks: [],
      events: [],
      transactions: [],
      habits: [],
      documents: [],
      learnAiActivity: null,
      loading: {
        tasks: false,
        events: false,
        finance: false,
        habits: false,
        documents: false,
        learnAi: false,
        chat: false,
      },
    };
    const oneInsights = memoryEngine({
      ...input,
      signals,
      existingMemory: one,
      chatSessions: [],
    }).memoryInsights;
    const repeatedInsights = memoryEngine({
      ...input,
      signals,
      existingMemory: repeated,
      chatSessions: [],
    }).memoryInsights;
    const onePersonalization = personalizationEngine(input, signals, oneInsights);
    const repeatedPersonalization = personalizationEngine(input, signals, repeatedInsights);

    expect(onePersonalization.domainAffinity.tasks).toBeLessThanOrEqual(2);
    expect(repeatedPersonalization.domainAffinity.tasks).toBeGreaterThan(onePersonalization.domainAffinity.tasks);
    expect(repeatedPersonalization.domainAffinity.tasks).toBeLessThanOrEqual(6);
  });

  it("urgent current signals and onboarding remain dominant", () => {
    const baseMemory = createDefaultWorkspaceMemory(now);
    const reflectedMemory = appendWorkspaceReflectionEvidence(
      baseMemory,
      toWorkspaceReflectionEvidence(reflection(), now)!,
    ).memory;
    const input = {
      now,
      tasks: [],
      events: [],
      transactions: [],
      habits: [],
      documents: [],
      learnAiActivity: null,
      loading: {
        tasks: false,
        events: false,
        finance: false,
        habits: false,
        documents: false,
        learnAi: false,
        chat: false,
      },
    };
    const insights = memoryEngine({
      ...input,
      signals: [],
      existingMemory: reflectedMemory,
      chatSessions: [],
    }).memoryInsights;
    const urgentSignals: WorkspaceSignal[] = [{
      id: "calendar:urgent",
      domain: "calendar",
      label: "Urgent calendar",
      score: 95,
      severity: "high",
      reason: "Current urgent signal.",
      count: 1,
      generatedAt: now.toISOString(),
    }];
    const onboardingSignals: WorkspaceSignal[] = [{
      id: "learning:onboarding",
      domain: "learning",
      label: "Onboarding",
      score: 20,
      severity: "low",
      reason: "Low data.",
      count: 0,
      generatedAt: now.toISOString(),
    }];

    const urgent = personalizationEngine(input, urgentSignals, insights);
    const onboarding = personalizationEngine(input, onboardingSignals, insights);

    expect(urgent.domainAffinity.calendar).toBeGreaterThan(urgent.domainAffinity.tasks);
    expect(onboarding.domainAffinity.tasks).toBe(0);
  });

  it("old reflection evidence decays out of personalization", () => {
    const oldDate = new Date("2026-05-01T09:00:00.000Z");
    const memory = appendWorkspaceReflectionEvidence(
      createDefaultWorkspaceMemory(oldDate),
      toWorkspaceReflectionEvidence(reflection({ generatedAt: oldDate.toISOString() }), oldDate)!,
    ).memory;
    const insights = memoryEngine({
      now,
      tasks: [],
      events: [],
      transactions: [],
      habits: [],
      documents: [],
      learnAiActivity: null,
      loading: {
        tasks: false,
        events: false,
        finance: false,
        habits: false,
        documents: false,
        learnAi: false,
        chat: false,
      },
      signals: [],
      existingMemory: memory,
      chatSessions: [],
    }).memoryInsights;

    expect(insights.recentReflectedDomains).toEqual([]);
  });
});
