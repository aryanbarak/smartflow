import { describe, expect, it, vi } from "vitest";
import {
  createLlmReasoningCaller,
  parseLlmIntentJson,
} from "./llmReasoningService";

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
    const fetcher = vi.fn(async () => ({
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
});
