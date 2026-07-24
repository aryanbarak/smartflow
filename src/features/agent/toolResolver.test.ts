import { describe, expect, it } from "vitest";
import { resolveToolForStep } from "./toolResolver";
import { getToolById } from "./toolRegistry";
import type { AgentToolDefinition } from "./toolTypes";
import type {
  WorkspacePlanActionType,
  WorkspacePlanStep,
  WorkspaceSignalDomain,
} from "../workspace/workspaceTypes";

const now = new Date("2026-07-10T09:00:00.000Z");

function tool(id: string): AgentToolDefinition {
  const found = getToolById(id);
  if (!found) throw new Error(`Missing test tool: ${id}`);
  return found;
}

function step(
  domain: WorkspaceSignalDomain,
  actionType: WorkspacePlanActionType,
  overrides: Partial<WorkspacePlanStep> = {},
): WorkspacePlanStep {
  return {
    id: `step:${domain}:${actionType}`,
    order: 1,
    title: `${domain} ${actionType}`,
    description: `${domain} ${actionType} description.`,
    domain,
    estimatedMinutes: 10,
    status: "proposed",
    actionType,
    reason: "Resolver test.",
    requiresApproval: false,
    dependencies: [],
    optional: false,
    ...overrides,
  };
}

describe("toolResolver", () => {
  it("resolves task review to tasks.list with high confidence", () => {
    const result = resolveToolForStep({
      step: step("tasks", "review"),
      currentTime: now,
    });

    expect(result.status).toBe("resolved");
    expect(result.resolved).toBe(true);
    expect(result.toolId).toBe("tasks.list");
    expect(result.confidence).toBe("high");
    expect(result.generatedAt).toBe(now.toISOString());
  });

  it("resolves calendar review to calendar.list_today", () => {
    const result = resolveToolForStep({
      step: step("calendar", "review"),
      currentTime: now,
    });

    expect(result.status).toBe("resolved");
    expect(result.toolId).toBe("calendar.list_today");
  });

  it("resolves learning continue only to read-only progress", () => {
    const result = resolveToolForStep({
      step: step("learning", "continue", { requiresApproval: true }),
      currentTime: now,
    });

    expect(result.status).toBe("resolved");
    expect(result.toolId).toBe("learning.get_progress");
    expect(result.tool?.mode).toBe("read");
    expect(result.tool?.externalEffect).toBe(false);
  });

  it("resolves workspace inspection to workspace.get_context", () => {
    const result = resolveToolForStep({
      step: step("workspace" as WorkspaceSignalDomain, "inspect"),
      currentTime: now,
    });

    expect(result.status).toBe("resolved");
    expect(result.toolId).toBe("workspace.get_context");
  });

  it("does not resolve disabled tools", () => {
    const disabledTool = { ...tool("tasks.list"), enabled: false };
    const result = resolveToolForStep({
      step: step("tasks", "review"),
      availableTools: [disabledTool],
      currentTime: now,
    });

    expect(result.status).toBe("tool_disabled");
    expect(result.resolved).toBe(false);
  });

  it("does not resolve write actions or write tools", () => {
    const result = resolveToolForStep({
      step: step("tasks", "create"),
      currentTime: now,
    });

    expect(result.status).toBe("unsupported_action");
    expect(result.resolved).toBe(false);
    expect(result.toolId).toBeUndefined();
  });

  it("does not resolve external-effect variants even with a matching id", () => {
    const externalTool = { ...tool("tasks.list"), externalEffect: true };
    const result = resolveToolForStep({
      step: step("tasks", "review"),
      availableTools: [externalTool],
      currentTime: now,
    });

    expect(result.status).toBe("unresolved");
    expect(result.resolved).toBe(false);
  });

  it("fails closed on domain mismatch", () => {
    const mismatchedTool = { ...tool("tasks.list"), domain: "calendar" as const };
    const result = resolveToolForStep({
      step: step("tasks", "review"),
      availableTools: [mismatchedTool],
      currentTime: now,
    });

    expect(result.status).toBe("domain_mismatch");
    expect(result.resolved).toBe(false);
  });

  it("fails closed on capability mismatch", () => {
    const mismatchedTool = { ...tool("tasks.list"), capability: "search" as const };
    const result = resolveToolForStep({
      step: step("tasks", "review"),
      availableTools: [mismatchedTool],
      currentTime: now,
    });

    expect(result.status).toBe("capability_mismatch");
    expect(result.resolved).toBe(false);
  });

  it("fails closed on missing context", () => {
    const result = resolveToolForStep({
      step: null,
      currentTime: now,
    });

    expect(result.status).toBe("missing_context");
    expect(result.requiredInput).toContain("step.id");
  });

  it("reports ambiguity instead of guessing", () => {
    const first = tool("tasks.list");
    const second = { ...tool("tasks.list") };
    const result = resolveToolForStep({
      step: step("tasks", "review"),
      availableTools: [first, second],
      currentTime: now,
    });

    expect(result.status).toBe("ambiguous");
    expect(result.resolved).toBe(false);
  });

  it("fails closed for unknown safe-looking actions without explicit mapping", () => {
    const result = resolveToolForStep({
      step: step("tasks", "focus"),
      currentTime: now,
    });

    expect(result.status).toBe("unsupported_action");
    expect(result.resolved).toBe(false);
  });

  it("does not mutate inputs and is deterministic", () => {
    const sourceStep = step("tasks", "review");
    const sourceTools = [tool("tasks.list")];
    const before = JSON.stringify({ sourceStep, sourceTools });

    const first = resolveToolForStep({
      step: sourceStep,
      availableTools: sourceTools,
      currentTime: now,
    });
    const second = resolveToolForStep({
      step: sourceStep,
      availableTools: sourceTools,
      currentTime: now,
    });

    expect(second).toEqual(first);
    expect(JSON.stringify({ sourceStep, sourceTools })).toBe(before);
  });

  describe("expectedToolId pass-through", () => {
    it("is a no-op for plan-driven callers that omit it: identical result to the domain+actionType lookup", () => {
      const viaLookup = resolveToolForStep({
        step: step("tasks", "review"),
        currentTime: now,
      });
      const viaExplicitPassThrough = resolveToolForStep({
        step: step("tasks", "review"),
        expectedToolId: "tasks.list",
        currentTime: now,
      });

      expect(viaExplicitPassThrough).toEqual(viaLookup);
    });

    it("bypasses the domain+actionType table when the caller already knows the tool", () => {
      // "tasks" + "plan" has no entry in explicitReadOnlyMappings (only
      // review/open/inspect are mapped for tasks) — confirm that baseline
      // fails first, so the pass-through success below actually proves the
      // lookup table was skipped, not just agreed with it.
      const withoutPassThrough = resolveToolForStep({
        step: step("tasks", "plan"),
        currentTime: now,
      });
      expect(withoutPassThrough.status).toBe("unsupported_action");

      const withPassThrough = resolveToolForStep({
        step: step("tasks", "plan"),
        expectedToolId: "tasks.list",
        currentTime: now,
      });

      expect(withPassThrough.status).toBe("resolved");
      expect(withPassThrough.toolId).toBe("tasks.list");
    });

    it("still enforces the read-only allowlist: a real but non-read-only tool id is rejected", () => {
      // tasks.complete is a real, enabled, registered tool — it is rejected
      // solely because it is absent from executableReadOnlyToolIds. That
      // Set is now the only gate between "the intent named a tool" and "the
      // tool runs" for the pass-through path, so this must fail loudly
      // (status, not just resolved/false) if that gate is ever loosened.
      const result = resolveToolForStep({
        step: step("tasks", "review"),
        expectedToolId: "tasks.complete",
        currentTime: now,
      });

      expect(result.status).toBe("unresolved");
      expect(result.resolved).toBe(false);
      expect(result.toolId).toBeUndefined();
    });

    it("still fails closed on a completely unknown tool id", () => {
      const result = resolveToolForStep({
        step: step("tasks", "review"),
        expectedToolId: "tasks.delete_everything",
        currentTime: now,
      });

      expect(result.status).toBe("tool_not_found");
      expect(result.resolved).toBe(false);
    });

    it("still requires step context even when expectedToolId is present", () => {
      const result = resolveToolForStep({
        step: null,
        expectedToolId: "tasks.list",
        currentTime: now,
      });

      expect(result.status).toBe("missing_context");
    });

    it("still fails closed on domain mismatch even when the tool id is pre-known", () => {
      const result = resolveToolForStep({
        step: step("calendar", "review"),
        expectedToolId: "tasks.list",
        currentTime: now,
      });

      expect(result.status).toBe("domain_mismatch");
      expect(result.resolved).toBe(false);
    });
  });
});
