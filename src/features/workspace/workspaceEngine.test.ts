import { describe, expect, it } from "vitest";
import { workspaceEngine } from "./workspaceEngine";
import type { WorkspaceEngineInput } from "./workspaceTypes";

const now = new Date("2026-07-16T09:00:00.000Z");

function baseInput(overrides: Partial<WorkspaceEngineInput> = {}): WorkspaceEngineInput {
  return {
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
    chatSessions: [],
    signals: [],
    decisionProfile: {
      version: 1,
      preferredDomains: [],
      avoidedDomains: [],
      reliableDomains: [],
      recentSuccessDomains: [],
      recentEmptyDomains: [],
      decisionConfidence: "low",
      lowData: true,
    },
    personalization: {
      domainAffinity: {
        tasks: 0,
        calendar: 0,
        learning: 0,
        habits: 0,
        finance: 0,
        documents: 0,
      },
      recentDomains: [],
      preferredDomains: [],
      confidence: "low",
      evidence: [],
      generatedAt: now.toISOString(),
    },
    priority: {
      primaryDomain: "tasks",
      secondaryDomains: [],
      missionTitle: "I prepared today's workspace.",
      missionSummary: "Start with the next steps I surfaced.",
      confidence: "low",
      reasons: [],
      orderedSignalIds: [],
    },
    interactionFeedback: {
      domainEngagement: {
        tasks: 0,
        calendar: 0,
        learning: 0,
        habits: 0,
        finance: 0,
        documents: 0,
      },
      actionEngagement: [],
      repeatedInteractionPatterns: [],
      avoidedDomains: [],
      recentInteractionDomains: [],
      preferredSources: {},
      confidence: "low",
      evidence: [],
      generatedAt: now.toISOString(),
    },
    goal: {
      id: "goal-1",
      title: "I prepared today's workspace.",
      summary: "Start with the next steps I surfaced.",
      primaryDomain: "tasks",
      supportingDomains: [],
      successCriteria: [],
      estimatedEffortMinutes: 15,
      confidence: "low",
      reasons: [],
      constraints: [],
      generatedAt: now.toISOString(),
      sourceSignalIds: [],
      sourcePriorityDomains: ["tasks"],
      status: "proposed",
    },
    plan: {
      id: "plan-1",
      goalId: "goal-1",
      title: "Workspace plan",
      summary: "Review the workspace.",
      status: "proposed",
      steps: [],
      totalEstimatedMinutes: 0,
      confidence: "low",
      constraints: [],
      reasons: [],
      generatedAt: now.toISOString(),
      sourceGoal: {
        id: "goal-1",
        title: "I prepared today's workspace.",
        summary: "Start with the next steps I surfaced.",
        primaryDomain: "tasks",
        supportingDomains: [],
        successCriteria: [],
        estimatedEffortMinutes: 15,
        confidence: "low",
        reasons: [],
        constraints: [],
        generatedAt: now.toISOString(),
        sourceSignalIds: [],
        sourcePriorityDomains: ["tasks"],
        status: "proposed",
      },
      sourceSignalIds: [],
    },
    toolResolutions: [],
    approval: {
      planId: "plan-1",
      goalId: "goal-1",
      overallStatus: "not_required",
      stepApprovals: [],
      approvalScope: "view_only",
      requiresUserApproval: false,
      approvalSummary: "No approval required.",
      riskLevel: "none",
      generatedAt: now.toISOString(),
      reasons: [],
    },
    ...overrides,
  };
}

describe("workspaceEngine agent context", () => {
  it("does not expose static learning lessons when no learning activity exists", () => {
    const workspace = workspaceEngine(baseInput({ learnAiActivity: null }));

    expect(workspace.agentContext.learningProgress?.lessons).toEqual([]);
  });

  it("bounds learning lessons to the available learning activity count", () => {
    const workspace = workspaceEngine(baseInput({
      learnAiActivity: {
        totalQuestions: 2,
        lastQuestion: {
          content: "Review learning",
          mode: "learning",
          createdAt: now.toISOString(),
        },
        mostActiveMode: { mode: "learning", count: 2 },
      },
    }));

    expect(workspace.agentContext.learningProgress?.lessons).toHaveLength(2);
    expect(workspace.agentContext.learningProgress?.totalQuestions).toBe(2);
  });
});
