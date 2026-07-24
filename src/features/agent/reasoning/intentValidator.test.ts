import { describe, expect, it } from "vitest";
import { validateAgentIntentProposal } from "./intentValidator";
import type { AgentReasoningSafeContext } from "./reasoningTypes";
import type { SupportedAiResponseLanguage } from "@/features/ai/responseLanguage";

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

function validateWithContext(
  rawProposal: unknown,
  userMessage: string,
  safeContext: AgentReasoningSafeContext,
  language: SupportedAiResponseLanguage = "en",
) {
  return validateAgentIntentProposal({
    rawProposal,
    userMessage,
    safeContext,
    language,
    now,
  });
}

describe("intentValidator", () => {
  it("validates inspect intent mappings", () => {
    expect(validate(proposal({ type: "inspect_tasks", toolId: "tasks.list" })).toolId).toBe("tasks.list");
    expect(validate(proposal({ type: "inspect_calendar", requestedDomain: "calendar", toolId: "calendar.list_today" }), "What is on my calendar today?").toolId).toBe("calendar.list_today");
    expect(validate(proposal({ type: "inspect_learning", requestedDomain: "learning", toolId: "learning.get_progress" }), "Show my learning progress.").toolId).toBe("learning.get_progress");
    expect(validate(proposal({ type: "inspect_workspace", requestedDomain: "workspace", toolId: "workspace.get_context" }), "Summarize my workspace.").toolId).toBe("workspace.get_context");
  });

  it("rejects unknown intent and invented tool id", () => {
    expect(validate(proposal({ type: "inspect_secret" }), "Hello there").proposal.type).toBe("unsupported");
    expect(validate(proposal({ toolId: "finance.pay" })).proposal.type).toBe("unsupported");
  });

  it("rescues an unrecognized intent type using deterministic domain evidence, like a parse failure", () => {
    const rescued = validate(
      proposal({ type: "intent", requestedDomain: "tasks", toolId: "tasks.list" }),
      "Show my connected GitHub repositories",
    );

    expect(rescued.proposal.type).toBe("inspect_github_repositories");
    expect(rescued.toolId).toBe("github.repositories.list");
    expect(rescued.proposal.requestedDomain).toBe("github");
  });

  it("still rejects an unrecognized intent type when there is no domain evidence to rescue it", () => {
    expect(validate(proposal({ type: "whatever" }), "Hello there").proposal.type).toBe("unsupported");
  });

  it("resolves the production payload: unrecognized type, invented domain literal, correct tool id", () => {
    const result = validate(
      proposal({
        type: "intent",
        requestedDomain: "github_repositories",
        toolId: "github.repositories.list",
      }),
      "Show my connected GitHub repositories",
    );

    expect(result.proposal.type).toBe("inspect_github_repositories");
    expect(result.toolId).toBe("github.repositories.list");
    expect(result.proposal.requestedDomain).toBe("github");
  });

  it("treats a numeric confidence as usable, not low, so evidence rescue still lands", () => {
    const result = validate(
      proposal({ type: "intent", confidence: 0.9 }),
      "Show my connected GitHub repositories",
    );

    expect(result.proposal.type).toBe("inspect_github_repositories");
  });

  it("still asks clarification for an explicit low confidence", () => {
    expect(validate(proposal({ confidence: "low" })).proposal.type).toBe("ask_clarification");
  });

  it("still asks clarification when confidence is missing or garbage and there is no domain evidence to resolve the type", () => {
    const missing = validate(proposal({ type: "ask_clarification", confidence: undefined }), "Hello there");
    const garbage = validate(proposal({ type: "ask_clarification", confidence: 0.9 }), "Hello there");

    expect(missing.proposal.type).toBe("ask_clarification");
    expect(garbage.proposal.type).toBe("ask_clarification");
  });

  it("resolves the full live production payload: unrecognized type, string target, invented domain, numeric confidence", () => {
    const result = validate(
      proposal({
        type: "intent",
        target: "github.repositories.list",
        requestedDomain: "github_repositories",
        toolId: "github.repositories.list",
        confidence: 0.9,
      }),
      "Show my connected GitHub repositories",
    );

    expect(result.proposal.type).toBe("inspect_github_repositories");
    expect(result.toolId).toBe("github.repositories.list");
    expect(result.proposal.requestedDomain).toBe("github");
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

  it("normalizes selected-task completion only when it can bind one exact task", () => {
    const selectedContext: AgentReasoningSafeContext = {
      ...context,
      tasks: [{ id: "task-selected", title: "Selected task", completed: false, status: "open" }],
    };
    const result = validateWithContext(
      proposal({ type: "inspect_tasks", toolId: "tasks.list" }),
      "Mark the selected task done.",
      selectedContext,
    );

    expect(result.proposal.type).toBe("complete_task");
    expect(result.proposal.toolId).toBe("tasks.complete");
    expect(result.proposal.target?.taskId).toBe("task-selected");
    expect(result.proposal.requiresApproval).toBe(true);
  });

  it("normalizes German selected-task completion only with one exact selected task", () => {
    const selectedContext: AgentReasoningSafeContext = {
      ...context,
      tasks: [{ id: "task-selected-de", title: "Ausgewählte Aufgabe", completed: false, status: "open" }],
    };

    const markiere = validateWithContext(
      proposal({ type: "inspect_tasks", toolId: "tasks.list" }),
      "Markiere die ausgewählte Aufgabe als erledigt.",
      selectedContext,
      "de",
    );
    const erledige = validateWithContext(
      proposal({ type: "inspect_tasks", toolId: "tasks.list" }),
      "Erledige die ausgewählte Aufgabe.",
      selectedContext,
      "de",
    );

    expect(markiere.proposal.type).toBe("complete_task");
    expect(markiere.proposal.target?.taskId).toBe("task-selected-de");
    expect(markiere.proposal.requiresApproval).toBe(true);
    expect(erledige.proposal.type).toBe("complete_task");
    expect(erledige.proposal.target?.taskId).toBe("task-selected-de");
  });

  it("normalizes Persian selected-task completion only with one exact selected task", () => {
    const selectedContext: AgentReasoningSafeContext = {
      ...context,
      tasks: [{ id: "task-selected-fa", title: "کار انتخاب‌شده", completed: false, status: "open" }],
    };

    const completeSelected = validateWithContext(
      proposal({ type: "inspect_tasks", toolId: "tasks.list" }),
      "وظیفه انتخاب‌شده را تکمیل کن.",
      selectedContext,
      "fa",
    );
    const markDone = validateWithContext(
      proposal({ type: "inspect_tasks", toolId: "tasks.list" }),
      "کار انتخاب‌شده را انجام‌شده علامت بزن.",
      selectedContext,
      "fa",
    );

    expect(completeSelected.proposal.type).toBe("complete_task");
    expect(completeSelected.proposal.target?.taskId).toBe("task-selected-fa");
    expect(completeSelected.proposal.requiresApproval).toBe(true);
    expect(markDone.proposal.type).toBe("complete_task");
    expect(markDone.proposal.target?.taskId).toBe("task-selected-fa");
  });

  it("does not silently choose a selected task when context is missing or ambiguous", () => {
    const missing = validateWithContext(
      proposal({ type: "inspect_tasks", toolId: "tasks.list" }),
      "Mark the selected task done.",
      { ...context, tasks: [] },
    );
    const ambiguous = validateWithContext(
      proposal({ type: "inspect_tasks", toolId: "tasks.list" }),
      "Markiere die ausgewählte Aufgabe als erledigt.",
      { ...context, tasks: [
        { id: "task-a", title: "A", completed: false, status: "open" },
        { id: "task-b", title: "B", completed: false, status: "open" },
      ] },
      "de",
    );
    const generic = validateWithContext(
      proposal({ type: "inspect_tasks", toolId: "tasks.list" }),
      "erledigt",
      { ...context, tasks: [] },
      "de",
    );

    expect(missing.proposal.type).toBe("ask_clarification");
    expect(ambiguous.proposal.type).toBe("ask_clarification");
    expect(generic.proposal.type).toBe("ask_clarification");
  });

  it("allows exact completed task targets so runtime can report no new change", () => {
    const result = validate(proposal({
      type: "complete_task",
      requestedDomain: "tasks",
      toolId: "tasks.complete",
      target: { taskId: "task-3" },
    }), "Complete clean desk");

    expect(result.proposal.type).toBe("complete_task");
    expect(result.proposal.target?.taskId).toBe("task-3");
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
