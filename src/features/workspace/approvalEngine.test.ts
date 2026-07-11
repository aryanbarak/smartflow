import { describe, expect, it } from "vitest";
import { approvalEngine } from "./approvalEngine";
import { plannerEngine } from "./plannerEngine";
import type {
  WorkspaceGoal,
  WorkspacePlan,
  WorkspacePlanActionType,
  WorkspacePlanStep,
  WorkspaceSignal,
  WorkspaceSignalDomain,
} from "./workspaceTypes";

const now = new Date("2026-07-10T09:00:00.000Z");

function signal(domain: WorkspaceSignalDomain): WorkspaceSignal {
  return {
    id: `${domain}:signal`,
    domain,
    label: `${domain} signal`,
    score: 82,
    severity: "high",
    reason: `${domain} needs attention.`,
    count: 3,
    generatedAt: now.toISOString(),
  };
}

function goal(primaryDomain: WorkspaceSignalDomain, title = "Goal"): WorkspaceGoal {
  return {
    id: `goal:${primaryDomain}:2026-07-10`,
    title,
    summary: `Work on ${primaryDomain}.`,
    primaryDomain,
    supportingDomains: [],
    successCriteria: ["Make progress."],
    estimatedEffortMinutes: 45,
    confidence: "medium",
    reasons: [`${primaryDomain} is the strongest current signal.`],
    constraints: ["No autonomous execution."],
    generatedAt: now.toISOString(),
    sourceSignalIds: [`${primaryDomain}:signal`],
    sourcePriorityDomains: [primaryDomain],
    status: "proposed",
  };
}

function step(
  id: string,
  actionType: WorkspacePlanActionType,
  domain: WorkspaceSignalDomain = "tasks",
  requiresApproval = false,
): WorkspacePlanStep {
  return {
    id,
    order: Number(id.replace(/\D/g, "")) || 1,
    title: `${actionType} step`,
    description: `${actionType} description.`,
    domain,
    estimatedMinutes: 10,
    status: "proposed",
    actionType,
    reason: `${actionType} reason.`,
    requiresApproval,
    dependencies: [],
    optional: false,
  };
}

function plan(steps: WorkspacePlanStep[]): WorkspacePlan {
  const sourceGoal = goal("tasks");
  return {
    id: "plan:tasks:2026-07-10",
    goalId: sourceGoal.id,
    title: "Plan",
    summary: "A proposed plan.",
    status: "proposed",
    steps,
    totalEstimatedMinutes: steps.reduce((sum, item) => sum + item.estimatedMinutes, 0),
    confidence: "medium",
    constraints: ["Planner V1 proposes steps only."],
    reasons: ["Tasks are active."],
    generatedAt: now.toISOString(),
    sourceGoal,
    sourceSignalIds: sourceGoal.sourceSignalIds,
  };
}

describe("approvalEngine", () => {
  it("classifies review/open/reflect as not requiring approval", () => {
    const approval = approvalEngine({
      now,
      plan: plan([
        step("step-1", "review"),
        step("step-2", "open"),
        step("step-3", "reflect"),
      ]),
    });

    expect(approval.overallStatus).toBe("not_required");
    expect(approval.requiresUserApproval).toBe(false);
    expect(approval.approvalScope).toBe("view_only");
    expect(approval.riskLevel).toBe("none");
    expect(
      approval.stepApprovals.every(
        (item) =>
          item.status === "not_required" &&
          !item.externalEffect &&
          item.reversible,
      ),
    ).toBe(true);
  });

  it("classifies focus/continue/select/plan as pending approval when state-changing", () => {
    const approval = approvalEngine({
      now,
      plan: plan([
        step("step-1", "focus", "tasks", true),
        step("step-2", "continue", "learning", true),
        step("step-3", "select", "calendar", true),
        step("step-4", "plan", "calendar", true),
      ]),
    });

    expect(approval.overallStatus).toBe("pending");
    expect(approval.requiresUserApproval).toBe(true);
    expect(approval.approvalScope).toBe("multiple_steps");
    expect(approval.stepApprovals.every((item) => item.status === "pending")).toBe(true);
    expect(approval.stepApprovals.every((item) => item.externalEffect)).toBe(true);
    expect(approval.stepApprovals.map((item) => item.riskLevel)).toEqual([
      "low",
      "medium",
      "low",
      "medium",
    ]);
  });

  it("never auto-approves or rejects any step", () => {
    const approval = approvalEngine({
      now,
      plan: plan([
        step("step-1", "review"),
        step("step-2", "focus", "tasks", true),
        step("step-3", "delete", "documents", true),
      ]),
    });

    expect(
      approval.stepApprovals.some(
        (item) => item.status === "approved" || item.status === "rejected",
      ),
    ).toBe(false);
    expect(approval.overallStatus).toBe("pending");
  });

  it("classifies high-impact future actions as high risk", () => {
    const approval = approvalEngine({
      now,
      plan: plan([
        step("step-1", "delete", "documents", true),
        step("step-2", "send", "documents", true),
        step("step-3", "pay", "finance", true),
        step("step-4", "share", "documents", true),
      ]),
    });

    expect(approval.riskLevel).toBe("high");
    expect(approval.stepApprovals.every((item) => item.riskLevel === "high")).toBe(true);
    expect(approval.stepApprovals.every((item) => !item.reversible)).toBe(true);
    expect(approval.stepApprovals.every((item) => item.externalEffect)).toBe(true);
  });

  it("prefers per-step approval and does not default to entire-plan approval", () => {
    const approval = approvalEngine({
      now,
      plan: plan([step("step-1", "review"), step("step-2", "focus", "tasks", true)]),
    });

    expect(approval.approvalScope).toBe("single_step");
    expect(approval.approvalScope).not.toBe("entire_plan");
    expect(approval.stepApprovals[1]?.approvalScope).toBe("single_step");
  });

  it("is deterministic and does not mutate input plan", () => {
    const sourcePlan = plan([
      step("step-1", "review"),
      step("step-2", "continue", "learning", true),
    ]);
    const before = JSON.stringify(sourcePlan);

    const first = approvalEngine({ now, plan: sourcePlan });
    const second = approvalEngine({ now, plan: sourcePlan });

    expect(JSON.stringify(sourcePlan)).toBe(before);
    expect(second).toEqual(first);
  });

  it("works for onboarding and calm-focus plans from Planner V1", () => {
    const onboardingPlan = plannerEngine({
      now,
      goal: goal("learning", "Set up your SmartFlow workspace."),
      signals: [signal("learning")],
    });
    const calmPlan = plannerEngine({
      now,
      goal: goal("learning", "Create one useful block of focused progress."),
      signals: [signal("learning")],
    });

    const onboardingApproval = approvalEngine({ now, plan: onboardingPlan });
    const calmApproval = approvalEngine({ now, plan: calmPlan });

    expect(onboardingApproval.stepApprovals).toHaveLength(onboardingPlan.steps.length);
    expect(calmApproval.stepApprovals).toHaveLength(calmPlan.steps.length);
    expect(onboardingApproval.overallStatus).toBe("pending");
    expect(calmApproval.overallStatus).toBe("pending");
  });

  it("records accurate data domains and no execution side effects", () => {
    const approval = approvalEngine({
      now,
      plan: plan([step("step-1", "update", "calendar", true)]),
    });

    expect(approval.stepApprovals[0]?.dataDomains).toEqual(["calendar"]);
    expect(approval.stepApprovals[0]?.externalEffect).toBe(true);
    expect(approval.reasons).toContain(
      "No execution, tools, network calls, or data mutations are performed.",
    );
  });
});
