import type { ExecutionResult } from "./executionTypes";

export interface ReadOnlyResultPresentation {
  safeSummary: string;
  safePreviewItems: string[];
}

interface TasksListData {
  tasks?: Array<{
    title?: string;
    status?: string;
  }>;
}

interface CalendarListTodayData {
  events?: Array<{
    title?: string;
  }>;
}

interface LearningGetProgressData {
  lessons?: Array<{
    title?: string;
  }>;
}

interface GitHubRepositoriesData {
  connectionStatus?: string;
  repositories?: Array<{ name?: string; owner?: string }>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function countSummary(count: number, zero: string, one: string, many: (count: number) => string) {
  if (count === 0) return zero;
  if (count === 1) return one;
  return many(count);
}

function tasksPresentation(data: unknown): ReadOnlyResultPresentation {
  const tasks = isObject(data) && Array.isArray((data as TasksListData).tasks)
    ? (data as TasksListData).tasks ?? []
    : [];
  const activeTasks = tasks.filter((task) => task.status !== "completed");

  return {
    safeSummary: countSummary(
      activeTasks.length,
      "No active tasks found.",
      "1 active task found.",
      (count) => `${count} active tasks found.`,
    ),
    safePreviewItems: activeTasks
      .map((task) => task.title)
      .filter((title): title is string => Boolean(title))
      .slice(0, 3),
  };
}

function calendarPresentation(data: unknown): ReadOnlyResultPresentation {
  const events = isObject(data) && Array.isArray((data as CalendarListTodayData).events)
    ? (data as CalendarListTodayData).events ?? []
    : [];

  return {
    safeSummary: countSummary(
      events.length,
      "No events today.",
      "1 event found today.",
      (count) => `${count} events found today.`,
    ),
    safePreviewItems: events
      .map((event) => event.title)
      .filter((title): title is string => Boolean(title))
      .slice(0, 3),
  };
}

function learningPresentation(data: unknown): ReadOnlyResultPresentation {
  const lessons = isObject(data) && Array.isArray((data as LearningGetProgressData).lessons)
    ? (data as LearningGetProgressData).lessons ?? []
    : [];

  return {
    safeSummary: countSummary(
      lessons.length,
      "No learning progress found.",
      "1 learning item found.",
      (count) => `${count} learning items found.`,
    ),
    safePreviewItems: lessons
      .map((lesson) => lesson.title)
      .filter((title): title is string => Boolean(title))
      .slice(0, 3),
  };
}

function githubPresentation(data: unknown): ReadOnlyResultPresentation {
  const value = isObject(data) ? data as GitHubRepositoriesData : {};
  if (value.connectionStatus === "not_connected") {
    return { safeSummary: "GitHub is not connected.", safePreviewItems: [] };
  }
  const repositories = Array.isArray(value.repositories) ? value.repositories.slice(0, 20) : [];
  return {
    safeSummary: countSummary(
      repositories.length,
      "No connected GitHub repositories found.",
      "1 connected GitHub repository found.",
      (count) => `${count} connected GitHub repositories found.`,
    ),
    safePreviewItems: repositories
      .map((item) => item.owner && item.name ? `${item.owner}/${item.name}` : undefined)
      .filter((item): item is string => Boolean(item))
      .slice(0, 6),
  };
}

export function presentReadOnlyResult(result: ExecutionResult): ReadOnlyResultPresentation {
  if (result.status !== "success") {
    if (result.status === "policy_denied") {
      return {
        safeSummary: "Run blocked by safety policy.",
        safePreviewItems: [],
      };
    }

    return {
      safeSummary: "The read-only action could not run.",
      safePreviewItems: [],
    };
  }

  switch (result.toolId) {
    case "tasks.list":
      return tasksPresentation(result.data);
    case "calendar.list_today":
      return calendarPresentation(result.data);
    case "learning.get_progress":
      return learningPresentation(result.data);
    case "workspace.get_context":
      return {
        safeSummary: "Workspace context loaded.",
        safePreviewItems: [],
      };
    case "github.repositories.list":
      return githubPresentation(result.data);
    default:
      return {
        safeSummary: "The read-only action completed.",
        safePreviewItems: [],
      };
  }
}
