import { beforeEach, describe, expect, it, vi } from "vitest";

const { taskServiceMock, MockTaskServiceError } = vi.hoisted(() => {
  class HoistedTaskServiceError extends Error {
    readonly code: string;
    readonly retryable: boolean;

    constructor(code: string, message: string, retryable = false) {
      super(message);
      this.name = "TaskServiceError";
      this.code = code;
      this.retryable = retryable;
    }
  }

  return {
    taskServiceMock: {
      getTaskForUser: vi.fn(),
      completeTask: vi.fn(),
    },
    MockTaskServiceError: HoistedTaskServiceError,
  };
});

vi.mock("@/features/tasks/tasksService", () => ({
  TaskServiceError: MockTaskServiceError,
  tasksService: taskServiceMock,
}));

import { tasksCompleteHandler } from "./tasksCompleteHandler";

const completedAt = "2026-07-10T09:00:00.000Z";

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    title: "Sensitive task title",
    notes: "Sensitive task notes",
    dueDate: null,
    completed: false,
    completedAt: null,
    createdAt: "2026-07-09T09:00:00.000Z",
    updatedAt: "2026-07-09T09:00:00.000Z",
    ...overrides,
  };
}

describe("tasksCompleteHandler", () => {
  beforeEach(() => {
    taskServiceMock.getTaskForUser.mockReset();
    taskServiceMock.completeTask.mockReset();
  });

  it("describes a write handler without weakening the read-only handler contract", () => {
    expect(tasksCompleteHandler).toMatchObject({
      toolId: "tasks.complete",
      mode: "write",
      readOnly: false,
      externalEffect: true,
      reversible: true,
      requiresVerification: true,
      timeoutMs: 3000,
    });
  });

  it("validates exact input and rejects arbitrary update fields", () => {
    const valid = tasksCompleteHandler.validateInput({ userId: "user-1", taskId: "task-1" }, []);
    const invalid = tasksCompleteHandler.validateInput({
      userId: "user-1",
      taskId: "task-1",
      title: "must not be accepted",
      completed_at: completedAt,
    }, []);

    expect(valid.valid).toBe(true);
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain("title is not allowed for tasks.complete.");
    expect(invalid.errors).toContain("completed_at is not allowed for tasks.complete.");
  });

  it("rejects invalid input without calling the task service", async () => {
    const result = await tasksCompleteHandler.execute({ taskId: "task-1" }, {});

    expect(result.status).toBe("invalid_input");
    expect(result.success).toBe(false);
    expect(taskServiceMock.getTaskForUser).not.toHaveBeenCalled();
    expect(taskServiceMock.completeTask).not.toHaveBeenCalled();
  });

  it("completes a task, verifies persisted state, and emits safe output only", async () => {
    taskServiceMock.getTaskForUser
      .mockResolvedValueOnce(task())
      .mockResolvedValueOnce(task({ completed: true, completedAt }));
    taskServiceMock.completeTask
      .mockResolvedValueOnce(task({ completed: true, completedAt }))
      .mockResolvedValueOnce(task({ completed: true, completedAt }));

    const input = { userId: " user-1 ", taskId: " task-1 " };
    const sourceInput = { ...input };
    const result = await tasksCompleteHandler.execute(input, {});

    expect(input).toEqual(sourceInput);
    expect(result.status).toBe("success");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      taskId: "task-1",
      completed: true,
      completedAt,
      alreadyCompleted: false,
      verified: true,
    });
    expect(Object.keys(result.data as Record<string, unknown>).sort()).toEqual([
      "alreadyCompleted",
      "completed",
      "completedAt",
      "taskId",
      "verified",
    ]);
    expect(JSON.stringify(result)).not.toContain("Sensitive task title");
    expect(JSON.stringify(result)).not.toContain("Sensitive task notes");
    expect(result.auditMetadata).toEqual({
      taskId: "task-1",
      alreadyCompleted: false,
      verified: true,
      resultShape: "object",
      redacted: true,
    });
    expect(result.compensation).toEqual({
      taskId: "task-1",
      previousCompleted: false,
      previousCompletedAt: null,
    });
  });

  it("treats already-completed tasks as successful and idempotent", async () => {
    taskServiceMock.getTaskForUser
      .mockResolvedValueOnce(task({ completed: true, completedAt }))
      .mockResolvedValueOnce(task({ completed: true, completedAt }));
    taskServiceMock.completeTask
      .mockResolvedValueOnce(task({ completed: true, completedAt }))
      .mockResolvedValueOnce(task({ completed: true, completedAt }));

    const result = await tasksCompleteHandler.execute({ userId: "user-1", taskId: "task-1" }, {});

    expect(result.status).toBe("success");
    expect(result.data).toMatchObject({
      alreadyCompleted: true,
      completedAt,
      verified: true,
    });
  });

  it("returns verification_failed when readback or repeated completion does not prove the mutation", async () => {
    taskServiceMock.getTaskForUser
      .mockResolvedValueOnce(task())
      .mockResolvedValueOnce(task({ completed: false, completedAt: null }));
    taskServiceMock.completeTask
      .mockResolvedValueOnce(task({ completed: true, completedAt }))
      .mockResolvedValueOnce(task({ completed: true, completedAt: "2026-07-10T10:00:00.000Z" }));

    const result = await tasksCompleteHandler.execute({ userId: "user-1", taskId: "task-1" }, {});

    expect(result.status).toBe("verification_failed");
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("VERIFICATION_FAILED");
    expect(result.auditMetadata).toMatchObject({
      taskId: "task-1",
      verified: false,
      redacted: true,
    });
  });

  it("normalizes task service errors without leaking raw payloads", async () => {
    taskServiceMock.getTaskForUser.mockRejectedValueOnce(
      new MockTaskServiceError("TASK_NOT_FOUND", "Task was not found for this user."),
    );

    const result = await tasksCompleteHandler.execute({ userId: "user-1", taskId: "task-1" }, {});

    expect(result.status).toBe("failed");
    expect(result.error).toEqual({
      code: "TASK_NOT_FOUND",
      message: "Task was not found for this user.",
      retryable: false,
    });
    expect(JSON.stringify(result)).not.toContain("user-1");
  });
});
