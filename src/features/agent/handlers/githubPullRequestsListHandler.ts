import type { AgentToolHandler } from "../executionTypes";
import { validateInputAgainstSchema } from "./inputValidation";

export const githubPullRequestsListHandler: AgentToolHandler = {
  toolId: "github.pulls.list",
  timeoutMs: 10_000,
  readOnly: true,
  validateInput: validateInputAgainstSchema,
  async execute(_input, context) {
    if (!context.githubPullRequestsClient) {
      return { connectionStatus: "not_connected", pullRequests: [] };
    }
    return context.githubPullRequestsClient.listPullRequests();
  },
};
