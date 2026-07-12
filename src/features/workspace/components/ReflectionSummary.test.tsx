import { describe, expect, it, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import { ReflectionSummary } from "./ReflectionSummary";
import { useAppearance } from "@/features/settings/appearanceStore";
import { translations } from "@/i18n";
import type {
  AgentReflectionResult,
  ReadOnlyRuntimeResult,
} from "@/features/agent";

const now = "2026-07-10T09:00:00.000Z";

function reflection(
  overrides: Partial<AgentReflectionResult> = {},
): AgentReflectionResult {
  return {
    id: "reflection-1",
    requestId: "request-secret",
    stepId: "step-secret",
    goalId: "goal-1",
    toolId: "tasks.list",
    outcome: "successful",
    usefulness: "high",
    goalProgress: "supported",
    stepAssessment: "information_gathered",
    confidence: "high",
    summary: "raw-secret-summary",
    evidence: [{
      toolId: "tasks.list",
      domain: "tasks",
      outcome: "successful",
      usefulness: "high",
      goalProgress: "supported",
      itemCount: 8,
      timestamp: now,
    }],
    suggestedFollowUp: "raw planner follow-up",
    retainAsMemoryEvidence: true,
    generatedAt: now,
    reflectionVersion: "reflection-engine-v1",
    ...overrides,
  };
}

function result(
  overrides: Partial<ReadOnlyRuntimeResult> = {},
  reflectionOverrides: Partial<AgentReflectionResult> = {},
): ReadOnlyRuntimeResult {
  return {
    requestId: "request-secret",
    stepId: "step-secret",
    toolId: "tasks.list",
    status: "success",
    success: true,
    reflection: reflection(reflectionOverrides),
    memoryEvidenceRetained: false,
    safeSummary: "8 active tasks found.",
    safePreviewItems: [],
    reasons: [],
    startedAt: now,
    completedAt: now,
    durationMs: 0,
    ...overrides,
  };
}

describe("ReflectionSummary", () => {
  afterEach(() => {
    useAppearance.setState({ language: "en" });
  });

  it("renders successful reflection without implying completed work", () => {
    const html = renderToString(<ReflectionSummary result={result()} />);

    expect(html).toContain("Reflection");
    expect(html).toContain("Information gathered");
    expect(html).toContain("This supports today&#x27;s goal.");
    expect(html).toContain("You now have a clearer view of the active work.");
    expect(html).not.toContain("goal completed");
    expect(html).not.toContain("task completed");
    expect(html).not.toContain("plan completed");
  });

  it("renders empty reflection as useful information, not failure", () => {
    const html = renderToString(
      <ReflectionSummary
        result={result(
          { safeSummary: "No active tasks found." },
          {
            outcome: "empty",
            usefulness: "medium",
            goalProgress: "informed",
            stepAssessment: "information_gathered",
          },
        )}
      />,
    );

    expect(html).toContain("No matching items found");
    expect(html).toContain("No active task requires attention right now.");
    expect(html).not.toContain("The step failed");
  });

  it("renders policy denied, timeout, failed, and invalid states safely", () => {
    expect(renderToString(
      <ReflectionSummary result={result({ status: "policy_denied", success: false }, {
        outcome: "policy_denied",
        goalProgress: "none",
        stepAssessment: "blocked",
      })} />,
    )).toContain("Action not allowed");

    expect(renderToString(
      <ReflectionSummary result={result({ status: "timeout", success: false }, {
        outcome: "timeout",
        goalProgress: "none",
        stepAssessment: "failed",
      })} />,
    )).toContain("The action took too long");

    expect(renderToString(
      <ReflectionSummary result={result({ status: "failed", success: false }, {
        outcome: "failed",
        goalProgress: "none",
        stepAssessment: "failed",
      })} />,
    )).toContain("The action could not be completed");

    expect(renderToString(
      <ReflectionSummary result={result({ status: "failed", success: false }, {
        outcome: "invalid",
        goalProgress: "none",
        stepAssessment: "failed",
      })} />,
    )).toContain("The result could not be verified");
  });

  it("maps supported tools to safe user-facing reflection copy", () => {
    expect(renderToString(
      <ReflectionSummary result={result({ toolId: "calendar.list_today" }, { toolId: "calendar.list_today" })} />,
    )).toContain("Today&#x27;s calendar information is clearer.");
    expect(renderToString(
      <ReflectionSummary result={result({ toolId: "calendar.list_today" }, {
        toolId: "calendar.list_today",
        outcome: "empty",
      })} />,
    )).toContain("This may leave room for focused work.");
    expect(renderToString(
      <ReflectionSummary result={result({ toolId: "learning.get_progress" }, { toolId: "learning.get_progress" })} />,
    )).toContain("Your learning continuity is clearer.");
    expect(renderToString(
      <ReflectionSummary result={result({ toolId: "workspace.get_context" }, { toolId: "workspace.get_context" })} />,
    )).toContain("Flow AI now has the current workspace context.");
  });

  it("shows memory notice only when retained", () => {
    expect(renderToString(
      <ReflectionSummary result={result({ memoryEvidenceRetained: true })} />,
    )).toContain("This will help prepare your next workspace.");
    expect(renderToString(
      <ReflectionSummary result={result({ memoryEvidenceRetained: false })} />,
    )).not.toContain("This will help prepare your next workspace.");
  });

  it("does not render before a terminal result or without reflection", () => {
    expect(renderToString(<ReflectionSummary result={null} />)).toBe("");
    expect(renderToString(
      <ReflectionSummary result={result({ reflection: undefined })} />,
    )).toBe("");
  });

  it("does not expose raw reflection JSON, audit internals, policy internals, or ids", () => {
    const html = renderToString(
      <ReflectionSummary
        result={result({
          memoryEvidenceRetained: true,
          reasons: ["policyDecision", "audit-record"],
        })}
      />,
    );

    expect(html).not.toContain("request-secret");
    expect(html).not.toContain("step-secret");
    expect(html).not.toContain("raw-secret-summary");
    expect(html).not.toContain("raw planner follow-up");
    expect(html).not.toContain("policyDecision");
    expect(html).not.toContain("audit-record");
    expect(html).not.toContain("{");
  });

  it("keeps direction explicit and includes Farsi reflection translations", () => {
    useAppearance.setState({ language: "fa" });
    const html = renderToString(<ReflectionSummary result={result()} />);

    expect(html).toContain("dir=");
    expect(translations.fa.reflection_section_label).toBeTruthy();
    expect(translations.fa.reflection_outcome_successful).toBeTruthy();
    expect(html).toContain("Information gathered");
  });
});
