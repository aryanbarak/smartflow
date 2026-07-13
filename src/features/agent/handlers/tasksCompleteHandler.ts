import { tasksService, TaskServiceError } from "@/features/tasks/tasksService";
import type {
  AgentWriteToolExecutionResult,
  AgentWriteToolHandler,
  ExecutionError,
  ExecutionInputValidationResult,
} from "../executionTypes";
import type { AgentToolSchemaField } from "../toolTypes";

export interface TasksCompleteHandlerOutput {
  taskId: string;
  completed: true;
  completedAt: string;
  alreadyCompleted: boolean;
  verified: boolean;
}

type TasksCompleteInput = {
  userId: string;
  taskId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function executionError(code: string, message: string, retryable = false): ExecutionError {
  return { code, message, retryable };
}

function validateTasksCompleteInput(input: unknown): ExecutionInputValidationResult {
  if (!isRecord(input)) {
    return { valid: false, errors: ["Input must be an object."] };
  }

  const errors: string[] = [];
  const allowedFields = new Set(["userId", "taskId"]);

  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) {
      errors.push(`${key} is not allowed for tasks.complete.`);
    }
  }

  if (typeof input.userId !== "string" || input.userId.trim().length === 0) {
    errors.push("userId is required.");
  }
  if (typeof input.taskId !== "string" || input.taskId.trim().length === 0) {
    errors.push("taskId is required.");
  }

  return { valid: errors.length === 0, errors };
}

function normalizeInput(input: Record<string, unknown>): TasksCompleteInput {
  return {
    userId: String(input.userId).trim(),
    taskId: String(input.taskId).trim(),
  };
}

function failure(
  status: AgentWriteToolExecutionResult<TasksCompleteHandlerOutput>["status"],
  code: string,
  message: string,
  taskId?: string,
): AgentWriteToolExecutionResult<TasksCompleteHandlerOutput> {
  return {
    status,
    success: false,
    error: executionError(code, message),
    auditMetadata: {
      taskId,
      alreadyCompleted: undefined,
      verified: false,
      resultShape: "object",
      redacted: true,
    },
  };
}

export const tasksCompleteHandler: AgentWriteToolHandler<TasksCompleteHandlerOutput> = {
  toolId: "tasks.complete",
  mode: "write",
  timeoutMs: 3000,
  readOnly: false,
  externalEffect: true,
  reversible: true,
  requiresVerification: true,
  validateInput(input: unknown, _schema: readonly AgentToolSchemaField[]) {
    return validateTasksCompleteInput(input);
  },
  async execute(input: Record<string, unknown>) {
    const validation = validateTasksCompleteInput(input);
    if (!validation.valid) {
      return failure("invalid_input", "INVALID_INPUT", "tasks.complete input failed validation.");
    }

    const { userId, taskId } = normalizeInput(input);

    try {
      const before = await tasksService.getTaskForUser(userId, taskId);
      const completed = await tasksService.completeTask(userId, taskId);
      const verifiedReadback = await tasksService.getTaskForUser(userId, taskId);
      const repeated = await tasksService.completeTask(userId, taskId);
      const completedAt = completed.completedAt ?? null;

      const verified =
        completed.id === taskId &&
        verifiedReadback.id === taskId &&
        repeated.id === taskId &&
        completed.completed === true &&
        verifiedReadback.completed === true &&
        repeated.completed === true &&
        typeof completedAt === "string" &&
        completedAt.length > 0 &&
        verifiedReadback.completedAt === completedAt &&
        repeated.completedAt === completedAt;

      if (!verified) {
        return {
          ...failure("verification_failed", "VERIFICATION_FAILED", "Task completion could not be verified.", taskId),
          compensation: {
            taskId,
            previousCompleted: before.completed,
            previousCompletedAt: before.completedAt ?? null,
          },
        };
      }

      const alreadyCompleted = before.completed === true;
      const data: TasksCompleteHandlerOutput = Object.freeze({
        taskId,
        completed: true,
        completedAt,
        alreadyCompleted,
        verified: true,
      });

      return {
        status: "success",
        success: true,
        data,
        auditMetadata: {
          taskId,
          alreadyCompleted,
          verified: true,
          resultShape: "object",
          redacted: true,
        },
        compensation: {
          taskId,
          previousCompleted: before.completed,
          previousCompletedAt: before.completedAt ?? null,
        },
      };
    } catch (caught) {
      if (caught instanceof TaskServiceError) {
        return failure("failed", caught.code, caught.message, taskId);
      }

      return failure("failed", "TASK_COMPLETE_FAILED", "Unable to complete task.", taskId);
    }
  },
};
