import type {
  ExecutionError,
  GitHubPullRequestSummary,
  GitHubPullRequestsClient,
  GitHubPullRequestsResult,
} from "@/features/agent/executionTypes";

interface GitHubPullRequestsClientOptions {
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

function pullRequest(value: unknown): GitHubPullRequestSummary | undefined {
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
  return { repo, number, title, state, updatedAt, draft: item.draft === true };
}

function pullsEndpoint(workerBaseUrl: string) {
  const base = new URL(workerBaseUrl);
  if (base.username || base.password || (base.protocol !== "https:" && base.hostname !== "localhost" && base.hostname !== "127.0.0.1")) {
    throw safeExecutionError("GITHUB_CONFIGURATION_INVALID", "GitHub integration endpoint is invalid.");
  }
  base.pathname = `${base.pathname.replace(/\/$/, "")}/github/pulls`;
  base.search = "";
  base.hash = "";
  return base.toString();
}

export function createGitHubPullRequestsClient(
  options: GitHubPullRequestsClientOptions,
): GitHubPullRequestsClient {
  const endpoint = pullsEndpoint(options.workerBaseUrl);
  const fetcher = options.fetcher ?? fetch;

  return Object.freeze({
    async listPullRequests(): Promise<GitHubPullRequestsResult> {
      const accessToken = await options.getAccessToken();
      if (!accessToken) throw safeExecutionError("AUTH_REQUIRED", "Authentication is required.");

      let response: Response;
      try {
        response = await fetcher(endpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        throw safeExecutionError("GITHUB_INTEGRATION_UNAVAILABLE", "GitHub pull request access is unavailable.");
      }

      if (response.status === 409) {
        return { connectionStatus: "not_connected", pullRequests: [] };
      }
      if (!response.ok) {
        throw safeExecutionError("GITHUB_PULLS_FAILED", "GitHub pull requests could not be loaded safely.");
      }
      const body = await response.json() as { pullRequests?: unknown };
      if (!Array.isArray(body.pullRequests)) {
        throw safeExecutionError("GITHUB_RESPONSE_INVALID", "GitHub returned an invalid pull requests response.");
      }
      return {
        connectionStatus: "connected",
        pullRequests: body.pullRequests
          .slice(0, 20)
          .map(pullRequest)
          .filter((item): item is GitHubPullRequestSummary => Boolean(item)),
      };
    },
  });
}
