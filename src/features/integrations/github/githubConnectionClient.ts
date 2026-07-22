export type GitHubConnectionStatus =
  | { connected: false; status: "not_connected"; reconnectRequired: false }
  | { connected: true; status: "connected"; reconnectRequired: false; accountLabel?: string; connectedAt?: string }
  | { connected: false; status: "reconnect_required"; reconnectRequired: true; accountLabel?: string; connectedAt?: string };

export interface GitHubConnectionClient {
  getStatus(): Promise<GitHubConnectionStatus>;
  startConnection(): Promise<{ installationUrl: string }>;
  disconnect(): Promise<void>;
}

interface GitHubConnectionClientOptions {
  workerBaseUrl: string;
  getAccessToken(): Promise<string | undefined>;
  fetcher?: typeof fetch;
}

export class GitHubConnectionClientError extends Error {
  constructor(readonly code: "auth_required" | "not_configured" | "request_failed" | "invalid_response") {
    super(code);
  }
}

function endpoint(workerBaseUrl: string, path: string) {
  let url: URL;
  try {
    url = new URL(workerBaseUrl);
  } catch {
    throw new GitHubConnectionClientError("not_configured");
  }
  const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.username || url.password || (url.protocol !== "https:" && !(loopback && url.protocol === "http:"))) {
    throw new GitHubConnectionClientError("not_configured");
  }
  url.pathname = `${url.pathname.replace(/\/$/, "")}${path}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function safeString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength) : "";
}

function approvedInstallationUrl(value: unknown) {
  const raw = safeString(value, 500);
  try {
    const url = new URL(raw);
    const state = url.searchParams.get("state") ?? "";
    const keys = [...url.searchParams.keys()];
    if (
      url.origin !== "https://github.com" ||
      url.username ||
      url.password ||
      !/^\/apps\/[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?\/installations\/new$/.test(url.pathname) ||
      keys.length !== 1 ||
      keys[0] !== "state" ||
      !/^[A-Za-z0-9_-]{43}$/.test(state) ||
      url.hash
    ) {
      throw new Error("invalid");
    }
    return url.toString();
  } catch {
    throw new GitHubConnectionClientError("invalid_response");
  }
}

async function parseStatus(response: Response): Promise<GitHubConnectionStatus> {
  let body: Record<string, unknown>;
  try {
    body = await response.json() as Record<string, unknown>;
  } catch {
    throw new GitHubConnectionClientError("invalid_response");
  }
  if (body.status === "not_connected" && body.connected === false && body.reconnectRequired === false) {
    return { connected: false, status: "not_connected", reconnectRequired: false };
  }
  const accountLabel = safeString(body.accountLabel, 100) || undefined;
  const connectedAt = safeString(body.connectedAt, 64) || undefined;
  if (body.status === "connected" && body.connected === true && body.reconnectRequired === false) {
    return { connected: true, status: "connected", reconnectRequired: false, accountLabel, connectedAt };
  }
  if (body.status === "reconnect_required" && body.connected === false && body.reconnectRequired === true) {
    return { connected: false, status: "reconnect_required", reconnectRequired: true, accountLabel, connectedAt };
  }
  throw new GitHubConnectionClientError("invalid_response");
}

export function createGitHubConnectionClient(options: GitHubConnectionClientOptions): GitHubConnectionClient {
  const statusUrl = endpoint(options.workerBaseUrl, "/github/connection");
  const startUrl = endpoint(options.workerBaseUrl, "/github/connect/start");
  const disconnectUrl = endpoint(options.workerBaseUrl, "/github/disconnect");
  const fetcher = options.fetcher ?? fetch;

  async function authenticatedRequest(url: string, method: "GET" | "POST") {
    const accessToken = await options.getAccessToken();
    if (!accessToken) throw new GitHubConnectionClientError("auth_required");
    let response: Response;
    try {
      response = await fetcher(url, { method, headers: { Authorization: `Bearer ${accessToken}` } });
    } catch {
      throw new GitHubConnectionClientError("request_failed");
    }
    if (response.status === 401) throw new GitHubConnectionClientError("auth_required");
    if (response.status === 503) throw new GitHubConnectionClientError("not_configured");
    if (!response.ok) throw new GitHubConnectionClientError("request_failed");
    return response;
  }

  return Object.freeze({
    async getStatus() {
      return parseStatus(await authenticatedRequest(statusUrl, "GET"));
    },
    async startConnection() {
      const response = await authenticatedRequest(startUrl, "POST");
      let body: Record<string, unknown>;
      try {
        body = await response.json() as Record<string, unknown>;
      } catch {
        throw new GitHubConnectionClientError("invalid_response");
      }
      return { installationUrl: approvedInstallationUrl(body.installationUrl) };
    },
    async disconnect() {
      const response = await authenticatedRequest(disconnectUrl, "POST");
      let body: Record<string, unknown>;
      try {
        body = await response.json() as Record<string, unknown>;
      } catch {
        throw new GitHubConnectionClientError("invalid_response");
      }
      if (body.connected !== false || body.appUninstalled !== false) {
        throw new GitHubConnectionClientError("invalid_response");
      }
    },
  });
}
