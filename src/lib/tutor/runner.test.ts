import { describe, expect, it } from "vitest";
import { normalizeTutorRunPayload } from "@/lib/tutor/runner";
import type { TutorRunRequestPayload } from "@/lib/tutor/types";

const request: TutorRunRequestPayload = {
  api_version: "v1",
  request_id: "test-id",
  topic: "bubblesort",
  mode: "trace",
  lang: "de",
  params: {},
};

describe("normalizeTutorRunPayload", () => {
  it("keeps existing fields and normalizes optional structures", () => {
    const execution = normalizeTutorRunPayload(
      {
        result: { ok: true, value: 1 },
        events: [{ type: "info" }],
        stats: { total: 1 },
        questions: [{ id: "q1" }],
        raw_extra: "x",
        logs: ["line1", 2],
      },
      request,
    );

    expect(execution.request.request_id).toBe("test-id");
    expect(execution.result).toEqual({ ok: true, value: 1 });
    expect(execution.events).toEqual([{ type: "info" }]);
    expect(execution.stats).toEqual({ total: 1 });
    expect(execution.questions).toEqual([{ id: "q1" }]);
    expect(execution.logs).toEqual(["line1", "2"]);
    expect(execution.raw).toMatchObject({ raw_extra: "x" });
  });

  it("falls back safely when fields are missing", () => {
    const execution = normalizeTutorRunPayload({ result: { questions: [{ id: "q2" }] } }, request);

    expect(execution.events).toEqual([]);
    expect(execution.stats).toBeNull();
    expect(execution.questions).toEqual([{ id: "q2" }]);
    expect(execution.logs).toEqual([]);
  });

  it("unwraps adapter nested result/events/stats shape", () => {
    const execution = normalizeTutorRunPayload(
      {
        result: {
          request_id: "core-id",
          result: { value: 42, questions: [{ id: "q3" }] },
          events: [{ step: 1 }],
          stats: { count: 1 },
        },
      },
      request,
    );

    expect(execution.result).toEqual({ value: 42, questions: [{ id: "q3" }] });
    expect(execution.events).toEqual([{ step: 1 }]);
    expect(execution.stats).toEqual({ count: 1 });
    expect(execution.questions).toEqual([{ id: "q3" }]);
  });

  it("uses direct payload as result when no result wrapper exists", () => {
    const execution = normalizeTutorRunPayload(
      {
        mode: "pseudocode",
        topic: "bubblesort",
        pseudocode: "FUNKTION ...",
      },
      request,
    );

    expect(execution.result).toEqual({
      mode: "pseudocode",
      topic: "bubblesort",
      pseudocode: "FUNKTION ...",
    });
  });
});
