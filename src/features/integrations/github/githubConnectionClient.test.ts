import { describe, expect, it, vi } from "vitest";
import { createGitHubConnectionClient } from "./githubConnectionClient";

const STATE = "A".repeat(43);

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("GitHub connection client", () => {
  it("does not request or redirect until the explicit start operation is called", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => response({
      installationUrl: `https://github.com/apps/smartflow/installations/new?state=${STATE}`,
      expiresAt: "private-client-detail",
    }));
    const client = createGitHubConnectionClient({
      workerBaseUrl: "http://127.0.0.1:8787",
      getAccessToken: async () => "session",
      fetcher: fetcher as typeof fetch,
    });
    expect(fetcher).not.toHaveBeenCalled();
    await expect(client.startConnection()).resolves.toEqual({
      installationUrl: `https://github.com/apps/smartflow/installations/new?state=${STATE}`,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("http://127.0.0.1:8787/github/connect/start");
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer session");
  });

  it.each([
    "https://evil.example/apps/smartflow/installations/new?state=" + STATE,
    "https://github.com/apps/smartflow/installations/new?state=short",
    "https://github.com/apps/smartflow/installations/new?state=" + STATE + "&next=https://evil.example",
    "https://github.com/login/oauth/authorize?state=" + STATE,
  ])("rejects an unapproved provider URL: %s", async (installationUrl) => {
    const client = createGitHubConnectionClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => response({ installationUrl }),
    });
    await expect(client.startConnection()).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("maps bounded not-connected, connected, and reconnect-required status", async () => {
    const statuses = [
      { connected: false, status: "not_connected", reconnectRequired: false },
      { connected: true, status: "connected", reconnectRequired: false, accountLabel: "smartflow-user", connectedAt: "2026-07-22T10:00:00Z", installationId: 777 },
      { connected: false, status: "reconnect_required", reconnectRequired: true, accountLabel: "smartflow-user", providerError: "secret" },
    ];
    for (const status of statuses) {
      const client = createGitHubConnectionClient({
        workerBaseUrl: "https://worker.example.com",
        getAccessToken: async () => "session",
        fetcher: async () => response(status),
      });
      const result = await client.getStatus();
      expect(result.status).toBe(status.status);
      expect(JSON.stringify(result)).not.toContain("installationId");
      expect(JSON.stringify(result)).not.toContain("providerError");
    }
  });

  it("disconnects only through an explicit authenticated call and validates the response", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => response({ connected: false, appUninstalled: false, installationId: 777 }));
    const client = createGitHubConnectionClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: fetcher as typeof fetch,
    });
    expect(fetcher).not.toHaveBeenCalled();
    await client.disconnect();
    expect(fetcher.mock.calls[0][0]).toBe("https://worker.example.com/github/disconnect");
    expect(fetcher.mock.calls[0][1]?.method).toBe("POST");
  });

  it("fails closed for missing auth, missing configuration, and malformed responses", async () => {
    const noAuth = createGitHubConnectionClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => undefined,
      fetcher: vi.fn(),
    });
    await expect(noAuth.getStatus()).rejects.toMatchObject({ code: "auth_required" });

    expect(() => createGitHubConnectionClient({
      workerBaseUrl: "javascript:alert(1)",
      getAccessToken: async () => "session",
    })).toThrowError();

    const missingConfig = createGitHubConnectionClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => response({}, 503),
    });
    await expect(missingConfig.startConnection()).rejects.toMatchObject({ code: "not_configured" });

    const malformed = createGitHubConnectionClient({
      workerBaseUrl: "https://worker.example.com",
      getAccessToken: async () => "session",
      fetcher: async () => response({ connected: true, status: "connected", reconnectRequired: true }),
    });
    await expect(malformed.getStatus()).rejects.toMatchObject({ code: "invalid_response" });
  });
});
