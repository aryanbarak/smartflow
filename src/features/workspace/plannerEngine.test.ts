import { describe, expect, it } from "vitest";
import { plannerEngine } from "./plannerEngine";
import type {
  WorkspaceGoal,
  WorkspacePlannerEngineInput,
  WorkspacePriorityConfidence,
  WorkspaceSignal,
  WorkspaceSignalDomain,
} from "./workspaceTypes";

const now = new Date("2026-07-10T09:00:00.000Z");

function signal(
  domain: WorkspaceSignalDomain,
  severity: WorkspaceSignal["severity"] = "high",
  score = 82,
): WorkspaceSignal {
  return {
    id: `${domain}:signal`,
    domain,
    label: `${domain} signal`,
    score,
    severity,
    reason: `${domain} needs attention.`,
    count: 3,
    generatedAt: now.toISOString(),
  };
}

function goal(
  primaryDomain: WorkspaceSignalDomain,
  overrides: Partial<WorkspaceGoal> = {},
): WorkspaceGoal {
  return {
    id: `goal:${primaryDomain}:2026-07-10`,
    title:
      primaryDomain === "tasks"
        ? "Clear your most important active work."
        : `Goal for ${primaryDomain}`,
    summary: `Work on ${primaryDomain}.`,
    primaryDomain,
    supportingDomains: ["calendar"],
    successCriteria: ["Make progress.", "Review the result."],
    estimatedEffortMinutes: 75,
    confidence: "medium",
    reasons: [`${primaryDomain} is the strongest current signal.`],
    constraints: ["No autonomous execution."],
    generatedAt: now.toISOString(),
    sourceSignalIds: [`${primaryDomain}:signal`],
    sourcePriorityDomains: [primaryDomain, "calendar"],
    status: "proposed",
    ...overrides,
  };
}

function input(
  primaryDomain: WorkspaceSignalDomain,
  overrides: Partial<WorkspacePlannerEngineInput> = {},
): WorkspacePlannerEngineInput {
  return {
    now,
    goal: goal(primaryDomain),
    signals: [signal(primaryDomain)],
    ...overrides,
  };
}

function confidenceRank(confidence: WorkspacePriorityConfidence) {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}

describe("plannerEngine", () => {
  it("creates a small deterministic proposed plan", () => {
    const planInput = input("tasks");
    const first = plannerEngine(planInput);
    const second = plannerEngine(planInput);

    expect(first).toEqual(second);
    expect(first.status).toBe("proposed");
    expect(first.steps.length).toBeGreaterThanOrEqual(2);
    expect(first.steps.length).toBeLessThanOrEqual(4);
    expect(first.steps.every((step) => step.status === "proposed")).toBe(true);
  });

  it("creates a task plan aligned to active work", () => {
    const plan = plannerEngine(input("tasks"));

    expect(plan.steps.map((step) => step.title)).toEqual([
      "Review active work",
      "Select the top two items",
      "Complete one focused work block",
      "Review what remains",
    ]);
    expect(plan.steps.every((step) => step.domain === "tasks")).toBe(true);
  });

  it("creates calendar, learning, and finance plans", () => {
    expect(plannerEngine(input("calendar")).steps[0]?.title).toBe(
      "Review today's events",
    );
    expect(plannerEngine(input("learning")).steps[0]?.title).toBe(
      "Resume the latest lesson",
    );
    expect(plannerEngine(input("finance")).steps[0]?.description).toContain(
      "without assuming a problem",
    );
  });

  it("creates onboarding and calm-focus fallback plans", () => {
    const onboarding = plannerEngine(
      input("learning", {
        goal: goal("learning", {
          title: "Set up your SmartFlow workspace.",
          constraints: ["Onboarding mode.", "No autonomous execution."],
          estimatedEffortMinutes: 30,
        }),
        signals: [signal("learning", "medium", 65)],
      }),
    );
    const calm = plannerEngine(
      input("learning", {
        goal: goal("learning", {
          title: "Create one useful block of focused progress.",
          estimatedEffortMinutes: 25,
          confidence: "low",
        }),
        signals: [signal("learning", "low", 25)],
      }),
    );

    expect(onboarding.steps[0]?.title).toBe("Open Tasks");
    expect(onboarding.totalEstimatedMinutes).toBeLessThanOrEqual(30);
    expect(calm.steps.map((step) => step.title)).toEqual([
      "Choose one useful task",
      "Work without interruption",
      "Review the result",
    ]);
  });

  it("keeps total and step effort within bounds", () => {
    const plan = plannerEngine(
      input("tasks", {
        goal: goal("tasks", { estimatedEffortMinutes: 30 }),
      }),
    );
    const allowed = [5, 10, 15, 20, 25, 30, 45];

    expect(plan.totalEstimatedMinutes).toBeLessThanOrEqual(30);
    expect(plan.totalEstimatedMinutes).toBeLessThanOrEqual(90);
    expect(
      plan.steps.every(
        (step) =>
          step.estimatedMinutes >= 5 &&
          step.estimatedMinutes <= 45 &&
          allowed.includes(step.estimatedMinutes),
      ),
    ).toBe(true);
  });

  it("uses simple linear dependencies without cycles", () => {
    const plan = plannerEngine(input("tasks"));
    const stepIds = new Set(plan.steps.map((step) => step.id));

    expect(plan.steps[0]?.dependencies).toEqual([]);
    for (const step of plan.steps.slice(1)) {
      expect(step.dependencies).toHaveLength(1);
      expect(stepIds.has(step.dependencies[0])).toBe(true);
      expect(step.dependencies).not.toContain(step.id);
    }
  });

  it("never raises plan confidence above goal confidence", () => {
    const high = plannerEngine(
      input("tasks", { goal: goal("tasks", { confidence: "high" }) }),
    );
    const missingSignal = plannerEngine(
      input("documents", {
        goal: goal("documents", { confidence: "high" }),
        signals: [],
      }),
    );

    expect(confidenceRank(high.confidence)).toBeLessThanOrEqual(
      confidenceRank(high.sourceGoal.confidence),
    );
    expect(missingSignal.confidence).toBe("medium");
  });

  it("does not mutate input or execute side effects", () => {
    const planInput = input("calendar");
    const before = JSON.stringify(planInput);
    const plan = plannerEngine(planInput);

    expect(JSON.stringify(planInput)).toBe(before);
    expect(plan.constraints).toContain("Planner V1 proposes steps only.");
    expect(plan.constraints).toContain("No tools or workspace data are modified.");
    expect(plan.steps.some((step) => step.actionType === "update")).toBe(false);
    expect(plan.steps.some((step) => step.actionType === "complete")).toBe(false);
  });
});
