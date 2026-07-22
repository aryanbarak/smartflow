import type { AgentToolHandler } from "../executionTypes";
import { validateInputAgainstSchema } from "./inputValidation";

export const githubRepositoriesListHandler: AgentToolHandler = {
  toolId: "github.repositories.list",
  timeoutMs: 10_000,
  readOnly: true,
  validateInput: validateInputAgainstSchema,
  async execute(_input, context) {
    if (!context.githubRepositoriesClient) {
      return { connectionStatus: "not_connected", repositories: [] };
    }
    return context.githubRepositoriesClient.listRepositories();
  },
};
