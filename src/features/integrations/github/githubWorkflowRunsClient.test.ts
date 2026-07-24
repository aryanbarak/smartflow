import { describe, expect, it, vi } from "vitest";
import { createGitHubWorkflowRunsClient } from "./githubWorkflowRunsClient";

describe("GitHub workflow runs browser client", () => {
  it("calls only the fixed workflow_runs route with runtime authentication and sanitizes output", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({
      workflowRuns: [
        {
          repo: "aryan/smartflow",
          workflowName: "CI",
          status: "completed",
          conclusion: "success",
          updatedAt: "2026-07-24T10:00:00.000Z",
          id: "must-not-pass",
          headSha: "must-not-pass",
        },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const client = createGitHubWorkflowRunsClient({
      workerBaseUrl: "http://127.0.0.1:8787",
      getAccessToken: async () => "supabase-session",
      fetcher: fetcher as typeof fetch,
    });
    const result = await client.listWorkflowRuns();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("http://127.0.0.1:8787/github/workflow_runs");
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer supabase-session");
    expect(result.workflowRuns[0]).toEqual({
      repo: "aryan/smartflow",
      workflowName: "CI",
      status: "completed",
      conclusion: "success",
      updatedAt: "2026-07-24T10:00:00.000Z",
    });
    expect(JSON.stringify(result)).not.toContain("must-not-pass");
  });

  it("maps not-connected separately and fails closed for malformed responses", async () => {
    const notConnected = createGitHubWorkflowRunsClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response("{}", { status: 409 }),
    });
    expect(await notConnected.listWorkflowRuns()).toEqual({ connectionStatus: "not_connected", workflowRuns: [] });

    const malformed = createGitHubWorkflowRunsClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response(JSON.stringify({ workflowRuns: "not-an-array" }), { status: 200 }),
    });
    await expect(malformed.listWorkflowRuns()).rejects.toMatchObject({ code: "GITHUB_RESPONSE_INVALID" });
  });

  it("allows a missing conclusion for an in-progress run instead of dropping it", async () => {
    const client = createGitHubWorkflowRunsClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response(JSON.stringify({
        workflowRuns: [
          { repo: "aryan/smartflow", workflowName: "CI", status: "in_progress", updatedAt: "2026-07-24T10:00:00.000Z" },
        ],
      }), { status: 200 }),
    });
    const result = await client.listWorkflowRuns();
    expect(result.workflowRuns).toHaveLength(1);
    expect(result.workflowRuns[0].conclusion).toBeUndefined();
  });

  it("drops items missing required fields instead of guessing", async () => {
    const client = createGitHubWorkflowRunsClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response(JSON.stringify({
        workflowRuns: [
          { repo: "aryan/smartflow", workflowName: "CI", status: "completed", conclusion: "success", updatedAt: "2026-07-24T10:00:00.000Z" },
          { repo: "aryan/smartflow", workflowName: "Missing status" },
        ],
      }), { status: 200 }),
    });
    const result = await client.listWorkflowRuns();
    expect(result.workflowRuns).toHaveLength(1);
    expect(result.workflowRuns[0].workflowName).toBe("CI");
  });
});
