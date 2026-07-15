import { describe, expect, it, vi } from "vitest";
import { reasonAboutUserMessage } from "./reasoningOrchestrator";
import { buildReasoningPrompt } from "./reasoningPrompt";
import type { AgentLlmReasoningCaller, AgentReasoningSafeContext } from "./reasoningTypes";

const now = new Date("2026-07-15T08:00:00.000Z");

const safeContext: AgentReasoningSafeContext = {
  tasks: [
    {
      id: "task-1",
      title: "Tax report",
      completed: false,
      status: "open",
    },
  ],
  events: [{ id: "event-1", title: "Planning", dateTimeStart: now.toISOString() }],
  learningProgress: {
    lessons: [{ id: "lesson-1", title: "Sorting", completionPercentage: 82 }],
  },
  workspace: null,
};

function rawIntent(type: string, overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    id: "intent-1",
    type,
    confidence: "high",
    userMessage: "test",
    requestedDomain: type.includes("calendar")
      ? "calendar"
      : type.includes("learning")
        ? "learning"
        : type.includes("workspace")
          ? "workspace"
          : "tasks",
    toolId: type === "inspect_calendar"
      ? "calendar.list_today"
      : type === "inspect_learning"
        ? "learning.get_progress"
        : type === "inspect_workspace"
          ? "workspace.get_context"
          : type === "complete_task"
            ? "tasks.complete"
            : "tasks.list",
    requiresTool: true,
    requiresApproval: type === "complete_task",
    reasons: ["Validated by model."],
    language: "en",
    generatedAt: now.toISOString(),
    schemaVersion: 1,
    ...overrides,
  });
}

function caller(rawText: string): AgentLlmReasoningCaller {
  return vi.fn(async () => ({ rawText }));
}

describe("reasoningOrchestrator", () => {
  it("returns a validated inspect_tasks intent without executing or approving", async () => {
    const callLlmReasoning = caller(rawIntent("inspect_tasks"));
    const result = await reasonAboutUserMessage({
      userMessage: "What tasks do I have today?",
      safeContext,
      configuredResponseLanguage: "auto",
      interfaceLanguage: "en",
      now,
    }, { callLlmReasoning });

    expect(result.proposal.type).toBe("inspect_tasks");
    expect(result.toolId).toBe("tasks.list");
    expect(result.proposal.requiresApproval).toBe(false);
    expect(callLlmReasoning).toHaveBeenCalledTimes(1);
  });

  it("returns complete_task proposal only with exact validated task target", async () => {
    const result = await reasonAboutUserMessage({
      userMessage: "Complete the tax report task.",
      safeContext,
      configuredResponseLanguage: "auto",
      interfaceLanguage: "en",
      now,
    }, {
      callLlmReasoning: caller(rawIntent("complete_task", {
        target: { taskTitleHint: "Tax report" },
      })),
    });

    expect(result.proposal.type).toBe("complete_task");
    expect(result.proposal.target?.taskId).toBe("task-1");
    expect(result.proposal.requiresApproval).toBe(true);
  });

  it("fails closed on malformed JSON", async () => {
    const result = await reasonAboutUserMessage({
      userMessage: "What should I do?",
      safeContext,
      configuredResponseLanguage: "auto",
      interfaceLanguage: "en",
      now,
    }, { callLlmReasoning: caller("not-json") });

    expect(result.proposal.type).toBe("ask_clarification");
    expect(result.proposal.requiresTool).toBe(false);
  });

  it("uses configured response language over latest message language", async () => {
    const result = await reasonAboutUserMessage({
      userMessage: "What tasks do I have?",
      safeContext,
      configuredResponseLanguage: "fa",
      interfaceLanguage: "en",
      now,
    }, { callLlmReasoning: caller(rawIntent("inspect_tasks")) });

    expect(result.responseLanguage).toBe("fa");
    expect(result.proposal.language).toBe("fa");
  });

  it("auto follows Persian and German latest user messages", async () => {
    const fa = await reasonAboutUserMessage({
      userMessage: "کارهای امروز من چیست؟",
      safeContext,
      configuredResponseLanguage: "auto",
      interfaceLanguage: "en",
      now,
    }, { callLlmReasoning: caller(rawIntent("inspect_tasks")) });
    const de = await reasonAboutUserMessage({
      userMessage: "Zeig mir meinen Kalender für heute.",
      safeContext,
      configuredResponseLanguage: "auto",
      interfaceLanguage: "en",
      now,
    }, { callLlmReasoning: caller(rawIntent("inspect_calendar")) });

    expect(fa.responseLanguage).toBe("fa");
    expect(de.responseLanguage).toBe("de");
  });

  it("prompt excludes private data classes", () => {
    const prompt = buildReasoningPrompt({
      userMessage: "What tasks do I have?",
      configuredResponseLanguage: "en",
      interfaceLanguage: "en",
      safeContext,
      responseLanguage: "en",
      now,
    });

    expect(prompt).toContain("Tax report");
    expect(prompt).not.toContain("user-");
    expect(prompt).not.toContain("rawMemory");
    expect(prompt).not.toContain("auditRecords");
    expect(prompt).not.toContain("policyDecision");
  });

  it("does not call runtime, approval, or handlers from reasoning", async () => {
    const callLlmReasoning = caller(rawIntent("inspect_workspace"));
    await reasonAboutUserMessage({
      userMessage: "Inspect workspace.",
      safeContext,
      configuredResponseLanguage: "en",
      interfaceLanguage: "en",
      now,
    }, { callLlmReasoning });

    expect(callLlmReasoning).toHaveBeenCalledTimes(1);
  });
});
