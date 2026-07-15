import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import { buildTaskAssistantRequestBody } from "./TasksPage";

describe("TasksPage task assistant language boundary", () => {
  it("inlines a fixed Persian response instruction into the task chat request", () => {
    const body = buildTaskAssistantRequestBody({
      context: "[Task context]\nOpen: 2, Completed: 1]",
      question: "Which tasks should I focus on?",
      sessionId: "session-1",
      responseLanguage: "fa",
    });

    expect(body.responseLanguage).toBe("fa");
    expect(body.responseLanguageInstruction).toContain("فارسی");
    expect(body.message).toContain(body.responseLanguageInstruction);
    expect(body.message).toContain("User question: Which tasks should I focus on?");
    expect(body.message).not.toContain("only respond in English");
    expect(body.message).not.toContain("only communicate in English");
  });

  it("inlines a fixed German response instruction into the task chat request", () => {
    const body = buildTaskAssistantRequestBody({
      context: "[Task context]\nOpen: 2, Completed: 1]",
      question: "Welche Aufgaben habe ich heute?",
      sessionId: "session-1",
      responseLanguage: "de",
    });

    expect(body.responseLanguage).toBe("de");
    expect(body.responseLanguageInstruction).toContain("Deutsch");
    expect(body.message).toContain(body.responseLanguageInstruction);
    expect(body.message).toContain("Welche Aufgaben habe ich heute?");
    expect(body.message).not.toContain("only respond in English");
  });
});
