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
  ReasoningProposalCard,
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
  it("does not route ordinary educational conversation into intent mode", () => {
    expect(shouldUseReasoningForMessage("Why is task management important?")).toBe(false);
    expect(shouldUseReasoningForMessage("Explain how calendars work.")).toBe(false);
    expect(shouldUseReasoningForMessage("What is spaced repetition?")).toBe(false);
    expect(shouldUseReasoningForMessage("Tell me about productivity systems.")).toBe(false);
  });

  it("routes natural supported action phrasing into intent mode", () => {
    expect(shouldUseReasoningForMessage("What tasks do I have today?")).toBe(true);
    expect(shouldUseReasoningForMessage("Welche Aufgaben habe ich heute?")).toBe(true);
    expect(shouldUseReasoningForMessage("امروز چه کارهایی دارم؟")).toBe(true);
    expect(shouldUseReasoningForMessage("What is on my calendar today?")).toBe(true);
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
});
