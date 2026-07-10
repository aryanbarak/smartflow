import { describe, expect, it } from "vitest";
import { interactionFeedbackEngine } from "./interactionFeedbackEngine";
import { personalizationEngine } from "./personalizationEngine";
import { priorityEngine } from "./priorityEngine";
import { createDefaultWorkspaceMemory } from "./workspaceMemoryStorage";
import type {
  WorkspaceDataLoadingState,
  WorkspaceMemory,
  WorkspaceSignal,
  WorkspaceSignalEngineInput,
} from "./workspaceTypes";
import type { WorkspaceInteractionEvent } from "./workspaceInteractionTypes";

const now = new Date("2026-07-10T09:00:00.000Z");

const loading: WorkspaceDataLoadingState = {
  tasks: false,
  events: false,
  finance: false,
  habits: false,
  documents: false,
  learnAi: false,
  chat: false,
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

const taskSignal: WorkspaceSignal = {
  id: "tasks:many-open",
  domain: "tasks",
  label: "Many open tasks",
  score: 90,
  severity: "high",
  reason: "Many tasks need attention.",
  count: 8,
  generatedAt: now.toISOString(),
};

const learningSignal: WorkspaceSignal = {
  id: "learning:active-history",
  domain: "learning",
  label: "Active learning history",
  score: 58,
  severity: "medium",
  reason: "Learning history can guide recommendations.",
  count: 7,
  generatedAt: now.toISOString(),
};

function interaction(
  overrides: Partial<WorkspaceInteractionEvent>,
): WorkspaceInteractionEvent {
  return {
    id: overrides.id ?? "interaction",
    type: overrides.type ?? "learning_continued",
    domain: overrides.domain ?? "learning",
    targetId: overrides.targetId ?? "Sorting Algorithms",
    targetTitle: overrides.targetTitle ?? "Sorting Algorithms",
    source: overrides.source ?? "right_rail_learning",
    occurredAt: overrides.occurredAt ?? "2026-07-10T08:00:00.000Z",
    schemaVersion: 1,
  };
}

function memoryWithInteractions(
  interactions: WorkspaceInteractionEvent[],
): WorkspaceMemory {
  const memory = createDefaultWorkspaceMemory(now);
  memory.recentInteractions = interactions;
  return memory;
}

describe("interactionFeedbackEngine", () => {
  it("returns neutral feedback for empty interaction history", () => {
    const feedback = interactionFeedbackEngine(createDefaultWorkspaceMemory(now), now);

    expect(feedback.recentInteractionDomains).toEqual([]);
    expect(feedback.repeatedInteractionPatterns).toEqual([]);
    expect(feedback.avoidedDomains).toEqual([]);
    expect(feedback.confidence).toBe("low");
  });

  it("keeps one click as minimal influence", () => {
    const feedback = interactionFeedbackEngine(
      memoryWithInteractions([interaction({ id: "one-click" })]),
      now,
    );

    expect(feedback.domainEngagement.learning).toBeLessThanOrEqual(2);
    expect(feedback.repeatedInteractionPatterns).toEqual([]);
  });

  it("turns repeated clicks into bounded weak influence", () => {
    const feedback = interactionFeedbackEngine(
      memoryWithInteractions([
        interaction({ id: "learning-1" }),
        interaction({
          id: "learning-2",
          type: "learning_continued",
          source: "hero",
          targetId: "Study With Me",
          targetTitle: "Study With Me",
        }),
      ]),
      now,
    );

    expect(feedback.domainEngagement.learning).toBeGreaterThan(8);
    expect(feedback.domainEngagement.learning).toBeLessThanOrEqual(35);
    expect(feedback.repeatedInteractionPatterns.length).toBeGreaterThan(0);
    expect(feedback.preferredSources.hero).toBeGreaterThan(0);
  });

  it("decays old interactions and ignores interactions older than 30 days", () => {
    const recent = interaction({
      id: "recent",
      occurredAt: "2026-07-09T09:00:00.000Z",
    });
    const old = interaction({
      id: "old",
      occurredAt: "2026-05-01T09:00:00.000Z",
    });

    const feedback = interactionFeedbackEngine(
      memoryWithInteractions([recent, old]),
      now,
    );

    expect(feedback.actionEngagement.map((item) => item.targetId)).not.toContain("old");
    expect(feedback.domainEngagement.learning).toBeLessThanOrEqual(2);
  });

  it("uses only explicit dismissals as weak avoidance evidence", () => {
    const neutral = interactionFeedbackEngine(createDefaultWorkspaceMemory(now), now);
    const dismissed = interactionFeedbackEngine(
      memoryWithInteractions([
        interaction({
          id: "dismiss-1",
          type: "action_dismissed",
          domain: "finance",
          targetId: "Review budget",
          targetTitle: "Review budget",
          source: "suggested_actions",
        }),
        interaction({
          id: "dismiss-2",
          type: "action_dismissed",
          domain: "finance",
          targetId: "Review budget",
          targetTitle: "Review budget",
          source: "suggested_actions",
        }),
      ]),
      now,
    );

    expect(neutral.avoidedDomains).toEqual([]);
    expect(dismissed.avoidedDomains).toContain("finance");
  });

  it("does not mutate input memory", () => {
    const memory = memoryWithInteractions([interaction({ id: "immutable" })]);
    const before = JSON.stringify(memory);

    interactionFeedbackEngine(memory, now);

    expect(JSON.stringify(memory)).toBe(before);
  });

  it("keeps urgent current signals dominant", () => {
    const feedback = interactionFeedbackEngine(
      memoryWithInteractions([
        interaction({ id: "learning-1" }),
        interaction({ id: "learning-2", type: "skill_opened", source: "hero" }),
      ]),
      now,
    );
    const personalization = personalizationEngine(
      baseInput,
      [taskSignal, learningSignal],
      undefined,
      feedback,
    );
    const priority = priorityEngine(
      [taskSignal, learningSignal],
      personalization,
      feedback,
    );

    expect(priority.primaryDomain).toBe("tasks");
  });

  it("keeps low-data onboarding unchanged", () => {
    const onboardingSignal: WorkspaceSignal = {
      id: "learning:onboarding",
      domain: "learning",
      label: "Onboarding needed",
      score: 65,
      severity: "medium",
      reason: "More workspace signals are needed.",
      count: 0,
      generatedAt: now.toISOString(),
    };
    const feedback = interactionFeedbackEngine(
      memoryWithInteractions([
        interaction({
          id: "finance-1",
          type: "skill_opened",
          domain: "finance",
          targetId: "Review Finances",
          targetTitle: "Review Finances",
          source: "hero",
        }),
        interaction({
          id: "finance-2",
          type: "recommendation_opened",
          domain: "finance",
          targetId: "Review budget",
          targetTitle: "Review budget",
          source: "right_rail_recommendations",
        }),
      ]),
      now,
    );
    const personalization = personalizationEngine(
      baseInput,
      [taskSignal, onboardingSignal],
      undefined,
      feedback,
    );
    const priority = priorityEngine(
      [taskSignal, onboardingSignal],
      personalization,
      feedback,
    );

    expect(priority.primaryDomain).toBe("learning");
    expect(priority.missionTitle).toBe("Set up your workspace.");
  });
});
