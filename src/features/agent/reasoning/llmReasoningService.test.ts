import { describe, expect, it, vi } from "vitest";
import {
  createLlmReasoningCaller,
  parseLlmIntentJson,
} from "./llmReasoningService";
import { validateAgentIntentProposal } from "./intentValidator";

describe("llmReasoningService", () => {
  it("parses JSON-only intent output", () => {
    const parsed = parseLlmIntentJson('{"type":"inspect_tasks","confidence":"high"}');

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toMatchObject({ type: "inspect_tasks" });
    }
  });

  it("extracts a JSON object from fenced or wrapped model output", () => {
    const parsed = parseLlmIntentJson('```json\n{"type":"inspect_calendar"}\n```');

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toMatchObject({ type: "inspect_calendar" });
    }
  });

  it("fails safely on malformed JSON", () => {
    expect(parseLlmIntentJson("{not-json").ok).toBe(false);
    expect(parseLlmIntentJson("plain text only").ok).toBe(false);
  });

  it("uses existing fetch boundary and reads reply JSON", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => ({
      ok: true,
      json: async () => ({ reply: '{"type":"inspect_learning"}' }),
    }));
    const caller = createLlmReasoningCaller({
      endpoint: "https://example.test/chat",
      accessToken: "token",
      fetcher: fetcher as unknown as typeof fetch,
    });

    const result = await caller({
      prompt: "Return JSON",
      responseLanguage: "en",
      sessionId: "session-1",
    });

    expect(result.rawText).toContain("inspect_learning");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(fetcher.mock.calls[0]?.[1])).toContain("Bearer token");
  });

  it("returns empty raw text when no endpoint is configured", async () => {
    await expect(
      createLlmReasoningCaller({})({
        prompt: "Return JSON",
        responseLanguage: "en",
      }),
    ).resolves.toEqual({ rawText: "" });
  });

  it("uses the structured local reasoning contract with authenticated transport", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({
      requestId: "reasoning:test",
      proposal: {
        type: "inspect_tasks",
        confidence: "high",
        requestedDomain: "tasks",
        reasons: ["The request asks for tasks."],
        language: "en",
      },
      responseLanguage: "en",
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const caller = createLlmReasoningCaller({
      endpoint: "http://127.0.0.1:8787/agent/reason",
      accessToken: "local-token",
      fetcher: fetcher as unknown as typeof fetch,
      transport: "structured-reasoning",
      requestIdFactory: () => "reasoning:test",
    });

    const result = await caller({
      prompt: "Bounded reasoning prompt",
      responseLanguage: "en",
      sessionId: "session-1",
    });
    const requestBody = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));

    expect(requestBody).toEqual({
      requestId: "reasoning:test",
      reasoningPrompt: "Bounded reasoning prompt",
      responseLanguage: "en",
    });
    expect(JSON.stringify(fetcher.mock.calls[0]?.[1]?.headers)).toContain("Bearer local-token");

    const parsed = parseLlmIntentJson(result.rawText);
    expect(parsed.ok).toBe(true);
    const validated = validateAgentIntentProposal({
      rawProposal: parsed.ok ? parsed.value : null,
      userMessage: "Show my tasks.",
      safeContext: { tasks: [], events: [], learningProgress: null },
      language: "en",
      now: new Date("2026-07-18T12:00:00.000Z"),
    });
    expect(validated.proposal.type).toBe("inspect_tasks");
    expect(validated.toolId).toBe("tasks.list");
  });

  it("fails closed on a mismatched or malformed structured envelope", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({
      requestId: "wrong-request",
      proposal: { type: "inspect_tasks" },
      responseLanguage: "en",
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const caller = createLlmReasoningCaller({
      endpoint: "http://127.0.0.1:8787/agent/reason",
      fetcher: fetcher as unknown as typeof fetch,
      transport: "structured-reasoning",
      requestIdFactory: () => "reasoning:expected",
    });

    await expect(caller({
      prompt: "Bounded reasoning prompt",
      responseLanguage: "en",
    })).resolves.toEqual({ rawText: "" });
  });
});
