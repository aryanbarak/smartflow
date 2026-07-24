

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import {
  ChatBubble,
  liveTaskReasoningContext,
  proposalMessage,
  ReasoningProposalCard,
  resultMessage,
  runtimeSummaryMessage,
  shouldUseReasoningForMessage,
} from "./ChatPage";
import { getToolById } from "@/features/agent";
import type {
  AgentReasoningResult,
  ToolResolutionResult,
} from "@/features/agent";
import type {
  WorkspacePlanStep,
  WorkspaceStepApproval,
} from "@/features/workspace";

const now = "2026-07-15T08:00:00.000Z";

function reasoningResult(
  type: AgentReasoningResult["proposal"]["type"] = "inspect_tasks",
): AgentReasoningResult {
  const toolId = type === "complete_task" ? "tasks.complete" : "tasks.list";
  return {
    proposal: {
      id: "intent-1",
      type,
      confidence: "high",
      userMessage: "Show my open tasks.",
      requestedDomain: "tasks",
      toolId,
      target: type === "complete_task"
        ? { taskId: "task-secret-1", taskTitleHint: "Submit application" }
        : undefined,
      requiresTool: true,
      requiresApproval: type === "complete_task",
      reasons: ["Validated."],
      language: "en",
      generatedAt: now,
      schemaVersion: 1,
    },
    responseLanguage: "en",
    validationReasons: ["validated"],
    toolId,
    rawModelText: "{}",
    promptPreview: {
      containsTasks: true,
      containsEvents: false,
      containsLearning: false,
      containsWorkspace: false,
    },
  };
}

function step(type: AgentReasoningResult["proposal"]["type"]): WorkspacePlanStep {
  return {
    id: "reasoning-step:intent-1",
    order: 1,
    title: type === "complete_task" ? "Complete task" : "Inspect tasks",
    description: type === "complete_task" ? "Mark Submit application as complete." : "Run tasks.list.",
    domain: "tasks",
    estimatedMinutes: 5,
    status: "proposed",
    actionType: type === "complete_task" ? "complete" : "review",
    targetId: type === "complete_task" ? "task-secret-1" : undefined,
    reason: "Validated.",
    requiresApproval: type === "complete_task",
    dependencies: [],
    optional: false,
  };
}

function resolution(toolId = "tasks.list"): ToolResolutionResult {
  return {
    status: "resolved",
    resolved: true,
    stepId: "reasoning-step:intent-1",
    toolId,
    tool: getToolById(toolId),
    confidence: "high",
    reasons: ["resolved"],
    candidates: [],
    requiredInput: [],
    generatedAt: now,
    resolverVersion: "tool-resolver-v1",
  };
}

function approval(status: WorkspaceStepApproval["status"] = "pending"): WorkspaceStepApproval {
  return {
    stepId: "reasoning-step:intent-1",
    targetId: "task-secret-1",
    toolId: "tasks.complete",
    status,
    requiresApproval: true,
    approvalReason: "Explicit approval is required.",
    riskLevel: "medium",
    reversible: true,
    externalEffect: true,
    dataDomains: ["tasks"],
    approvalScope: "single_step",
  };
}

describe("ChatPage LLM reasoning UX boundary", () => {
  it("uses live task context when loading completed with non-empty tasks", () => {
    const result = liveTaskReasoningContext({
      tasks: [{ id: "live-1", title: "Live task", completed: false, createdAt: now }],
      isLoading: false,
      error: null,
    });

    expect(result).toEqual([{
      id: "live-1",
      title: "Live task",
      completed: false,
      status: "open",
      dueDate: undefined,
      createdAt: now,
    }]);
  });

  it("treats true empty live tasks as authoritative instead of falling back to stale workspace tasks", () => {
    const result = liveTaskReasoningContext({
      tasks: [],
      isLoading: false,
      error: null,
    });

    expect(result).toEqual([]);
  });

  it("does not manufacture exact task context while live tasks are loading", () => {
    const result = liveTaskReasoningContext({
      tasks: [{ id: "stale-1", title: "Stale task", completed: false, createdAt: now }],
      isLoading: true,
      error: null,
    });

    expect(result).toEqual([]);
  });

  it("does not manufacture exact task context when live tasks failed to load", () => {
    const result = liveTaskReasoningContext({
      tasks: [{ id: "stale-1", title: "Stale task", completed: false, createdAt: now }],
      isLoading: false,
      error: "Failed to load tasks",
    });

    expect(result).toEqual([]);
  });

  it("does not route ordinary educational conversation into intent mode", () => {
    expect(shouldUseReasoningForMessage("Why is task management important?")).toBe(false);
    expect(shouldUseReasoningForMessage("Explain how calendars work.")).toBe(false);
    expect(shouldUseReasoningForMessage("What is spaced repetition?")).toBe(false);
    expect(shouldUseReasoningForMessage("Tell me about productivity systems.")).toBe(false);
    expect(shouldUseReasoningForMessage("درباره سیستم‌های بهره‌وری توضیح بده.")).toBe(false);
  });

  it("does not route greetings, thanks, or acknowledgements into intent mode", () => {
    expect(shouldUseReasoningForMessage("Hello, how are you today?")).toBe(false);
    expect(shouldUseReasoningForMessage("Thanks, that was helpful!")).toBe(false);
    expect(shouldUseReasoningForMessage("Hi there!")).toBe(false);
    expect(shouldUseReasoningForMessage("Ok, got it, thanks.")).toBe(false);
    expect(shouldUseReasoningForMessage("Hallo, wie geht es dir?")).toBe(false);
    expect(shouldUseReasoningForMessage("Danke, das war hilfreich!")).toBe(false);
    expect(shouldUseReasoningForMessage("سلام، چطوری؟")).toBe(false);
    expect(shouldUseReasoningForMessage("ممنونم، خیلی کمک کرد.")).toBe(false);
  });

  it("routes arbitrary tool phrasing never seen before into reasoning, since the allowlist is gone", () => {
    expect(shouldUseReasoningForMessage("Check the status of my project rollout")).toBe(true);
    expect(shouldUseReasoningForMessage("Can you look into the widget inventory for me?")).toBe(true);
    expect(shouldUseReasoningForMessage("Kannst du den Status meines Projekts pruefen?")).toBe(true);
    expect(shouldUseReasoningForMessage("می‌تونی وضعیت پروژه من رو بررسی کنی؟")).toBe(true);
  });

  it("does not let a greeting/thanks/acknowledgement word thrown in as a prefix disqualify a real request", () => {
    expect(shouldUseReasoningForMessage("ok show me my repositories")).toBe(true);
    expect(shouldUseReasoningForMessage("Great, now list my open issues")).toBe(true);
    expect(shouldUseReasoningForMessage("thanks, and what tasks do I have?")).toBe(true);
  });

  it("routes natural supported action phrasing into intent mode", () => {
    expect(shouldUseReasoningForMessage("What tasks do I have today?")).toBe(true);
    expect(shouldUseReasoningForMessage("Welche Aufgaben habe ich heute?")).toBe(true);
    expect(shouldUseReasoningForMessage("امروز چه کارهایی دارم؟")).toBe(true);
    expect(shouldUseReasoningForMessage("امروز چه کارهایی دارم و به فارسی جواب بده")).toBe(true);
    expect(shouldUseReasoningForMessage("امروز چه کارهایی دارم؟")).toBe(true);
    expect(shouldUseReasoningForMessage("What is on my calendar today?")).toBe(true);
    expect(shouldUseReasoningForMessage("Show my connected GitHub repositories.")).toBe(true);
    expect(shouldUseReasoningForMessage("Zeige meine verbundenen GitHub-Repositories.")).toBe(true);
    expect(shouldUseReasoningForMessage("مخزن‌های متصل گیت‌هاب را نشان بده.")).toBe(true);
    expect(shouldUseReasoningForMessage("Show me my repositories")).toBe(true);
    expect(shouldUseReasoningForMessage("list my repos")).toBe(true);
    expect(shouldUseReasoningForMessage("Zeige meine Repositories")).toBe(true);
    expect(shouldUseReasoningForMessage("مخزن‌های من را نشان بده")).toBe(true);
  });

  it("renders a safe read-only action card without executing or exposing internals", () => {
    const onRunReadOnly = vi.fn();
    const html = renderToString(
      <ReasoningProposalCard
        proposal={{
          result: reasoningResult("inspect_tasks"),
          step: step("inspect_tasks"),
          resolution: resolution("tasks.list"),
          approval: null,
          runStatus: "idle",
        }}
        onRunReadOnly={onRunReadOnly}
        onReviewApproval={vi.fn()}
        onRunWrite={vi.fn()}
      />,
    );

    expect(html).toContain("Interpreted intent");
    expect(html).toContain("List tasks");
    expect(html).toContain("Read-only");
    expect(html).not.toContain("Confidence");
    expect(html).not.toContain("high");
    expect(html).not.toContain("task-secret-1");
    expect(html).not.toContain("requestId");
    expect(html).not.toContain("schema");
    expect(onRunReadOnly).not.toHaveBeenCalled();
  });

  it("keeps approval and write execution separated for complete_task", () => {
    const pendingHtml = renderToString(
      <ReasoningProposalCard
        proposal={{
          result: reasoningResult("complete_task"),
          step: step("complete_task"),
          resolution: resolution("tasks.complete"),
          approval: approval("pending"),
          runStatus: "approval_required",
        }}
        onRunReadOnly={vi.fn()}
        onReviewApproval={vi.fn()}
        onRunWrite={vi.fn()}
      />,
    );
    const approvedHtml = renderToString(
      <ReasoningProposalCard
        proposal={{
          result: reasoningResult("complete_task"),
          step: step("complete_task"),
          resolution: resolution("tasks.complete"),
          approval: approval("approved"),
          runStatus: "approved",
        }}
        onRunReadOnly={vi.fn()}
        onReviewApproval={vi.fn()}
        onRunWrite={vi.fn()}
      />,
    );

    expect(pendingHtml).toContain("Review approval");
    expect(pendingHtml).not.toContain(">Complete task</button>");
    expect(approvedHtml).toContain("Complete task");
  });

  it("formats supported runtime results through context synthesis and the response composer", () => {
    const message = resultMessage({
      requestId: "request-1",
      stepId: "step-1",
      toolId: "tasks.list",
      status: "success",
      success: true,
      memoryEvidenceRetained: false,
      safeSummary: "2 active tasks found.",
      safePreviewItems: ["Finish report", "Review calendar"],
      reasons: [],
      startedAt: now,
      completedAt: now,
      durationMs: 0,
    }, "en", undefined, {
      primaryFact: "1 of your 2 open tasks is due today.",
      supportingFacts: ["1 open task does not have due dates."],
      safeSuggestion: "You may want to add due dates to those tasks.",
      evidenceDomains: ["tasks"],
      confidence: "medium",
      synthesisVersion: "context-synthesis-v1",
    });

    expect(message).toContain("Here is your task overview.");
    expect(message).toContain("1 of your 2 open tasks is due today.");
    expect(message).toContain("1 open task does not have due dates.");
    expect(message).toContain("- Finish report");
    expect(message).toContain("You may want to add due dates to those tasks.");
    expect(message).not.toContain("request-1");
  });

  it("localizes deterministic proposal messages to the resolved response language", () => {
    const german = reasoningResult("inspect_calendar");
    german.responseLanguage = "de";
    const farsi = reasoningResult("inspect_learning");
    farsi.responseLanguage = "fa";

    expect(proposalMessage(german)).toContain("Interpretierte Absicht");
    expect(proposalMessage(german)).toContain("Pruefe die vorgeschlagene Aktion");
    expect(proposalMessage(german)).not.toContain("Interpreted intent");
    expect(proposalMessage(farsi)).toContain("نیت تشخیص داده شد");
    expect(proposalMessage(farsi)).not.toContain("Interpreted intent");
  });

  it("localizes the same authoritative runtime summary for English, German, and Persian", () => {
    const emptyCalendar = {
      requestId: "request-calendar",
      stepId: "step-calendar",
      toolId: "calendar.list_today",
      status: "success" as const,
      success: true,
      memoryEvidenceRetained: false,
      safeSummary: "No events today.",
      safePreviewItems: [],
      reasons: [],
      startedAt: now,
      completedAt: now,
      durationMs: 0,
    };

    expect(runtimeSummaryMessage(emptyCalendar, "en")).toBe("Your calendar is clear today.");
    expect(runtimeSummaryMessage(emptyCalendar, "de")).toBe("Dein Kalender ist heute frei.");
    expect(runtimeSummaryMessage(emptyCalendar, "fa")).toBe("تقویمت امروز خالی است.");
  });

  it("localizes completed, already-completed, and failed write summaries", () => {
    const writeResult = {
      requestId: "request-write",
      stepId: "step-write",
      toolId: "tasks.complete",
      status: "success" as const,
      success: true,
      verified: true,
      alreadyCompleted: false,
      memoryEvidenceRetained: false,
      safeSummary: "Task was marked complete.",
      reasons: [],
      startedAt: now,
      completedAt: now,
      durationMs: 0,
    };

    expect(runtimeSummaryMessage(writeResult, "de")).toBe("Die Aufgabe ist als erledigt markiert.");
    expect(runtimeSummaryMessage({
      ...writeResult,
      alreadyCompleted: true,
      safeSummary: "Task was already complete.",
    }, "fa")).toContain("قبلا انجام شده بود");
    expect(runtimeSummaryMessage({
      ...writeResult,
      status: "policy_denied",
      success: false,
      verified: false,
      safeSummary: "Write action was blocked.",
    }, "de")).toBe("Ich konnte die Aufgabenerledigung nicht sicher bestatigen.");
  });

  it("keeps Persian flow RTL while isolating independent English, German, and numeric blocks", () => {
    const mixed = renderToString(
      <ChatBubble
        role="assistant"
        language="fa"
        content={"این نتیجه برای Review active tasks است.\n\nReview active tasks (2).\n\nHeute sind 2 Termine frei."}
      />,
    );
    const english = renderToString(
      <ChatBubble role="assistant" language="en" content="Review active tasks (2)." />,
    );
    const german = renderToString(
      <ChatBubble role="assistant" language="de" content="Heute sind 2 Termine frei." />,
    );
    const farsi = renderToString(
      <ChatBubble role="assistant" language="fa" content="امروز ۲ کار فعال داری." />,
    );

    expect(mixed).toContain('dir="rtl"');
    expect(mixed.match(/dir="auto"/g)?.length).toBe(3);
    expect(mixed).toContain("Review active tasks (2).");
    expect(english).toContain('dir="ltr"');
    expect(german).toContain('dir="ltr"');
    expect(farsi).toContain('dir="rtl"');
    expect(farsi).toContain('dir="auto"');
  });

  it("isolates an English proposal inside Persian flow without mirroring proposal controls", () => {
    const proposalBubble = renderToString(
      <ChatBubble
        role="assistant"
        language="fa"
        content="Interpreted intent: Inspect tasks. Review the proposed action."
      />,
    );
    const farsiResult = reasoningResult("inspect_tasks");
    farsiResult.responseLanguage = "fa";
    const controls = renderToString(
      <ReasoningProposalCard
        proposal={{
          result: farsiResult,
          step: step("inspect_tasks"),
          resolution: resolution("tasks.list"),
          approval: null,
          runStatus: "idle",
        }}
        onRunReadOnly={vi.fn()}
        onReviewApproval={vi.fn()}
        onRunWrite={vi.fn()}
      />,
    );

    expect(proposalBubble).toContain('dir="rtl"');
    expect(proposalBubble).toContain('dir="auto"');
    expect(controls).toContain("Run tasks.list");
    expect(controls).not.toContain('dir="rtl"');
  });
});
