import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
  },
}));

import { tasksService, TaskServiceError } from "./tasksService";

const now = new Date("2026-07-10T09:00:00.000Z");

function taskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    user_id: "user-1",
    title: "Sensitive title",
    notes: "Sensitive notes",
    due_date: null,
    completed: false,
    completed_at: null,
    created_at: "2026-07-09T09:00:00.000Z",
    updated_at: "2026-07-09T09:00:00.000Z",
    ...overrides,
  };
}

function readQuery(response: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => response),
  };
  return query;
}

function updateQuery(response: { data: unknown; error: unknown }) {
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(async () => response),
  };
  return query;
}

describe("tasksService.completeTask", () => {
  beforeEach(() => {
    fromMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  it("marks an incomplete owned task complete and sets completed_at once", async () => {
    const read = readQuery({ data: taskRow(), error: null });
    const update = updateQuery({
      data: taskRow({ completed: true, completed_at: now.toISOString() }),
      error: null,
    });
    fromMock.mockReturnValueOnce(read).mockReturnValueOnce(update);

    const result = await tasksService.completeTask(" user-1 ", " task-1 ");

    expect(result).toMatchObject({
      id: "task-1",
      completed: true,
      completedAt: now.toISOString(),
    });
    expect(read.eq).toHaveBeenCalledWith("id", "task-1");
    expect(read.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(update.update).toHaveBeenCalledWith({
      completed: true,
      completed_at: now.toISOString(),
    });
    expect(update.eq).toHaveBeenCalledWith("id", "task-1");
    expect(update.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns an already completed task unchanged without issuing a mutation", async () => {
    const completedAt = "2026-07-09T10:00:00.000Z";
    const read = readQuery({
      data: taskRow({ completed: true, completed_at: completedAt }),
      error: null,
    });
    fromMock.mockReturnValueOnce(read);

    const result = await tasksService.completeTask("user-1", "task-1");

    expect(result.completed).toBe(true);
    expect(result.completedAt).toBe(completedAt);
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("is state-idempotent and does not move completed_at on the second call", async () => {
    const completedAt = now.toISOString();
    const firstRead = readQuery({ data: taskRow(), error: null });
    const firstUpdate = updateQuery({
      data: taskRow({ completed: true, completed_at: completedAt }),
      error: null,
    });
    const secondRead = readQuery({
      data: taskRow({ completed: true, completed_at: completedAt }),
      error: null,
    });
    fromMock
      .mockReturnValueOnce(firstRead)
      .mockReturnValueOnce(firstUpdate)
      .mockReturnValueOnce(secondRead);

    const first = await tasksService.completeTask("user-1", "task-1");
    vi.setSystemTime(new Date("2026-07-10T10:00:00.000Z"));
    const second = await tasksService.completeTask("user-1", "task-1");

    expect(first.completedAt).toBe(completedAt);
    expect(second.completedAt).toBe(completedAt);
    expect(firstUpdate.update).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledTimes(3);
  });

  it("fails safely when no owned task is found", async () => {
    fromMock.mockReturnValueOnce(readQuery({ data: null, error: null }));

    await expect(tasksService.completeTask("user-1", "task-1")).rejects.toMatchObject({
      code: "TASK_NOT_FOUND",
      message: "Task was not found for this user.",
    });
  });

  it("rejects invalid userId and taskId before querying Supabase", async () => {
    await expect(tasksService.completeTask("", "task-1")).rejects.toBeInstanceOf(TaskServiceError);
    await expect(tasksService.completeTask("user-1", " ")).rejects.toMatchObject({
      code: "INVALID_TASK_INPUT",
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("normalizes Supabase read and mutation errors", async () => {
    fromMock.mockReturnValueOnce(readQuery({ data: null, error: { message: "raw read" } }));
    await expect(tasksService.completeTask("user-1", "task-1")).rejects.toMatchObject({
      code: "TASK_READ_FAILED",
      message: "Unable to load task.",
    });

    fromMock.mockReset();
    fromMock
      .mockReturnValueOnce(readQuery({ data: taskRow(), error: null }))
      .mockReturnValueOnce(updateQuery({ data: null, error: { message: "raw write" } }));
    await expect(tasksService.completeTask("user-1", "task-1")).rejects.toMatchObject({
      code: "TASK_COMPLETE_FAILED",
      message: "Unable to complete task.",
    });
  });
});
