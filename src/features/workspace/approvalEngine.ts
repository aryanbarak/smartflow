import type {
  WorkspaceApprovalEngineInput,
  WorkspaceApprovalModel,
  WorkspaceApprovalRiskLevel,
  WorkspaceApprovalScope,
  WorkspacePlanActionType,
  WorkspaceStepApproval,
} from "./workspaceTypes";

const riskOrder: Record<WorkspaceApprovalRiskLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const viewOnlyActions: WorkspacePlanActionType[] = [
  "review",
  "open",
  "reflect",
  "inspect",
];

const pendingLowActions: WorkspacePlanActionType[] = [
  "focus",
  "select",
];

const pendingMediumActions: WorkspacePlanActionType[] = [
  "continue",
  "plan",
  "create",
  "update",
  "complete",
  "invite",
];

const pendingHighActions: WorkspacePlanActionType[] = [
  "delete",
  "send",
  "pay",
  "share",
];

function maxRisk(risks: WorkspaceApprovalRiskLevel[]) {
  return risks.reduce<WorkspaceApprovalRiskLevel>(
    (max, risk) => (riskOrder[risk] > riskOrder[max] ? risk : max),
    "none",
  );
}

function isHighImpact(actionType: WorkspacePlanActionType) {
  return pendingHighActions.includes(actionType);
}

function isMediumImpact(actionType: WorkspacePlanActionType) {
  return pendingMediumActions.includes(actionType);
}

function isLowApprovalAction(actionType: WorkspacePlanActionType) {
  return pendingLowActions.includes(actionType);
}

function riskFor(actionType: WorkspacePlanActionType): WorkspaceApprovalRiskLevel {
  if (viewOnlyActions.includes(actionType)) return "none";
  if (isLowApprovalAction(actionType)) return "low";
  if (isMediumImpact(actionType)) return "medium";
  if (isHighImpact(actionType)) return "high";
  return "medium";
}

function externalEffectFor(actionType: WorkspacePlanActionType) {
  return !viewOnlyActions.includes(actionType);
}

function reversibleFor(actionType: WorkspacePlanActionType) {
  if (viewOnlyActions.includes(actionType)) return true;
  if (actionType === "delete" || actionType === "send" || actionType === "pay" || actionType === "share") {
    return false;
  }
  return true;
}

function approvalReasonFor(actionType: WorkspacePlanActionType) {
  if (viewOnlyActions.includes(actionType)) {
    return "Read-only or reflective step; no approval required.";
  }
  if (isHighImpact(actionType)) {
    return "Future execution could have irreversible or external impact and must require explicit approval.";
  }
  if (isMediumImpact(actionType)) {
    return "Future execution could modify user data or progress and requires explicit approval.";
  }
  return "Future execution could commit a choice or local state change and requires approval.";
}

function approvalScopeForStep(actionType: WorkspacePlanActionType): WorkspaceApprovalScope {
  return viewOnlyActions.includes(actionType) ? "view_only" : "single_step";
}

function classifyStepWithResolution(
  step: WorkspaceApprovalEngineInput["plan"]["steps"][number],
  resolution: WorkspaceApprovalEngineInput["toolResolutions"][number] | undefined,
): WorkspaceStepApproval {
  const requiresApproval = !viewOnlyActions.includes(step.actionType) || step.requiresApproval;
  const riskLevel = riskFor(step.actionType);
  const resolvedTool = resolution?.resolved ? resolution.tool : undefined;
  const effectiveRisk = resolvedTool && riskOrder[resolvedTool.riskLevel] > riskOrder[riskLevel]
    ? resolvedTool.riskLevel
    : riskLevel;
  return {
    stepId: step.id,
    ...(step.targetId ? { targetId: step.targetId } : {}),
    toolId: resolvedTool?.id,
    toolName: resolvedTool?.name,
    toolDescription: resolvedTool?.description,
    toolCapability: resolvedTool?.capability,
    toolMode: resolvedTool?.mode,
    status: requiresApproval ? "pending" : "not_required",
    requiresApproval,
    approvalReason: approvalReasonFor(step.actionType),
    riskLevel: effectiveRisk,
    reversible: resolvedTool ? resolvedTool.reversible && reversibleFor(step.actionType) : reversibleFor(step.actionType),
    externalEffect: resolvedTool ? resolvedTool.externalEffect || externalEffectFor(step.actionType) : externalEffectFor(step.actionType),
    dataDomains: [step.domain],
    approvalScope: approvalScopeForStep(step.actionType),
  };
}

function overallScope(stepApprovals: WorkspaceStepApproval[]): WorkspaceApprovalScope {
  const pendingCount = stepApprovals.filter((step) => step.requiresApproval).length;
  if (pendingCount === 0) return "view_only";
  if (pendingCount === 1) return "single_step";
  return "multiple_steps";
}

function approvalSummaryFor(stepApprovals: WorkspaceStepApproval[]) {
  const pendingCount = stepApprovals.filter((step) => step.requiresApproval).length;
  if (pendingCount === 0) return "This plan is view-only and does not require approval.";
  return `${pendingCount} step${pendingCount === 1 ? "" : "s"} require explicit approval before any future execution.`;
}

export function approvalEngine(input: WorkspaceApprovalEngineInput): WorkspaceApprovalModel {
  const now = input.now ?? new Date();
  const generatedAt = now.toISOString();
  const resolutionByStepId = new Map(
    (input.toolResolutions ?? []).map((resolution) => [resolution.stepId, resolution]),
  );
  const stepApprovals = input.plan.steps.map((step) =>
    classifyStepWithResolution(step, resolutionByStepId.get(step.id)),
  );
  const requiresUserApproval = stepApprovals.some((step) => step.requiresApproval);
  const riskLevel = maxRisk(stepApprovals.map((step) => step.riskLevel));
  const approvalScope = overallScope(stepApprovals);

  return {
    planId: input.plan.id,
    goalId: input.plan.goalId,
    overallStatus: requiresUserApproval ? "pending" : "not_required",
    stepApprovals,
    approvalScope,
    requiresUserApproval,
    approvalSummary: approvalSummaryFor(stepApprovals),
    riskLevel,
    generatedAt,
    reasons: [
      "Approval Model V1 classifies proposed steps only.",
      "No step is approved or rejected without an explicit future user action.",
      "No execution, tools, network calls, or data mutations are performed.",
    ],
  };
}
