import type { AgentToolHandler } from "../executionTypes";
import { validateInputAgainstSchema } from "./inputValidation";

export const githubIssuesListHandler: AgentToolHandler = {
  toolId: "github.issues.list",
  timeoutMs: 10_000,
  readOnly: true,
  validateInput: validateInputAgainstSchema,
  async execute(_input, context) {
    if (!context.githubIssuesClient) {
      return { connectionStatus: "not_connected", issues: [] };
    }
    return context.githubIssuesClient.listIssues();
  },
};
