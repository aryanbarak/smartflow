import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { TutorOutputTabs } from "@/components/tutor/app/TutorOutputTabs";
import type { TutorRunExecution } from "@/lib/tutor/types";

const execution: TutorRunExecution = {
  request: {
    api_version: "v1",
    request_id: "req-1",
    topic: "bubblesort",
    mode: "trace",
    lang: "de",
    params: {},
  },
  raw: { raw: true },
  result: { ok: true },
  events: [{ type: "info" }],
  stats: { total: 1 },
  questions: [{ id: "q1" }],
  logs: ["first log"],
};

describe("TutorOutputTabs", () => {
  it("renders initial empty state without crashing", () => {
    const html = renderToString(<TutorOutputTabs execution={null} logs={[]} />);
    expect(html).toContain("No output yet. Click Run to execute.");
  });

  it("renders execution tabs without crashing", () => {
    const html = renderToString(<TutorOutputTabs execution={execution} logs={execution.logs} />);
    expect(html).toContain("Result");
    expect(html).toContain("Events");
    expect(html).toContain("Questions");
    expect(html).toContain("Stats");
    expect(html).toContain("Raw");
    expect(html).toContain("Logs");
  });
});
