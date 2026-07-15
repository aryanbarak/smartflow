import { describe, expect, it } from "vitest";
import { validateAgentIntentProposal } from "./intentValidator";
import type { AgentReasoningSafeContext } from "./reasoningTypes";

const now = new Date("2026-07-15T08:00:00.000Z");

const context: AgentReasoningSafeContext = {
  tasks: [
    { id: "task-1", title: "Tax report", completed: false, status: "open" },
    { id: "task-2", title: "Tax report archive", completed: false, status: "open" },
    { id: "task-3", title: "Clean desk", completed: true, status: "completed" },
  ],
  events: [{ id: "event-1", title: "Standup", dateTimeStart: now.toISOString() }],
  learningProgress: {
    lessons: [{ id: "lesson-1", title: "Sorting", completionPercentage: 82 }],
  },
};

function proposal(overrides: Record<string, unknown> = {}) {
  return {
    id: "intent-1",
    type: "inspect_tasks",
    confidence: "high",
    userMessage: "What tasks do I have?",
    requestedDomain: "tasks",
    toolId: "tasks.list",
    requiresTool: true,
    requiresApproval: false,
    reasons: ["Task inspection requested."],
    language: "en",
    generatedAt: now.toISOString(),
    schemaVersion: 1,
    ...overrides,
  };
}

function validate(rawProposal: unknown, userMessage = "What tasks do I have?") {
  return validateAgentIntentProposal({
    rawProposal,
    userMessage,
    safeContext: context,
    language: "en",
    now,
  });
}

describe("intentValidator", () => {
  it("validates inspect intent mappings", () => {
    expect(validate(proposal({ type: "inspect_tasks", toolId: "tasks.list" })).toolId).toBe("tasks.list");
    expect(validate(proposal({ type: "inspect_calendar", requestedDomain: "calendar", toolId: "calendar.list_today" })).toolId).toBe("calendar.list_today");
    expect(validate(proposal({ type: "inspect_learning", requestedDomain: "learning", toolId: "learning.get_progress" })).toolId).toBe("learning.get_progress");
    expect(validate(proposal({ type: "inspect_workspace", requestedDomain: "workspace", toolId: "workspace.get_context" })).toolId).toBe("workspace.get_context");
  });

  it("rejects unknown intent and invented tool id", () => {
    expect(validate(proposal({ type: "inspect_secret" })).proposal.type).toBe("unsupported");
    expect(validate(proposal({ toolId: "finance.pay" })).proposal.type).toBe("unsupported");
  });

  it("handles malformed or non-object output safely", () => {
    const result = validate(null);

    expect(result.proposal.type).toBe("ask_clarification");
    expect(result.proposal.requiresTool).toBe(false);
  });

  it("rejects unsupported create, update, and delete requests", () => {
    expect(validate(proposal({ type: "inspect_tasks" }), "Create a task").proposal.type).toBe("unsupported");
    expect(validate(proposal({ type: "inspect_tasks" }), "Update the task").proposal.type).toBe("unsupported");
    expect(validate(proposal({ type: "inspect_tasks" }), "Delete this task").proposal.type).toBe("unsupported");
    expect(validate(proposal({ type: "inspect_calendar", requestedDomain: "calendar", toolId: "calendar.list_today" }), "Verschiebe meinen Termin auf 15 Uhr.").proposal.type).toBe("unsupported");
    expect(validate(proposal({ type: "inspect_tasks" }), "برای فردا یک وظیفه بساز.").proposal.type).toBe("unsupported");
  });

  it("rejects mixed read and completion requests instead of partially executing", () => {
    expect(validate(proposal({ type: "inspect_tasks" }), "Check my tasks and complete the most important one.").proposal.type).toBe("ask_clarification");
    expect(validate(proposal({ type: "inspect_calendar", requestedDomain: "calendar", toolId: "calendar.list_today" }), "Show my calendar and create a focus block.").proposal.type).toBe("unsupported");
    expect(validate(proposal({ type: "inspect_learning", requestedDomain: "learning", toolId: "learning.get_progress" }), "Continue learning and finish the related task.").proposal.type).toBe("ask_clarification");
  });

  it("asks clarification for low confidence", () => {
    const result = validate(proposal({ confidence: "low" }));

    expect(result.proposal.type).toBe("ask_clarification");
    expect(result.proposal.clarificationQuestion).toBeTruthy();
  });

  it("rejects userId and extra action fields", () => {
    expect(validate(proposal({ userId: "user-1" })).proposal.type).toBe("unsupported");
    expect(validate(proposal({ actions: [{ type: "inspect_tasks" }] })).proposal.type).toBe("unsupported");
    expect(validate(proposal({ extraActions: ["tasks.list"] })).proposal.type).toBe("unsupported");
  });

  it("requires exact task target for complete_task", () => {
    const missing = validate(proposal({
      type: "complete_task",
      requestedDomain: "tasks",
      toolId: "tasks.complete",
      target: {},
    }), "Complete this task");
    const ambiguous = validate(proposal({
      type: "complete_task",
      requestedDomain: "tasks",
      toolId: "tasks.complete",
      target: { taskTitleHint: "Tax report" },
    }), "Complete the tax report task");
    const exact = validate(proposal({
      type: "complete_task",
      requestedDomain: "tasks",
      toolId: "tasks.complete",
      target: { taskId: "task-1" },
    }), "Complete the tax report task");

    expect(missing.proposal.type).toBe("ask_clarification");
    expect(ambiguous.proposal.type).toBe("ask_clarification");
    expect(exact.proposal.type).toBe("complete_task");
    expect(exact.proposal.target?.taskId).toBe("task-1");
    expect(exact.proposal.requiresApproval).toBe(true);
  });

  it("does not allow completed task targets", () => {
    const result = validate(proposal({
      type: "complete_task",
      requestedDomain: "tasks",
      toolId: "tasks.complete",
      target: { taskId: "task-3" },
    }), "Complete clean desk");

    expect(result.proposal.type).toBe("ask_clarification");
  });

  it("creates localized clarification text", () => {
    const result = validateAgentIntentProposal({
      rawProposal: proposal({ confidence: "low" }),
      userMessage: "Diese Anfrage ist unklar",
      safeContext: context,
      language: "de",
      now,
    });

    expect(result.proposal.clarificationQuestion).toContain("Kannst");
  });

  it("returns language-correct clarification for low-confidence auto outputs", () => {
    const fa = validateAgentIntentProposal({
      rawProposal: proposal({ confidence: "low" }),
      userMessage: "منظورت کدام وظیفه است؟",
      safeContext: context,
      language: "fa",
      now,
    });
    const en = validateAgentIntentProposal({
      rawProposal: proposal({ confidence: "low" }),
      userMessage: "Which task?",
      safeContext: context,
      language: "en",
      now,
    });

    expect(fa.proposal.clarificationQuestion).toContain("می");
    expect(en.proposal.clarificationQuestion).toContain("clarify");
  });
});
