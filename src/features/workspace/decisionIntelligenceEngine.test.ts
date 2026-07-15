import { describe, expect, it } from "vitest";
import { decisionIntelligenceEngine } from "./decisionIntelligenceEngine";
import { goalEngine } from "./goalEngine";
import { personalizationEngine } from "./personalizationEngine";
import { plannerEngine } from "./plannerEngine";
import { priorityEngine } from "./priorityEngine";
import { createDefaultWorkspaceMemory } from "./workspaceMemoryStorage";
import type {
  WorkspaceDecisionProfile,
  WorkspaceInteractionFeedback,
  WorkspaceMemory,
  WorkspacePriorityModel,
  WorkspaceReflectionEvidence,
  WorkspaceSignal,
  WorkspaceSignalDomain,
  WorkspaceSignalEngineInput,
} from "./workspaceTypes";

const now = new Date("2026-07-10T09:00:00.000Z");

const loading = {
  tasks: false,
  events: false,
  finance: false,
  habits: false,
  documents: false,
  learnAi: false,
  chat: false,
};

const emptyAffinity = {
  tasks: 0,
  calendar: 0,
  learning: 0,
  habits: 0,
  finance: 0,
  documents: 0,
};

const baseInput: WorkspaceSignalEngineInput = {
  now,
  tasks: [],
  events: [],
  transactions: [],
  habits: [],
  documents: [],
  learnAiActivity: null,
  loading,
};

const interactionFeedback: WorkspaceInteractionFeedback = {
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
  severity: WorkspaceSignal["severity"] = "medium",
  score = 60,
): WorkspaceSignal {
  return {
    id: `${domain}:signal`,
    domain,
    label: `${domain} signal`,
    score,
    severity,
    reason: `${domain} needs attention.`,
    count: 2,
    generatedAt: now.toISOString(),
  };
}

function evidence(
  domain: WorkspaceSignalDomain,
  outcome: WorkspaceReflectionEvidence["outcome"],
  reflectedAt: string,
  index: number,
): WorkspaceReflectionEvidence {
  return {
    id: `reflection-${domain}-${outcome}-${index}`,
    requestId: `request-${domain}-${outcome}-${index}`,
    stepId: `step-${domain}-${index}`,
    toolId: `${domain}.list`,
    domain,
    outcome,
    usefulness: "high",
    goalProgress: "supported",
    reflectedAt,
    retainedAt: reflectedAt,
    schemaVersion: 1,
  };
}

function memoryWithEvidence(items: WorkspaceReflectionEvidence[]): WorkspaceMemory {
  return {
    ...createDefaultWorkspaceMemory(now),
    recentReflectionEvidence: items,
  };
}

function profile(
  overrides: Partial<WorkspaceDecisionProfile> = {},
): WorkspaceDecisionProfile {
  return {
    version: 1,
    preferredDomains: [],
    avoidedDomains: [],
    reliableDomains: [],
    recentSuccessDomains: [],
    recentEmptyDomains: [],
    decisionConfidence: "low",
    lowData: true,
    ...overrides,
  };
}

function priority(
  primaryDomain: WorkspaceSignalDomain,
): WorkspacePriorityModel {
  return {
    primaryDomain,
    secondaryDomains: [],
    missionTitle: "Mission",
    missionSummary: "Summary",
    confidence: "medium",
    reasons: [`${primaryDomain} is active.`],
    orderedSignalIds: [`${primaryDomain}:signal`],
  };
}

describe("decisionIntelligenceEngine", () => {
  it("returns low-data profile when reflection and interaction evidence are insufficient", () => {
    const result = decisionIntelligenceEngine({
      now,
      memory: createDefaultWorkspaceMemory(now),
      interactionFeedback,
      signals: [],
    });

    expect(result).toEqual({
      version: 1,
      preferredDomains: [],
      avoidedDomains: [],
      reliableDomains: [],
      recentSuccessDomains: [],
      recentEmptyDomains: [],
      decisionConfidence: "low",
      lowData: true,
    });
  });

  it("does not turn one successful reflection into a preference", () => {
    const result = decisionIntelligenceEngine({
      now,
      memory: memoryWithEvidence([
        evidence("learning", "successful", "2026-07-09T09:00:00.000Z", 1),
      ]),
      interactionFeedback,
      signals: [signal("learning")],
    });

    expect(result.lowData).toBe(true);
    expect(result.preferredDomains).toEqual([]);
  });

  it("derives preferred and reliable domains from repeated successful reflection", () => {
    const result = decisionIntelligenceEngine({
      now,
      memory: memoryWithEvidence([
        evidence("learning", "successful", "2026-07-09T09:00:00.000Z", 1),
        evidence("learning", "successful", "2026-07-08T09:00:00.000Z", 2),
        evidence("tasks", "successful", "2026-07-07T09:00:00.000Z", 3),
        evidence("tasks", "successful", "2026-07-06T09:00:00.000Z", 4),
      ]),
      interactionFeedback,
      signals: [signal("learning"), signal("tasks")],
    });

    expect(result.lowData).toBe(false);
    expect(result.preferredDomains).toContain("learning");
    expect(result.reliableDomains).toContain("learning");
    expect(result.recentSuccessDomains).toContain("tasks");
    expect(result.decisionConfidence).toBe("medium");
  });

  it("derives recent empty domains from repeated empty reflection", () => {
    const result = decisionIntelligenceEngine({
      now,
      memory: memoryWithEvidence([
        evidence("documents", "empty", "2026-07-09T09:00:00.000Z", 1),
        evidence("documents", "empty", "2026-07-08T09:00:00.000Z", 2),
      ]),
      interactionFeedback,
      signals: [signal("documents", "medium", 60)],
    });

    expect(result.lowData).toBe(false);
    expect(result.avoidedDomains).toEqual(["documents"]);
    expect(result.recentEmptyDomains).toEqual(["documents"]);
  });

  it("handles mixed evidence by preferring success-dominant domains only", () => {
    const result = decisionIntelligenceEngine({
      now,
      memory: memoryWithEvidence([
        evidence("learning", "successful", "2026-07-09T09:00:00.000Z", 1),
        evidence("learning", "successful", "2026-07-08T09:00:00.000Z", 2),
        evidence("learning", "empty", "2026-07-07T09:00:00.000Z", 3),
        evidence("finance", "empty", "2026-07-06T09:00:00.000Z", 4),
        evidence("finance", "empty", "2026-07-05T09:00:00.000Z", 5),
      ]),
      interactionFeedback,
      signals: [signal("learning"), signal("finance")],
    });

    expect(result.preferredDomains).toContain("learning");
    expect(result.avoidedDomains).toContain("finance");
    expect(result.preferredDomains).not.toContain("finance");
  });

  it("ignores reflection evidence older than 90 days", () => {
    const result = decisionIntelligenceEngine({
      now,
      memory: memoryWithEvidence([
        evidence("learning", "successful", "2026-03-01T09:00:00.000Z", 1),
        evidence("learning", "successful", "2026-03-02T09:00:00.000Z", 2),
      ]),
      interactionFeedback,
      signals: [signal("learning")],
    });

    expect(result.lowData).toBe(true);
    expect(result.preferredDomains).toEqual([]);
  });

  it("keeps confidence bounded", () => {
    const items = Array.from({ length: 12 }, (_, index) =>
      evidence(
        index % 2 === 0 ? "learning" : "tasks",
        "successful",
        `2026-07-${String(1 + index).padStart(2, "0")}T09:00:00.000Z`,
        index,
      ),
    );

    const result = decisionIntelligenceEngine({
      now,
      memory: memoryWithEvidence(items),
      interactionFeedback,
      signals: [signal("learning"), signal("tasks")],
    });

    expect(["low", "medium", "high"]).toContain(result.decisionConfidence);
    expect(result.preferredDomains.length).toBeLessThanOrEqual(4);
  });

  it("does not mark a high-severity current domain as avoided", () => {
    const result = decisionIntelligenceEngine({
      now,
      memory: memoryWithEvidence([
        evidence("tasks", "empty", "2026-07-09T09:00:00.000Z", 1),
        evidence("tasks", "empty", "2026-07-08T09:00:00.000Z", 2),
      ]),
      interactionFeedback,
      signals: [signal("tasks", "high", 92)],
    });

    expect(result.avoidedDomains).not.toContain("tasks");
  });

  it("lets priority use decision evidence only for medium and low tie-breaking", () => {
    const decisionProfile = profile({
      lowData: false,
      preferredDomains: ["learning"],
      reliableDomains: ["learning"],
      decisionConfidence: "high",
    });
    const personalization = personalizationEngine(
      baseInput,
      [signal("tasks", "high", 90), signal("learning", "medium", 65)],
      undefined,
      interactionFeedback,
      decisionProfile,
    );

    const urgentPriority = priorityEngine(
      [signal("tasks", "high", 90), signal("learning", "medium", 65)],
      personalization,
      interactionFeedback,
      decisionProfile,
    );
    const tiePriority = priorityEngine(
      [signal("tasks", "medium", 60), signal("learning", "medium", 60)],
      personalization,
      interactionFeedback,
      decisionProfile,
    );

    expect(urgentPriority.primaryDomain).toBe("tasks");
    expect(tiePriority.primaryDomain).toBe("learning");
  });

  it("can contribute advisory goal input without overriding urgent work", () => {
    const decisionProfile = profile({
      lowData: false,
      preferredDomains: ["learning"],
      reliableDomains: ["learning"],
      decisionConfidence: "medium",
    });
    const goal = goalEngine({
      now,
      signals: [signal("tasks", "high", 90), signal("learning", "medium", 60)],
      priority: priority("tasks"),
      personalization: {
        domainAffinity: emptyAffinity,
        recentDomains: [],
        preferredDomains: ["learning"],
        confidence: "medium",
        evidence: [],
        generatedAt: now.toISOString(),
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
      interactionFeedback,
      decisionProfile,
    });

    expect(goal.primaryDomain).toBe("tasks");
    expect(goal.constraints).toContain("Urgent work first.");
  });

  it("provides planner input as advisory metadata without changing step count", () => {
    const goal = goalEngine({
      now,
      signals: [signal("learning", "medium", 60)],
      priority: priority("learning"),
      personalization: {
        domainAffinity: emptyAffinity,
        recentDomains: [],
        preferredDomains: [],
        confidence: "low",
        evidence: [],
        generatedAt: now.toISOString(),
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
      interactionFeedback,
      decisionProfile: profile({
        lowData: false,
        reliableDomains: ["learning"],
        decisionConfidence: "medium",
      }),
    });
    const plan = plannerEngine({
      now,
      goal,
      signals: [signal("learning", "medium", 60)],
      decisionProfile: profile({
        lowData: false,
        reliableDomains: ["learning"],
        decisionConfidence: "medium",
      }),
    });

    expect(plan.steps.length).toBeGreaterThanOrEqual(2);
    expect(plan.constraints).toContain(
      "Decision intelligence may only weakly guide ordering.",
    );
    expect(plan.reasons).toContain(
      "Decision intelligence found repeated successful evidence for this plan domain.",
    );
  });

  it("does not mutate memory, interaction feedback, or signals", () => {
    const memory = memoryWithEvidence([
      evidence("learning", "successful", "2026-07-09T09:00:00.000Z", 1),
      evidence("learning", "successful", "2026-07-08T09:00:00.000Z", 2),
    ]);
    const signals = [signal("learning")];
    const before = JSON.stringify({ memory, interactionFeedback, signals });

    decisionIntelligenceEngine({
      now,
      memory,
      interactionFeedback,
      signals,
    });

    expect(JSON.stringify({ memory, interactionFeedback, signals })).toBe(before);
  });
});
