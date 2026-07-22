import type {
  ExecutionError,
  GitHubRepositoriesClient,
  GitHubRepositoriesResult,
  GitHubRepositorySummary,
} from "@/features/agent/executionTypes";

interface GitHubRepositoriesClientOptions {
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

function repository(value: unknown): GitHubRepositorySummary | undefined {
  if (!value || typeof value !== "object") return undefined;
  const item = value as Record<string, unknown>;
  const id = safeString(item.id, 64);
  const name = safeString(item.name, 100);
  const owner = safeString(item.owner, 100);
  const defaultBranch = safeString(item.defaultBranch, 100);
  const visibility = item.visibility;
  if (
    !id || !name || !owner || !defaultBranch ||
    (visibility !== "public" && visibility !== "private" && visibility !== "internal")
  ) return undefined;
  return {
    id,
    name,
    owner,
    visibility,
    defaultBranch,
    archived: item.archived === true,
  };
}

function repositoriesEndpoint(workerBaseUrl: string) {
  const base = new URL(workerBaseUrl);
  if (base.username || base.password || (base.protocol !== "https:" && base.hostname !== "localhost" && base.hostname !== "127.0.0.1")) {
    throw safeExecutionError("GITHUB_CONFIGURATION_INVALID", "GitHub integration endpoint is invalid.");
  }
  base.pathname = `${base.pathname.replace(/\/$/, "")}/github/repositories`;
  base.search = "";
  base.hash = "";
  return base.toString();
}

export function createGitHubRepositoriesClient(
  options: GitHubRepositoriesClientOptions,
): GitHubRepositoriesClient {
  const endpoint = repositoriesEndpoint(options.workerBaseUrl);
  const fetcher = options.fetcher ?? fetch;

  return Object.freeze({
    async listRepositories(): Promise<GitHubRepositoriesResult> {
      const accessToken = await options.getAccessToken();
      if (!accessToken) throw safeExecutionError("AUTH_REQUIRED", "Authentication is required.");

      let response: Response;
      try {
        response = await fetcher(endpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        throw safeExecutionError("GITHUB_INTEGRATION_UNAVAILABLE", "GitHub repository access is unavailable.");
      }

      if (response.status === 409) {
        return { connectionStatus: "not_connected", repositories: [] };
      }
      if (!response.ok) {
        throw safeExecutionError("GITHUB_REPOSITORIES_FAILED", "GitHub repositories could not be loaded safely.");
      }
      const body = await response.json() as { repositories?: unknown };
      if (!Array.isArray(body.repositories)) {
        throw safeExecutionError("GITHUB_RESPONSE_INVALID", "GitHub returned an invalid repository response.");
      }
      return {
        connectionStatus: "connected",
        repositories: body.repositories
          .slice(0, 20)
          .map(repository)
          .filter((item): item is GitHubRepositorySummary => Boolean(item)),
      };
    },
  });
}
