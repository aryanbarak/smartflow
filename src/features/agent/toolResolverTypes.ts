import type {
  WorkspacePlanStep,
  WorkspaceApprovalRiskLevel,
} from "../workspace/workspaceTypes";
import type { AgentToolDefinition } from "./toolTypes";

export type ToolResolutionStatus =
  | "resolved"
  | "unresolved"
  | "ambiguous"
  | "tool_not_found"
  | "tool_disabled"
  | "domain_mismatch"
  | "capability_mismatch"
  | "unsupported_action"
  | "missing_context";

export type ToolResolutionConfidence = "low" | "medium" | "high";

export interface ToolResolutionInput {
  step?: WorkspacePlanStep | null;
  availableTools?: AgentToolDefinition[];
  context?: Record<string, unknown>;
  currentTime?: Date;
  /**
   * When the caller already knows the exact tool (e.g. the deterministic
   * intent validator's intentToolMap), pass it here to skip the
   * domain+actionType lookup table. All other checks — registry existence,
   * enabled, the read-only allowlist, domain/capability sanity matching —
   * still run unchanged. Plan-driven callers that don't know a tool in
   * advance should omit this and keep using domain+actionType.
   */
  expectedToolId?: string;
}

export interface ToolResolutionCandidate {
  toolId: string;
  score: number;
  domainMatch: boolean;
  capabilityMatch: boolean;
  modeMatch: boolean;
  enabled: boolean;
  reasons: string[];
}

export interface ToolResolutionResult {
  status: ToolResolutionStatus;
  resolved: boolean;
  stepId: string;
  toolId?: string;
  tool?: AgentToolDefinition;
  confidence: ToolResolutionConfidence;
  reasons: string[];
  candidates: ToolResolutionCandidate[];
  requiredInput: string[];
  generatedAt: string;
  resolverVersion: "tool-resolver-v1";
}

export interface ResolvedToolApprovalMetadata {
  toolId?: string;
  toolName?: string;
  toolDescription?: string;
  toolCapability?: AgentToolDefinition["capability"];
  toolMode?: AgentToolDefinition["mode"];
  toolRiskLevel?: WorkspaceApprovalRiskLevel;
}
