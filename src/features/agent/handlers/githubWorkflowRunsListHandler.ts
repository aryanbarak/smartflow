import type { AgentToolHandler } from "../executionTypes";
import { validateInputAgainstSchema } from "./inputValidation";

export const githubWorkflowRunsListHandler: AgentToolHandler = {
  toolId: "github.workflow_runs.list",
  timeoutMs: 10_000,
  readOnly: true,
  validateInput: validateInputAgainstSchema,
  async execute(_input, context) {
    if (!context.githubWorkflowRunsClient) {
      return { connectionStatus: "not_connected", workflowRuns: [] };
    }
    return context.githubWorkflowRunsClient.listWorkflowRuns();
  },
};
