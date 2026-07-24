import { describe, expect, it, vi } from "vitest";
import { createGitHubPullRequestsClient } from "./githubPullRequestsClient";

describe("GitHub pull requests browser client", () => {
  it("calls only the fixed pulls route with runtime authentication and sanitizes output", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({
      pullRequests: [
        {
          repo: "aryan/smartflow",
          number: 7,
          title: "Add pulls tool",
          state: "open",
          updatedAt: "2026-07-24T10:00:00.000Z",
          draft: true,
          token: "must-not-pass",
          body: "must-not-pass",
        },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const client = createGitHubPullRequestsClient({
      workerBaseUrl: "http://127.0.0.1:8787",
      getAccessToken: async () => "supabase-session",
      fetcher: fetcher as typeof fetch,
    });
    const result = await client.listPullRequests();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("http://127.0.0.1:8787/github/pulls");
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer supabase-session");
    expect(result.pullRequests[0]).toEqual({
      repo: "aryan/smartflow",
      number: 7,
      title: "Add pulls tool",
      state: "open",
      updatedAt: "2026-07-24T10:00:00.000Z",
      draft: true,
    });
    expect(JSON.stringify(result)).not.toContain("must-not-pass");
  });

  it("maps not-connected separately and fails closed for malformed responses", async () => {
    const notConnected = createGitHubPullRequestsClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response("{}", { status: 409 }),
    });
    expect(await notConnected.listPullRequests()).toEqual({ connectionStatus: "not_connected", pullRequests: [] });

    const malformed = createGitHubPullRequestsClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response(JSON.stringify({ pullRequests: "not-an-array" }), { status: 200 }),
    });
    await expect(malformed.listPullRequests()).rejects.toMatchObject({ code: "GITHUB_RESPONSE_INVALID" });
  });

  it("drops items with an unrecognized state instead of guessing", async () => {
    const client = createGitHubPullRequestsClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response(JSON.stringify({
        pullRequests: [
          { repo: "aryan/smartflow", number: 1, title: "Valid", state: "open", updatedAt: "2026-07-24T10:00:00.000Z", draft: false },
          { repo: "aryan/smartflow", number: 2, title: "Bad state", state: "merged", updatedAt: "2026-07-24T10:00:00.000Z", draft: false },
        ],
      }), { status: 200 }),
    });
    const result = await client.listPullRequests();
    expect(result.pullRequests).toHaveLength(1);
    expect(result.pullRequests[0].number).toBe(1);
  });

  it("defaults draft to false when the field is missing rather than guessing true", async () => {
    const client = createGitHubPullRequestsClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response(JSON.stringify({
        pullRequests: [
          { repo: "aryan/smartflow", number: 1, title: "No draft field", state: "open", updatedAt: "2026-07-24T10:00:00.000Z" },
        ],
      }), { status: 200 }),
    });
    const result = await client.listPullRequests();
    expect(result.pullRequests[0].draft).toBe(false);
  });
});
