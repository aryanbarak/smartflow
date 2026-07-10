import { describe, expect, it } from "vitest";
import { memoryEngine } from "./memoryEngine";
import { personalizationEngine } from "./personalizationEngine";
import { priorityEngine } from "./priorityEngine";
import { createDefaultWorkspaceMemory } from "./workspaceMemoryStorage";
import type {
  WorkspaceDataLoadingState,
  WorkspaceSignal,
  WorkspaceSignalEngineInput,
} from "./workspaceTypes";

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
  now: new Date("2026-07-10T09:00:00Z"),
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
  generatedAt: "2026-07-10T09:00:00.000Z",
};

const learningSignal: WorkspaceSignal = {
  id: "learning:active-history",
  domain: "learning",
  label: "Active learning history",
  score: 62,
  severity: "medium",
  reason: "Learning history can guide recommendations.",
  count: 7,
  generatedAt: "2026-07-10T09:00:00.000Z",
};

describe("memoryEngine", () => {
  it("records repeated domain usage without mutating input memory", () => {
    const memory = createDefaultWorkspaceMemory(new Date("2026-07-10T08:00:00Z"));
    const before = JSON.stringify(memory);

    const result = memoryEngine({
      ...baseInput,
      signals: [taskSignal],
      existingMemory: memory,
      chatSessions: [],
    });

    expect(JSON.stringify(memory)).toBe(before);
    expect(result.updatedMemory.domainUsage.tasks.openCount).toBe(1);
    expect(result.updatedMemory.recentDomains[0]).toBe("tasks");
    expect(result.hasChanges).toBe(true);
  });

  it("records time-window learning preference and confidence", () => {
    let memory = createDefaultWorkspaceMemory(new Date("2026-07-10T08:00:00Z"));
    for (let index = 0; index < 3; index += 1) {
      memory = memoryEngine({
        ...baseInput,
        now: new Date(`2026-07-1${index}T09:00:00Z`),
        signals: [learningSignal],
        existingMemory: memory,
        chatSessions: [],
      }).updatedMemory;
    }

    const result = memoryEngine({
      ...baseInput,
      now: new Date("2026-07-14T09:00:00Z"),
      signals: [learningSignal],
      existingMemory: memory,
      chatSessions: [],
    });

    expect(result.memoryInsights.familiarDomains).toContain("learning");
    expect(result.memoryInsights.preferredTimeDomains).toContain("learning");
    expect(result.memoryInsights.confidence).toBe("medium");
  });

  it("keeps workspace history bounded", () => {
    let memory = createDefaultWorkspaceMemory(new Date("2026-07-01T08:00:00Z"));
    for (let day = 1; day <= 20; day += 1) {
      memory = memoryEngine({
        ...baseInput,
        now: new Date(`2026-07-${String(day).padStart(2, "0")}T09:00:00Z`),
        signals: [taskSignal],
        existingMemory: memory,
        chatSessions: [],
      }).updatedMemory;
    }

    expect(memory.workspaceHistory).toHaveLength(14);
  });

  it("keeps urgent current signals dominant after memory personalization", () => {
    let memory = createDefaultWorkspaceMemory(new Date("2026-07-01T08:00:00Z"));
    for (let day = 1; day <= 5; day += 1) {
      memory = memoryEngine({
        ...baseInput,
        now: new Date(`2026-07-${String(day).padStart(2, "0")}T09:00:00Z`),
        signals: [learningSignal],
        existingMemory: memory,
        chatSessions: [],
      }).updatedMemory;
    }
    const memoryResult = memoryEngine({
      ...baseInput,
      signals: [taskSignal, learningSignal],
      existingMemory: memory,
      chatSessions: [],
    });
    const personalization = personalizationEngine(
      baseInput,
      [taskSignal, learningSignal],
      memoryResult.memoryInsights,
    );
    const priority = priorityEngine([taskSignal, learningSignal], personalization);

    expect(priority.primaryDomain).toBe("tasks");
  });

  it("uses repeated interactions as weak personalization evidence", () => {
    const memory = createDefaultWorkspaceMemory(new Date("2026-07-10T08:00:00Z"));
    memory.recentInteractions = [
      {
        id: "interaction-1",
        type: "learning_continued",
        domain: "learning",
        targetId: "sorting",
        targetTitle: "Sorting Algorithms",
        source: "right_rail_learning",
        occurredAt: "2026-07-10T08:15:00.000Z",
        schemaVersion: 1,
      },
      {
        id: "interaction-2",
        type: "skill_opened",
        domain: "learning",
        targetId: "study-with-me",
        targetTitle: "Study With Me",
        source: "hero",
        occurredAt: "2026-07-10T08:30:00.000Z",
        schemaVersion: 1,
      },
    ];
    memory.interactionCountsByDomain.learning = 2;

    const memoryResult = memoryEngine({
      ...baseInput,
      signals: [learningSignal],
      existingMemory: memory,
      chatSessions: [],
    });
    const personalization = personalizationEngine(
      baseInput,
      [learningSignal],
      memoryResult.memoryInsights,
    );

    expect(memoryResult.memoryInsights.interactionDomains).toContain("learning");
    expect(personalization.evidence).toContain(
      "Recent interactions added weak behavior evidence.",
    );
  });

  it("keeps low-data onboarding as primary priority", () => {
    const onboardingSignal: WorkspaceSignal = {
      id: "learning:onboarding",
      domain: "learning",
      label: "Onboarding needed",
      score: 65,
      severity: "medium",
      reason: "More workspace signals are needed.",
      count: 0,
      generatedAt: "2026-07-10T09:00:00.000Z",
    };
    const memoryResult = memoryEngine({
      ...baseInput,
      signals: [taskSignal, onboardingSignal],
      existingMemory: createDefaultWorkspaceMemory(),
      chatSessions: [],
    });
    const personalization = personalizationEngine(
      baseInput,
      [taskSignal, onboardingSignal],
      memoryResult.memoryInsights,
    );
    const priority = priorityEngine([taskSignal, onboardingSignal], personalization);

    expect(priority.missionTitle).toBe("Set up your workspace.");
    expect(priority.primaryDomain).toBe("learning");
  });
});
