import { getExecutionAuditRecordsByRequestId } from "./executionAudit";
import { reflectOnExecution } from "./reflectionEngine";
import type { ExecutionAuditRecord } from "./executionAuditTypes";
import type { AgentReflectionInput, AgentReflectionResult } from "./reflectionTypes";
import type { ExecutionResult } from "./executionTypes";
import type { ToolResolutionResult } from "./toolResolverTypes";
import {
  loadWorkspaceMemory,
  saveWorkspaceMemory,
} from "../workspace/workspaceMemoryStorage";
import type {
  Workspace,
  WorkspaceMemory,
  WorkspacePlan,
  WorkspacePlanStep,
  WorkspaceReflectionEvidence,
  WorkspaceReflectionEvidenceDomain,
} from "../workspace/workspaceTypes";

const MAX_REFLECTION_EVIDENCE = 30;
const REFLECTION_EVIDENCE_SCHEMA_VERSION = 1 as const;

export interface ReflectionIntegrationInput {
  executionResult: ExecutionResult;
  step: WorkspacePlanStep;
  toolResolution: ToolResolutionResult;
  workspace?: Workspace | null;
  auditRecords?: readonly ExecutionAuditRecord[];
  reflectedAt?: Date;
  storage?: Storage;
}

export interface ReflectionIntegrationResult {
  reflection?: AgentReflectionResult;
  memoryEvidenceRetained: boolean;
}

function evidenceKey(item: Pick<WorkspaceReflectionEvidence, "requestId" | "stepId" | "toolId">) {
  return `${item.requestId}:${item.stepId}:${item.toolId}`;
}

function isSupportedReflectionDomain(value: unknown): value is WorkspaceReflectionEvidenceDomain {
  return (
    value === "tasks" ||
    value === "calendar" ||
    value === "finance" ||
    value === "habits" ||
    value === "documents" ||
    value === "learning" ||
    value === "workspace"
  );
}

export function toWorkspaceReflectionEvidence(
  reflection: AgentReflectionResult,
  retainedAt = new Date(),
): WorkspaceReflectionEvidence | undefined {
  if (!reflection.retainAsMemoryEvidence) return undefined;
  if (reflection.confidence === "low") return undefined;
  if (reflection.outcome !== "successful" && reflection.outcome !== "empty") return undefined;
  if (reflection.usefulness === "none") return undefined;
  if (reflection.goalProgress !== "informed" && reflection.goalProgress !== "supported") {
    return undefined;
  }
  if (!reflection.requestId || !reflection.stepId || !reflection.toolId) return undefined;

  const domain = reflection.evidence.find((item) => isSupportedReflectionDomain(item.domain))?.domain;
  if (!isSupportedReflectionDomain(domain)) return undefined;

  return {
    id: `reflection-evidence:${reflection.requestId}:${reflection.stepId}:${reflection.toolId}`,
    requestId: reflection.requestId,
    stepId: reflection.stepId,
    toolId: reflection.toolId,
    domain,
    outcome: reflection.outcome,
    usefulness: reflection.usefulness,
    goalProgress: reflection.goalProgress,
    reflectedAt: reflection.generatedAt,
    retainedAt: retainedAt.toISOString(),
    schemaVersion: REFLECTION_EVIDENCE_SCHEMA_VERSION,
  };
}

export function appendWorkspaceReflectionEvidence(
  memory: WorkspaceMemory,
  evidence: WorkspaceReflectionEvidence,
): { memory: WorkspaceMemory; retained: boolean } {
  const key = evidenceKey(evidence);
  if (memory.recentReflectionEvidence.some((item) => evidenceKey(item) === key)) {
    return {
      memory,
      retained: false,
    };
  }

  return {
    memory: {
      ...memory,
      updatedAt: evidence.retainedAt,
      recentReflectionEvidence: [
        ...memory.recentReflectionEvidence,
        evidence,
      ].slice(-MAX_REFLECTION_EVIDENCE),
    },
    retained: true,
  };
}

function createReflectionInput(input: ReflectionIntegrationInput): AgentReflectionInput | null {
  const workspace = input.workspace;
  if (!workspace) return null;

  return {
    executionResult: input.executionResult,
    auditRecords: input.auditRecords ?? getExecutionAuditRecordsByRequestId(input.executionResult.requestId),
    step: input.step,
    goal: workspace.goal,
    plan: workspace.plan as WorkspacePlan,
    toolResolution: input.toolResolution,
    reflectedAt: input.reflectedAt ?? new Date(),
  };
}

export function processReadOnlyReflection(
  input: ReflectionIntegrationInput,
): ReflectionIntegrationResult {
  const reflectionInput = createReflectionInput(input);
  if (!reflectionInput) {
    return {
      memoryEvidenceRetained: false,
    };
  }

  const reflection = reflectOnExecution(reflectionInput);
  const evidence = toWorkspaceReflectionEvidence(reflection, input.reflectedAt ?? new Date());
  if (!evidence) {
    return {
      reflection,
      memoryEvidenceRetained: false,
    };
  }

  const existingMemory = loadWorkspaceMemory(input.storage);
  const next = appendWorkspaceReflectionEvidence(existingMemory, evidence);
  if (!next.retained) {
    return {
      reflection,
      memoryEvidenceRetained: false,
    };
  }

  return {
    reflection,
    memoryEvidenceRetained: saveWorkspaceMemory(next.memory, input.storage),
  };
}
