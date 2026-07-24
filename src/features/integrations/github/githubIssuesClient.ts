import type {
  ExecutionError,
  GitHubIssueSummary,
  GitHubIssuesClient,
  GitHubIssuesResult,
} from "@/features/agent/executionTypes";

interface GitHubIssuesClientOptions {
  workerBaseUrl: string;
  getAccessToken(): Promise<string | undefined>;
  fetcher?: typeof fetch;
}

function safeExecutionError(code: string, message: string): ExecutionError {
  return { code, message, retryable: false };
}

function safeString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function issue(value: unknown): GitHubIssueSummary | undefined {
  if (!value || typeof value !== "object") return undefined;
  const item = value as Record<string, unknown>;
  const repo = safeString(item.repo, 200);
  const number = typeof item.number === "number" && Number.isSafeInteger(item.number) && item.number > 0
    ? item.number
    : undefined;
  const title = safeString(item.title, 200);
  const state = item.state;
  const updatedAt = safeString(item.updatedAt, 64);
  if (
    !repo || !number || !title || !updatedAt ||
    (state !== "open" && state !== "closed")
  ) return undefined;
  return { repo, number, title, state, updatedAt };
}

function issuesEndpoint(workerBaseUrl: string) {
  const base = new URL(workerBaseUrl);
  if (base.username || base.password || (base.protocol !== "https:" && base.hostname !== "localhost" && base.hostname !== "127.0.0.1")) {
    throw safeExecutionError("GITHUB_CONFIGURATION_INVALID", "GitHub integration endpoint is invalid.");
  }
  base.pathname = `${base.pathname.replace(/\/$/, "")}/github/issues`;
  base.search = "";
  base.hash = "";
  return base.toString();
}

export function createGitHubIssuesClient(
  options: GitHubIssuesClientOptions,
): GitHubIssuesClient {
  const endpoint = issuesEndpoint(options.workerBaseUrl);
  const fetcher = options.fetcher ?? fetch;

  return Object.freeze({
    async listIssues(): Promise<GitHubIssuesResult> {
      const accessToken = await options.getAccessToken();
      if (!accessToken) throw safeExecutionError("AUTH_REQUIRED", "Authentication is required.");

      let response: Response;
      try {
        response = await fetcher(endpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        throw safeExecutionError("GITHUB_INTEGRATION_UNAVAILABLE", "GitHub issue access is unavailable.");
      }

      if (response.status === 409) {
        return { connectionStatus: "not_connected", issues: [] };
      }
      if (!response.ok) {
        throw safeExecutionError("GITHUB_ISSUES_FAILED", "GitHub issues could not be loaded safely.");
      }
      const body = await response.json() as { issues?: unknown };
      if (!Array.isArray(body.issues)) {
        throw safeExecutionError("GITHUB_RESPONSE_INVALID", "GitHub returned an invalid issues response.");
      }
      return {
        connectionStatus: "connected",
        issues: body.issues
          .slice(0, 20)
          .map(issue)
          .filter((item): item is GitHubIssueSummary => Boolean(item)),
      };
    },
  });
}
