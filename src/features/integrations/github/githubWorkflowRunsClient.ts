import type {
  ExecutionError,
  GitHubWorkflowRunSummary,
  GitHubWorkflowRunsClient,
  GitHubWorkflowRunsResult,
} from "@/features/agent/executionTypes";

interface GitHubWorkflowRunsClientOptions {
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

function workflowRun(value: unknown): GitHubWorkflowRunSummary | undefined {
  if (!value || typeof value !== "object") return undefined;
  const item = value as Record<string, unknown>;
  const repo = safeString(item.repo, 200);
  const workflowName = safeString(item.workflowName, 200);
  const status = safeString(item.status, 32);
  const updatedAt = safeString(item.updatedAt, 64);
  if (!repo || !workflowName || !status || !updatedAt) return undefined;
  const conclusion = safeString(item.conclusion, 32) || undefined;
  return { repo, workflowName, status, conclusion, updatedAt };
}

function workflowRunsEndpoint(workerBaseUrl: string) {
  const base = new URL(workerBaseUrl);
  if (base.username || base.password || (base.protocol !== "https:" && base.hostname !== "localhost" && base.hostname !== "127.0.0.1")) {
    throw safeExecutionError("GITHUB_CONFIGURATION_INVALID", "GitHub integration endpoint is invalid.");
  }
  base.pathname = `${base.pathname.replace(/\/$/, "")}/github/workflow_runs`;
  base.search = "";
  base.hash = "";
  return base.toString();
}

export function createGitHubWorkflowRunsClient(
  options: GitHubWorkflowRunsClientOptions,
): GitHubWorkflowRunsClient {
  const endpoint = workflowRunsEndpoint(options.workerBaseUrl);
  const fetcher = options.fetcher ?? fetch;

  return Object.freeze({
    async listWorkflowRuns(): Promise<GitHubWorkflowRunsResult> {
      const accessToken = await options.getAccessToken();
      if (!accessToken) throw safeExecutionError("AUTH_REQUIRED", "Authentication is required.");

      let response: Response;
      try {
        response = await fetcher(endpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        throw safeExecutionError("GITHUB_INTEGRATION_UNAVAILABLE", "GitHub workflow run access is unavailable.");
      }

      if (response.status === 409) {
        return { connectionStatus: "not_connected", workflowRuns: [] };
      }
      if (!response.ok) {
        throw safeExecutionError("GITHUB_WORKFLOW_RUNS_FAILED", "GitHub workflow runs could not be loaded safely.");
      }
      const body = await response.json() as { workflowRuns?: unknown };
      if (!Array.isArray(body.workflowRuns)) {
        throw safeExecutionError("GITHUB_RESPONSE_INVALID", "GitHub returned an invalid workflow runs response.");
      }
      return {
        connectionStatus: "connected",
        workflowRuns: body.workflowRuns
          .slice(0, 10)
          .map(workflowRun)
          .filter((item): item is GitHubWorkflowRunSummary => Boolean(item)),
      };
    },
  });
}
