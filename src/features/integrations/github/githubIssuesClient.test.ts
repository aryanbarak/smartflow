import { describe, expect, it, vi } from "vitest";
import { createGitHubIssuesClient } from "./githubIssuesClient";

describe("GitHub issues browser client", () => {
  it("calls only the fixed issues route with runtime authentication and sanitizes output", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({
      issues: [
        {
          repo: "aryan/smartflow",
          number: 42,
          title: "Fix reasoning rescue",
          state: "open",
          updatedAt: "2026-07-20T10:00:00.000Z",
          token: "must-not-pass",
          body: "must-not-pass",
        },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const client = createGitHubIssuesClient({
      workerBaseUrl: "http://127.0.0.1:8787",
      getAccessToken: async () => "supabase-session",
      fetcher: fetcher as typeof fetch,
    });
    const result = await client.listIssues();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("http://127.0.0.1:8787/github/issues");
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer supabase-session");
    expect(result.issues[0]).toEqual({
      repo: "aryan/smartflow",
      number: 42,
      title: "Fix reasoning rescue",
      state: "open",
      updatedAt: "2026-07-20T10:00:00.000Z",
    });
    expect(JSON.stringify(result)).not.toContain("must-not-pass");
  });

  it("maps not-connected separately and fails closed for malformed responses", async () => {
    const notConnected = createGitHubIssuesClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response("{}", { status: 409 }),
    });
    expect(await notConnected.listIssues()).toEqual({ connectionStatus: "not_connected", issues: [] });

    const malformed = createGitHubIssuesClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response(JSON.stringify({ issues: "not-an-array" }), { status: 200 }),
    });
    await expect(malformed.listIssues()).rejects.toMatchObject({ code: "GITHUB_RESPONSE_INVALID" });
  });

  it("drops items with an unrecognized state instead of guessing", async () => {
    const client = createGitHubIssuesClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response(JSON.stringify({
        issues: [
          { repo: "aryan/smartflow", number: 1, title: "Valid", state: "open", updatedAt: "2026-07-20T10:00:00.000Z" },
          { repo: "aryan/smartflow", number: 2, title: "Bad state", state: "merged", updatedAt: "2026-07-20T10:00:00.000Z" },
        ],
      }), { status: 200 }),
    });
    const result = await client.listIssues();
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].number).toBe(1);
  });
});
