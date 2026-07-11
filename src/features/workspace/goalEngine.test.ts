import { describe, expect, it } from "vitest";
import { goalEngine } from "./goalEngine";
import type {
  WorkspaceGoalEngineInput,
  WorkspaceInteractionFeedback,
  WorkspaceMemoryInsights,
  WorkspacePersonalizationModel,
  WorkspacePriorityModel,
  WorkspaceSignal,
  WorkspaceSignalDomain,
} from "./workspaceTypes";

const now = new Date("2026-07-10T09:00:00.000Z");

const emptyAffinity = {
  tasks: 0,
  calendar: 0,
  learning: 0,
  habits: 0,
  finance: 0,
  documents: 0,
};

const memoryInsights: WorkspaceMemoryInsights = {
  recentDomains: [],
  familiarDomains: [],
  preferredTimeDomains: [],
  repeatedActionPatterns: [],
  interactionDomains: [],
  confidence: "low",
  evidence: [],
};

const personalization: WorkspacePersonalizationModel = {
  domainAffinity: emptyAffinity,
  recentDomains: [],
  preferredDomains: [],
  confidence: "low",
  evidence: [],
  generatedAt: now.toISOString(),
};

const feedback: WorkspaceInteractionFeedback = {
  domainEngagement: emptyAffinity,
  actionEngagement: [],
  repeatedInteractionPatterns: [],
  avoidedDomains: [],
  recentInteractionDomains: [],
  preferredSources: {},
  confidence: "low",
  evidence: [],
  generatedAt: now.toISOString(),
};

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

function priority(
  primaryDomain: WorkspaceSignalDomain,
  secondaryDomains: WorkspaceSignalDomain[] = [],
  confidence: WorkspacePriorityModel["confidence"] = "medium",
): WorkspacePriorityModel {
  return {
    primaryDomain,
    secondaryDomains,
    missionTitle: "Existing priority title.",
    missionSummary: "Existing priority summary.",
    confidence,
    reasons: [`${primaryDomain} is the strongest current signal.`],
    orderedSignalIds: [`${primaryDomain}:signal`],
  };
}

function input(
  overrides: Partial<WorkspaceGoalEngineInput> = {},
): WorkspaceGoalEngineInput {
  return {
    now,
    signals: [signal("tasks")],
    priority: priority("tasks"),
    personalization,
    memoryInsights,
    interactionFeedback: feedback,
    ...overrides,
  };
}

describe("goalEngine", () => {
  it("generates exactly one proposed daily goal", () => {
    const goal = goalEngine(input());

    expect(goal).toMatchObject({
      status: "proposed",
      primaryDomain: "tasks",
    });
    expect(Array.isArray(goal.successCriteria)).toBe(true);
    expect(goal.successCriteria.length).toBeGreaterThan(0);
  });

  it("creates an honest onboarding goal when low-data onboarding is active", () => {
    const onboardingSignal: WorkspaceSignal = {
      ...signal("learning", "medium", 65),
      id: "learning:onboarding",
      reason: "More workspace signals are needed.",
    };

    const goal = goalEngine(
      input({
        signals: [signal("tasks"), onboardingSignal],
        priority: {
          ...priority("tasks"),
          orderedSignalIds: ["tasks:signal", "learning:onboarding"],
        },
      }),
    );

    expect(goal.primaryDomain).toBe("learning");
    expect(goal.title).toBe("Set up your SmartFlow workspace.");
    expect(goal.summary).toContain("honestly");
    expect(goal.constraints).toContain("Onboarding mode.");
  });

  it("creates a task goal for high-severity task priority", () => {
    const goal = goalEngine(input());

    expect(goal.title).toBe("Clear your most important active work.");
    expect(goal.successCriteria.join(" ")).toContain("2-3");
    expect(goal.constraints).toContain("Urgent work first.");
  });

  it("creates calendar, learning, and finance goals from primary priority", () => {
    expect(
      goalEngine(
        input({
          signals: [signal("calendar", "medium", 62)],
          priority: priority("calendar", ["tasks"], "medium"),
        }),
      ).title,
    ).toBe("Prepare the day around your scheduled commitments.");

    expect(
      goalEngine(
        input({
          signals: [signal("learning", "medium", 60)],
          priority: priority("learning", ["calendar"], "medium"),
        }),
      ).title,
    ).toBe("Continue your current learning path.");

    expect(
      goalEngine(
        input({
          signals: [signal("finance", "medium", 61)],
          priority: priority("finance", ["tasks"], "medium"),
        }),
      ).summary,
    ).toContain("without assuming a problem");
  });

  it("uses calm focus fallback when no signal is strong", () => {
    const goal = goalEngine(
      input({
        signals: [signal("learning", "low", 25)],
        priority: priority("learning", [], "low"),
      }),
    );

    expect(goal.title).toBe("Create one useful block of focused progress.");
    expect(goal.confidence).toBe("low");
  });

  it("limits supporting domains and effort", () => {
    const goal = goalEngine(
      input({
        signals: [
          signal("tasks", "high", 95),
          signal("calendar", "medium", 60),
          signal("learning", "medium", 58),
          signal("finance", "medium", 56),
        ],
        priority: priority("tasks", ["calendar", "learning", "finance"], "high"),
      }),
    );

    expect(goal.supportingDomains).toHaveLength(2);
    expect(goal.estimatedEffortMinutes).toBeLessThanOrEqual(90);
  });

  it("is conservative but can become high confidence with aligned evidence", () => {
    const lowGoal = goalEngine(
      input({
        signals: [signal("tasks", "medium", 55)],
        priority: priority("tasks", [], "low"),
      }),
    );
    const highGoal = goalEngine(
      input({
        signals: [signal("tasks", "high", 90), signal("calendar", "medium", 60)],
        priority: priority("tasks", ["calendar"], "high"),
        memoryInsights: { ...memoryInsights, confidence: "high" },
        personalization: { ...personalization, confidence: "high" },
        interactionFeedback: { ...feedback, confidence: "medium" },
      }),
    );

    expect(lowGoal.confidence).not.toBe("high");
    expect(highGoal.confidence).toBe("high");
  });

  it("does not mutate input and is deterministic for identical input", () => {
    const goalInput = input({
      signals: [signal("documents", "medium", 62)],
      priority: priority("documents", ["tasks"], "medium"),
    });
    const before = JSON.stringify(goalInput);

    const first = goalEngine(goalInput);
    const second = goalEngine(goalInput);

    expect(JSON.stringify(goalInput)).toBe(before);
    expect(second).toEqual(first);
  });
});
