import type { AgentToolDefinition } from "../toolTypes";
import { calendarTools } from "./calendarTools";
import { conversationTools } from "./conversationTools";
import { documentTools } from "./documentTools";
import { financeTools } from "./financeTools";
import { habitTools } from "./habitTools";
import { githubTools } from "./githubTools";
import { learningTools } from "./learningTools";
import { taskTools } from "./taskTools";
import { workspaceTools } from "./workspaceTools";

export const agentToolDefinitions: AgentToolDefinition[] = [
  ...taskTools.slice(0, 1),
  ...calendarTools.slice(0, 1),
  ...documentTools.slice(0, 1),
  ...learningTools,
  ...workspaceTools,
  ...githubTools,
  ...taskTools.slice(1),
  ...calendarTools.slice(1),
  ...habitTools,
  ...conversationTools,
  ...financeTools,
  ...documentTools.slice(1),
];

export {
  calendarTools,
  conversationTools,
  documentTools,
  financeTools,
  habitTools,
  githubTools,
  learningTools,
  taskTools,
  workspaceTools,
};
