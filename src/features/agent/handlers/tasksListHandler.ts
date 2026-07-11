import type { AgentToolHandler } from "../executionTypes";
import { validateInputAgainstSchema } from "./inputValidation";

export const tasksListHandler: AgentToolHandler = {
  toolId: "tasks.list",
  timeoutMs: 1000,
  readOnly: true,
  validateInput: validateInputAgainstSchema,
  execute(_input, context) {
    return {
      tasks: (context.tasks ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status ?? (task.completed ? "completed" : "open"),
        priority: task.priority,
        dueDate: task.dueDate,
      })),
    };
  },
};
