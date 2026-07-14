import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { StepApprovalDialog } from "./StepApprovalDialog";
import { getToolById } from "@/features/agent/toolRegistry";
import { translations } from "@/i18n";
import type {
  WorkspacePlanStep,
  WorkspaceStepApproval,
} from "../workspaceTypes";

function step(overrides: Partial<WorkspacePlanStep> = {}): WorkspacePlanStep {
  return {
    id: "step-1",
    order: 1,
    title: "Create task",
    description: "Create a new task from the plan.",
    domain: "tasks",
    estimatedMinutes: 10,
    status: "proposed",
    actionType: "create",
    reason: "Task load is high.",
    requiresApproval: true,
    dependencies: [],
    optional: false,
    ...overrides,
  };
}

function approval(
  overrides: Partial<WorkspaceStepApproval> = {},
): WorkspaceStepApproval {
  return {
    stepId: "step-1",
    status: "pending",
    requiresApproval: true,
    approvalReason: "Future execution could modify user data.",
    riskLevel: "medium",
    reversible: true,
    externalEffect: true,
    dataDomains: ["tasks"],
    approvalScope: "single_step",
    ...overrides,
  };
}

describe("StepApprovalDialog", () => {
  it("renders approval-required step details and accessible controls", () => {
    const html = renderToString(
      <StepApprovalDialog
        open
        step={step()}
        stepApproval={approval()}
        tool={getToolById("tasks.create")}
        onClose={vi.fn()}
        onDecision={vi.fn()}
      />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain("Review this action");
    expect(html).toContain("Create task");
    expect(html).toContain("tasks.create");
    expect(html).toContain("single_step");
    expect(html).toContain("Approve");
    expect(html).toContain("Reject");
    expect(html).toContain("Cancel");
  });

  it("does not emit approval merely by rendering", () => {
    const onDecision = vi.fn();

    renderToString(
      <StepApprovalDialog
        open
        step={step()}
        stepApproval={approval()}
        tool={getToolById("tasks.create")}
        onClose={vi.fn()}
        onDecision={onDecision}
      />,
    );

    expect(onDecision).not.toHaveBeenCalled();
  });

  it("keeps control order stable and includes Farsi approval translations", () => {
    const html = renderToString(
      <StepApprovalDialog
        open
        step={step()}
        stepApproval={approval()}
        tool={getToolById("tasks.create")}
        onClose={vi.fn()}
        onDecision={vi.fn()}
      />,
    );

    expect(html).toContain("Approve");
    expect(html.lastIndexOf("Cancel")).toBeLessThan(html.lastIndexOf("Approve"));
    expect(translations.fa.approval_approve).toBeTruthy();
    expect(translations.fa.approval_reject).toBeTruthy();
  });

  it("renders nothing when closed", () => {
    const html = renderToString(
      <StepApprovalDialog
        open={false}
        step={step()}
        stepApproval={approval()}
        tool={getToolById("tasks.create")}
        onClose={vi.fn()}
        onDecision={vi.fn()}
      />,
    );

    expect(html).toBe("");
  });
});
