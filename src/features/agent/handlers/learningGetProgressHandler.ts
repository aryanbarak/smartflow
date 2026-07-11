import type { AgentToolHandler } from "../executionTypes";
import { validateInputAgainstSchema } from "./inputValidation";

export const learningGetProgressHandler: AgentToolHandler = {
  toolId: "learning.get_progress",
  timeoutMs: 1000,
  readOnly: true,
  validateInput: validateInputAgainstSchema,
  execute(_input, context) {
    const progress = context.learningProgress;
    return {
      lessons: (progress?.lessons ?? []).map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        completionPercentage: lesson.completionPercentage,
        completed: lesson.completed,
        lastActivityAt: lesson.lastActivityAt,
      })),
      totalQuestions: progress?.totalQuestions,
      lastActivityAt: progress?.lastActivityAt,
      mode: progress?.mode,
    };
  },
};
