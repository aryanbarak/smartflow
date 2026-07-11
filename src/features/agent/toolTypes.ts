import type {
  WorkspaceApprovalModel,
  WorkspaceApprovalRiskLevel,
  WorkspaceApprovalScope,
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
