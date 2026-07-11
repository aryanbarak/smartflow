import type {
  WorkspaceApprovalModel,
  WorkspaceApprovalRiskLevel,
  WorkspaceStepApproval,
} from "../workspace/workspaceTypes";
import type {
  AgentToolApprovalScope,
  AgentToolDefinition,
  AgentToolRiskLevel,
  AgentToolRiskSummary,
} from "./toolTypes";

const riskOrder: Record<AgentToolRiskLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

const approvalScopeOrder: Record<AgentToolApprovalScope, number> = {
  view_only: 0,
  single_step: 1,
  multiple_steps: 2,
  entire_plan: 3,
};

function isReadOnlyNoEffect(tool: AgentToolDefinition) {
  return tool.mode === "read" && !tool.externalEffect && !tool.requiresApproval;
}

function maxRisk(...risks: WorkspaceApprovalRiskLevel[]): WorkspaceApprovalRiskLevel {
  return risks.reduce<WorkspaceApprovalRiskLevel>(
    (max, risk) => (riskOrder[risk] > riskOrder[max] ? risk : max),
    "none",
  );
}

function effectiveStepRisk(tool: AgentToolDefinition, step: WorkspaceStepApproval) {
  return maxRisk(tool.riskLevel, step.riskLevel);
}

function approvalHasEnoughScope(tool: AgentToolDefinition, step: WorkspaceStepApproval) {
  return approvalScopeOrder[step.approvalScope] >= approvalScopeOrder[tool.approvalScope];
}

function approvalHasEnoughRisk(tool: AgentToolDefinition, approval: WorkspaceApprovalModel) {
  return riskOrder[approval.riskLevel] >= riskOrder[tool.riskLevel];
}

export function getToolRiskSummary(tool: AgentToolDefinition): AgentToolRiskSummary {
  const reasons: string[] = [];
  if (!tool.enabled) reasons.push("Tool is disabled.");
  if (tool.requiresApproval) reasons.push("Tool requires explicit approval before future execution.");
  if (tool.externalEffect) reasons.push("Tool can affect user data or external systems.");
  if (!tool.reversible) reasons.push("Tool is classified as irreversible.");
  if (isReadOnlyNoEffect(tool)) reasons.push("Tool is read-only and has no external effect.");

  return {
    riskLevel: tool.riskLevel,
    requiresApproval: tool.requiresApproval,
    approvalScope: tool.approvalScope,
    reversible: tool.reversible,
    externalEffect: tool.externalEffect,
    executionEligible: tool.enabled && (!tool.requiresApproval || isReadOnlyNoEffect(tool)),
    reasons,
  };
}

export function isToolAllowedForApproval(
  tool: AgentToolDefinition,
  approval?: WorkspaceApprovalModel | null,
): boolean {
  if (!tool.enabled) return false;
  if (isReadOnlyNoEffect(tool)) return true;
  if (!approval) return false;
  if (approval.overallStatus !== "approved" && approval.overallStatus !== "partially_approved") {
    return false;
  }
  if (!approvalHasEnoughRisk(tool, approval)) return false;

  const approvedSteps = approval.stepApprovals.filter((step) => step.status === "approved");
  if (approvedSteps.length === 0) return false;

  return approvedSteps.some((step) => {
    const effectiveRisk = effectiveStepRisk(tool, step);
    return (
      riskOrder[effectiveRisk] >= riskOrder[tool.riskLevel] &&
      approvalHasEnoughScope(tool, step)
    );
  });
}
