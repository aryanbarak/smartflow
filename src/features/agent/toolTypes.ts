import type {
  WorkspaceApprovalModel,
  WorkspaceApprovalRiskLevel,
  WorkspaceApprovalScope,
  WorkspacePlanStep,
  WorkspaceStepApproval,
} from "../workspace/workspaceTypes";

export type AgentToolDomain =
  | "tasks"
  | "calendar"
  | "habits"
  | "finance"
  | "documents"
  | "learning"
  | "conversations"
  | "workspace"
  | "system";

export type AgentToolCapability =
  | "inspect"
  | "search"
  | "open"
  | "summarize"
  | "create"
  | "update"
  | "delete"
  | "send"
  | "schedule"
  | "complete"
  | "analyze"
  | "recommend";

export type AgentToolMode = "read" | "write" | "mixed";
export type AgentToolRiskLevel = WorkspaceApprovalRiskLevel;
export type AgentToolApprovalScope = WorkspaceApprovalScope;

export type AgentToolSchemaFieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "array"
  | "object"
  | "enum";

export interface AgentToolSchemaField {
  name: string;
  type: AgentToolSchemaFieldType;
  required: boolean;
  description: string;
  enumValues?: string[];
  sensitive?: boolean;
  defaultValue?: string | number | boolean | string[] | null;
}

export interface AgentToolOutputSchema {
  type: AgentToolSchemaFieldType;
  description: string;
  fields?: AgentToolSchemaField[];
  containsSensitiveData?: boolean;
}

export interface AgentToolExample {
  title: string;
  input: Record<string, unknown>;
  expectedOutcome: string;
}

export interface AgentToolDefinition {
  id: string;
  name: string;
  description: string;
  domain: AgentToolDomain;
  capability: AgentToolCapability;
  mode: AgentToolMode;
  riskLevel: AgentToolRiskLevel;
  requiresApproval: boolean;
  approvalScope: AgentToolApprovalScope;
  reversible: boolean;
  externalEffect: boolean;
  inputSchema: AgentToolSchemaField[];
  outputSchema: AgentToolOutputSchema;
  enabled: boolean;
  version: string;
  tags: string[];
  examples: AgentToolExample[];
  constraints: string[];
}

export interface AgentToolValidationResult {
  valid: boolean;
  errors: string[];
}

export interface AgentToolRiskSummary {
  riskLevel: AgentToolRiskLevel;
  requiresApproval: boolean;
  approvalScope: AgentToolApprovalScope;
  reversible: boolean;
  externalEffect: boolean;
  executionEligible: boolean;
  reasons: string[];
}

export interface AgentToolApprovalCheck {
  tool: AgentToolDefinition;
  approval?: WorkspaceApprovalModel | null;
}

export type ExecutionPolicyStatus =
  | "allowed"
  | "denied"
  | "approval_required"
  | "tool_not_found"
  | "tool_disabled"
  | "invalid_mapping"
  | "risk_mismatch"
  | "scope_insufficient"
  | "domain_mismatch"
  | "capability_mismatch";

export type ExecutionPolicyCheckSeverity = "info" | "warning" | "blocking";

export interface ExecutionPolicyCheck {
  id: string;
  passed: boolean;
  reason: string;
  severity: ExecutionPolicyCheckSeverity;
}

export interface ExecutionPolicyContext {
  planId?: string;
  approvalModel?: WorkspaceApprovalModel | null;
  stepRiskLevel?: WorkspaceApprovalRiskLevel;
}

export interface ExecutionPolicyInput {
  step?: WorkspacePlanStep | null;
  approval?: WorkspaceStepApproval | null;
  tool?: AgentToolDefinition | null;
  currentTime?: Date;
  context?: ExecutionPolicyContext;
}

export interface ExecutionPolicyDecision {
  status: ExecutionPolicyStatus;
  allowed: boolean;
  reasons: string[];
  effectiveRiskLevel: WorkspaceApprovalRiskLevel;
  requiredApprovalScope: WorkspaceApprovalScope;
  matchedToolId?: string;
  stepId: string;
  evaluatedAt: string;
  policyVersion: "execution-policy-v1";
  checks: ExecutionPolicyCheck[];
}
