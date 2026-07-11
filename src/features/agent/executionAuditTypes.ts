import type {
  WorkspaceApprovalRiskLevel,
  WorkspaceApprovalScope,
  WorkspaceStepApprovalStatus,
} from "../workspace/workspaceTypes";
import type { ExecutionStatus } from "./executionTypes";
import type { ExecutionPolicyDecision } from "./toolTypes";

export type ExecutionAuditStatus = "started" | ExecutionStatus;
export type ExecutionAuditSource = "agent" | "workspace" | "manual";

export type ExecutionAuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | ExecutionAuditMetadataValue[]
  | { [key: string]: ExecutionAuditMetadataValue };

export type ExecutionAuditMetadata = Record<string, ExecutionAuditMetadataValue>;

export interface ExecutionAuditRecord {
  auditId: string;
  requestId: string;
  stepId: string;
  toolId: string;
  status: ExecutionAuditStatus;
  policyStatus: ExecutionPolicyDecision["status"];
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorCode?: string;
  riskLevel: WorkspaceApprovalRiskLevel;
  approvalStatus?: WorkspaceStepApprovalStatus;
  approvalScope?: WorkspaceApprovalScope;
  source: ExecutionAuditSource;
  executionVersion: "execution-engine-v1";
  policyVersion: "execution-policy-v1";
  auditVersion: "execution-audit-v1";
  metadata: ExecutionAuditMetadata;
}
