import type {
  Workspace,
  WorkspaceApprovalRiskLevel,
  WorkspacePlanStep,
  WorkspaceStepApproval,
} from "../workspace/workspaceTypes";
import type {
  AgentToolDefinition,
  AgentToolSchemaField,
  ExecutionPolicyContext,
  ExecutionPolicyDecision,
} from "./toolTypes";
import type { ExecutionAuditRecord } from "./executionAuditTypes";

export type ExecutionStatus =
  | "success"
  | "policy_denied"
  | "tool_not_found"
  | "handler_not_found"
  | "invalid_input"
  | "timeout"
  | "failed";

export interface ExecutionContextTask {
  id?: string;
  title?: string;
  completed?: boolean;
  status?: string;
  priority?: string;
  dueDate?: string;
  createdAt?: string;
}

export interface ExecutionContextEvent {
  id?: string;
  title: string;
  dateTimeStart?: string;
  start?: string;
  end?: string;
  location?: string;
}

export interface ExecutionLearningProgressItem {
  id?: string;
  title: string;
  completionPercentage?: number;
  completed?: boolean;
  lastActivityAt?: string;
}

export interface ExecutionLearningProgressSnapshot {
  lessons?: ExecutionLearningProgressItem[];
  totalQuestions?: number;
  lastActivityAt?: string;
  mode?: string;
}

export interface ExecutionContext {
  tasks?: readonly ExecutionContextTask[];
  events?: readonly ExecutionContextEvent[];
  learningProgress?: ExecutionLearningProgressSnapshot | null;
  workspace?: Workspace | null;
  policyContext?: ExecutionPolicyContext;
  currentTime?: string;
}

export interface ExecutionRequest {
  requestId: string;
  step: WorkspacePlanStep;
  toolId: string;
  approval?: WorkspaceStepApproval | null;
  input: Record<string, unknown>;
  requestedAt: string;
  context?: ExecutionContext;
}

export interface ExecutionError {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface ExecutionResult {
  requestId: string;
  stepId: string;
  toolId: string;
  status: ExecutionStatus;
  success: boolean;
  data?: unknown;
  error?: ExecutionError;
  policyDecision: ExecutionPolicyDecision;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  executionVersion: "execution-engine-v1";
  metadata: {
    readOnly: boolean;
    handlerId?: string;
    effectiveRiskLevel: WorkspaceApprovalRiskLevel;
  };
}

export interface ExecutionRecord {
  requestId: string;
  stepId: string;
  toolId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  policyStatus: ExecutionPolicyDecision["status"];
  errorCode?: string;
}

export interface ExecutionInputValidationResult {
  valid: boolean;
  errors: string[];
}

export interface AgentToolHandler {
  toolId: string;
  execute(input: Record<string, unknown>, context: ExecutionContext): unknown | Promise<unknown>;
  validateInput(input: unknown, schema: readonly AgentToolSchemaField[]): ExecutionInputValidationResult;
  timeoutMs: number;
  readOnly: true;
}

export interface ExecutionEngineDependencies {
  getToolById(toolId: string): AgentToolDefinition | undefined;
  getHandlerByToolId(toolId: string): AgentToolHandler | undefined;
  now(): Date;
  appendExecutionAuditRecord(record: ExecutionAuditRecord): ExecutionAuditRecord;
}
