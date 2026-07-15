import { describe, expect, it } from "vitest";
import {
  CONTEXT_SYNTHESIS_VERSION,
  synthesizeContext,
  type ContextSynthesisInput,
} from "./contextSynthesis";
import type { AgentReflectionResult } from "./reflectionTypes";
import type { WorkspaceDecisionProfile } from "../workspace/workspaceTypes";

function input(overrides: Partial<ContextSynthesisInput> = {}): ContextSynthesisInput {
  return {
    toolId: "tasks.list",
    executionStatus: "success",
    safeRuntimeSummary: "6 active tasks found.",
    safePreviewItems: ["Visible task"],
    responseLanguage: "en",
    generatedAt: "2026-07-16T08:00:00.000Z",
    workspaceContext: {
      activeTaskCount: 6,
      dueTodayCount: 1,
      unscheduledTaskCount: 3,
      completedThisWeekCount: 4,
      todayEventCount: 0,
      currentGoalTitle: "Clear active work",
      currentPrimaryDomain: "tasks",
      learningActiveCount: 2,
    },
    ...overrides,
  };
}

const decisionProfile: WorkspaceDecisionProfile = {
  version: 1,
  preferredDomains: ["learning"],
  avoidedDomains: ["calendar"],
  reliableDomains: ["learning"],
  recentSuccessDomains: ["learning"],
  recentEmptyDomains: [],
  decisionConfidence: "medium",
  lowData: false,
};

function reflection(domain: "tasks" | "learning", count: number): AgentReflectionResult {
  return {
    id: "reflection-1",
    requestId: "request-secret",
    stepId: "step-secret",
    goalId: "goal-1",
    toolId: domain === "tasks" ? "tasks.list" : "learning.get_progress",
    outcome: "successful",
    usefulness: "medium",
    goalProgress: "informed",
    stepAssessment: "information_gathered",
    confidence: "high",
    summary: "Safe reflection summary",
    evidence: Array.from({ length: count }, (_, index) => ({
      toolId: domain === "tasks" ? "tasks.list" : "learning.get_progress",
      domain,
      outcome: "successful",
      usefulness: "medium",
      goalProgress: "informed",
      itemCount: 1,
      timestamp: `2026-07-16T08:0${index}:00.000Z`,
    })),
    retainAsMemoryEvidence: true,
    generatedAt: "2026-07-16T08:00:00.000Z",
    reflectionVersion: "reflection-engine-v1",
  };
}

describe("contextSynthesis", () => {
  it("combines due and open task counts correctly", () => {
    const result = synthesizeContext(input());

    expect(result.primaryFact).toBe("1 of your 6 open tasks is due today.");
    expect(result.evidenceDomains).toEqual(["tasks"]);
    expect(result.synthesisVersion).toBe(CONTEXT_SYNTHESIS_VERSION);
  });

  it("uses completed-week context factually", () => {
    const result = synthesizeContext(input());

    expect(result.supportingFacts).toContain("You completed 4 tasks this week and have 1 due today.");
    expect(result.supportingFacts.join(" ")).not.toMatch(/productive|lazy|disciplined|inconsistent/i);
  });

  it("adds a safe unscheduled-task suggestion", () => {
    const result = synthesizeContext(input());

    expect(result.supportingFacts).toContain("3 open tasks do not have due dates.");
    expect(result.safeSuggestion).toBe("You may want to add due dates to those tasks.");
  });

  it("combines empty calendar with due task into a bounded insight", () => {
    const result = synthesizeContext(input({
      toolId: "calendar.list_today",
      safeRuntimeSummary: "No events today.",
    }));

    expect(result.primaryFact).toBe("Your calendar is open today, while 1 task is due.");
    expect(result.safeSuggestion).toBe("You could use the open calendar for focused work.");
    expect(result.evidenceDomains).toEqual(["calendar", "tasks"]);
  });

  it("combines learning result with learning goal factually", () => {
    const result = synthesizeContext(input({
      toolId: "learning.get_progress",
      safeRuntimeSummary: "2 learning items found.",
      workspaceContext: {
        ...input().workspaceContext,
        currentPrimaryDomain: "learning",
        learningActiveCount: 2,
      },
    }));

    expect(result.primaryFact).toBe("Learning is part of today's goal, and 2 active items are ready to continue.");
    expect(result.safeSuggestion).toBe("You can continue the most recent learning item.");
  });

  it("ignores low-data decision profile and avoided domains", () => {
    const result = synthesizeContext(input({
      toolId: "learning.get_progress",
      safeRuntimeSummary: "2 learning items found.",
      decisionProfile: {
        ...decisionProfile,
        lowData: true,
        decisionConfidence: "high",
      },
      workspaceContext: {
        ...input().workspaceContext,
        currentPrimaryDomain: "learning",
      },
    }));

    expect(result.supportingFacts.join(" ")).not.toContain("recurring");
    expect(result.supportingFacts.join(" ")).not.toMatch(/avoid|dislike|negative|calendar/i);
  });

  it("does not turn one reflection into a behavioral claim", () => {
    const result = synthesizeContext(input({
      reflection: reflection("tasks", 1),
      decisionProfile,
    }));

    expect(result.supportingFacts.join(" ")).not.toContain("recurring");
    expect(result.supportingFacts.join(" ")).not.toContain("prefer");
  });

  it("allows repeated valid evidence to create neutral continuity wording", () => {
    const result = synthesizeContext(input({
      toolId: "learning.get_progress",
      safeRuntimeSummary: "2 learning items found.",
      reflection: reflection("learning", 2),
      decisionProfile,
      workspaceContext: {
        ...input().workspaceContext,
        currentPrimaryDomain: "learning",
      },
    }));

    expect(result.supportingFacts).toContain("Learning has been a recurring part of your recent activity.");
  });

  it("suppresses synthesis when runtime and workspace counts conflict", () => {
    const result = synthesizeContext(input({
      safeRuntimeSummary: "0 active tasks found.",
      workspaceContext: {
        ...input().workspaceContext,
        activeTaskCount: 6,
      },
    }));

    expect(result.primaryFact).toBeUndefined();
    expect(result.supportingFacts).toEqual([]);
    expect(result.confidence).toBe("low");
  });

  it("keeps runtime authoritative and omits disputed calendar insight", () => {
    const result = synthesizeContext(input({
      toolId: "calendar.list_today",
      safeRuntimeSummary: "No events today.",
      workspaceContext: {
        ...input().workspaceContext,
        todayEventCount: 2,
      },
    }));

    expect(result.primaryFact).toBeUndefined();
    expect(result.safeSuggestion).toBeUndefined();
    expect(result.confidence).toBe("low");
  });

  it("does not expose raw internal metadata", () => {
    const result = synthesizeContext(input({
      toolId: "workspace.get_context",
      safeRuntimeSummary: "requestId: req-1 Workspace context loaded.",
      workspaceContext: {
        ...input().workspaceContext,
        currentGoalTitle: "schema: private Clear work",
        currentPrimaryDomain: "tasks",
      },
    }));
    const rendered = [
      result.primaryFact,
      ...result.supportingFacts,
      result.derivedInsight,
      result.safeSuggestion,
    ].join(" ");

    expect(rendered).not.toContain("req-1");
    expect(rendered).not.toContain("schema");
  });

  it("does not mutate inputs and is deterministic", () => {
    const source = input();
    const before = JSON.stringify(source);

    const first = synthesizeContext(source);
    const second = synthesizeContext(source);

    expect(JSON.stringify(source)).toBe(before);
    expect(second).toEqual(first);
  });

  it("returns no insight for unsupported tools and non-success status", () => {
    expect(synthesizeContext(input({ toolId: "documents.search" })).supportingFacts).toEqual([]);
    expect(synthesizeContext(input({ executionStatus: "failed" })).primaryFact).toBeUndefined();
  });
});
