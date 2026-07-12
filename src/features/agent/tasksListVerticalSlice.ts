import { executeAgentTool } from "./executionEngine";
import type {
  ExecutionContextTask,
  ExecutionEngineDependencies,
  ExecutionRequest,
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

interface TasksListHandlerData {
  tasks?: Array<{
    id?: string;
    title?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  }>;
}

function timestamp(currentTime?: Date) {
  return (currentTime ?? new Date()).toISOString();
}

function isTasksListData(data: unknown): data is TasksListHandlerData {
  return Boolean(data && typeof data === "object" && Array.isArray((data as TasksListHandlerData).tasks));
}

function activeTasksFrom(data: unknown) {
  if (!isTasksListData(data)) return [];
  return data.tasks?.filter((task) => task.status !== "completed") ?? [];
}

export function canStartTasksListRun(status: TasksListRunStatus) {
  return status !== "running";
}

export function summarizeTasksListResult(result: ExecutionResult): Pick<
  TasksListVerticalSliceResult,
  "status" | "summary" | "safeTaskTitles"
> {
  if (result.status === "success") {
    const activeTasks = activeTasksFrom(result.data);
    const count = activeTasks.length;
    const summary =
      count === 0
        ? "No active tasks found."
        : `${count} active task${count === 1 ? "" : "s"} found.`;
    return {
      status: "success",
      summary,
      safeTaskTitles: activeTasks
        .map((task) => task.title)
        .filter((title): title is string => Boolean(title))
        .slice(0, 3),
    };
  }

  if (result.status === "policy_denied") {
    return {
      status: "denied",
      summary: "Run blocked by safety policy.",
      safeTaskTitles: [],
    };
  }

  return {
    status: "failed",
    summary: "The read-only task check could not run.",
    safeTaskTitles: [],
  };
}

function denied(summary: string): TasksListVerticalSliceResult {
  return {
    status: "denied",
    summary,
    safeTaskTitles: [],
  };
}

function createTasksListRequest(input: Required<Pick<TasksListVerticalSliceInput, "step" | "resolution">> & TasksListVerticalSliceInput): ExecutionRequest {
  const requestedAt = timestamp(input.currentTime);
  return {
    requestId: input.requestId ?? `tasks-list:${input.step.id}:${requestedAt}`,
    step: input.step,
    toolId: "tasks.list",
    approval: input.approval,
    input: {},
    requestedAt,
    context: {
      tasks: input.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
      })),
      currentTime: requestedAt,
    },
  };
}

export async function runTasksListVerticalSlice(
  input: TasksListVerticalSliceInput,
  dependencies: Partial<ExecutionEngineDependencies> = {},
): Promise<TasksListVerticalSliceResult> {
  if (!input.step?.id) {
    return denied("No planned task review step is available.");
  }

  if (
    !input.resolution?.resolved ||
    input.resolution.stepId !== input.step.id ||
    input.resolution.toolId !== "tasks.list"
  ) {
    return denied("No supported read-only task action is available.");
  }

  const executionResult = await executeAgentTool(createTasksListRequest({
    ...input,
    step: input.step,
    resolution: input.resolution,
  }), dependencies);
  const mapped = summarizeTasksListResult(executionResult);

  return {
    ...mapped,
    executionResult,
  };
}
