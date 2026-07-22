import { describe, expect, it, vi } from "vitest";
import { createGitHubRepositoriesClient } from "./githubRepositoriesClient";

describe("GitHub repositories browser client", () => {
  it("calls only the fixed repository route with runtime authentication and sanitizes output", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({
      repositories: [
        {
          id: "1",
          name: "smartflow",
          owner: "aryan",
          visibility: "private",
          defaultBranch: "main",
          archived: false,
          token: "must-not-pass",
        },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const client = createGitHubRepositoriesClient({
      workerBaseUrl: "http://127.0.0.1:8787",
      getAccessToken: async () => "supabase-session",
      fetcher: fetcher as typeof fetch,
    });
    const result = await client.listRepositories();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("http://127.0.0.1:8787/github/repositories");
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer supabase-session");
    expect(result.repositories[0]).toEqual({
      id: "1",
      name: "smartflow",
      owner: "aryan",
      visibility: "private",
      defaultBranch: "main",
      archived: false,
    });
    expect(JSON.stringify(result)).not.toContain("must-not-pass");
  });

  it("maps not-connected separately and fails closed for malformed responses", async () => {
    const notConnected = createGitHubRepositoriesClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response("{}", { status: 409 }),
    });
    expect(await notConnected.listRepositories()).toEqual({ connectionStatus: "not_connected", repositories: [] });

    const malformed = createGitHubRepositoriesClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => new Response(JSON.stringify({ repositories: "not-an-array" }), { status: 200 }),
    });
    await expect(malformed.listRepositories()).rejects.toMatchObject({ code: "GITHUB_RESPONSE_INVALID" });
  });
});
