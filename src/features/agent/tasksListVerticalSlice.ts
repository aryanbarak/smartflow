import { canStartReadOnlyRun, runReadOnlyTool } from "./readOnlyRuntime";
import { presentReadOnlyResult } from "./readOnlyResultPresenter";
import type {
  ExecutionContextTask,
  ExecutionEngineDependencies,
  ExecutionResult,
} from "./executionTypes";
import type { ToolResolutionResult } from "./toolResolverTypes";
import type {
  WorkspacePlanStep,
  WorkspaceStepApproval,
} from "../workspace/workspaceTypes";

export type TasksListRunStatus =
  | "idle"
  | "ready"
  | "running"
  | "success"
  | "denied"
  | "failed";

export interface TasksListVerticalSliceInput {
  step?: WorkspacePlanStep | null;
  resolution?: ToolResolutionResult | null;
  approval?: WorkspaceStepApproval | null;
  tasks: readonly ExecutionContextTask[];
  currentTime?: Date;
  requestId?: string;
}

export interface TasksListVerticalSliceResult {
  status: Exclude<TasksListRunStatus, "idle" | "ready" | "running">;
  summary: string;
  safeTaskTitles: string[];
  executionResult?: ExecutionResult;
}

export function canStartTasksListRun(status: TasksListRunStatus) {
  return canStartReadOnlyRun(status);
}

export function summarizeTasksListResult(result: ExecutionResult): Pick<
  TasksListVerticalSliceResult,
  "status" | "summary" | "safeTaskTitles"
> {
  const presentation = presentReadOnlyResult(result);

  return {
    status: result.status === "success" ? "success" : result.status === "policy_denied" ? "denied" : "failed",
    summary: presentation.safeSummary,
    safeTaskTitles: presentation.safePreviewItems,
  };
}

export async function runTasksListVerticalSlice(
  input: TasksListVerticalSliceInput,
  dependencies: Partial<ExecutionEngineDependencies> = {},
): Promise<TasksListVerticalSliceResult> {
  const result = await runReadOnlyTool({
    requestId: input.requestId,
    step: input.step,
    toolResolution: input.resolution,
    approval: input.approval,
    executionInput: {},
    executionContext: {
      tasks: input.tasks,
    },
    currentTime: input.currentTime,
  }, dependencies);

  return {
    status: result.status === "success" ? "success" : result.status === "failed" ? "failed" : "denied",
    summary: result.status === "failed"
      ? "The read-only task check could not run."
      : result.safeSummary,
    safeTaskTitles: result.safePreviewItems,
    executionResult: result.executionResult,
  };
}
