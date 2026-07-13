import type { AgentWriteToolHandler } from "./executionTypes";
import { tasksCompleteHandler } from "./handlers/tasksCompleteHandler";

const registeredWriteHandlers: readonly AgentWriteToolHandler[] = Object.freeze([
  tasksCompleteHandler,
]);

export function getWriteHandlerByToolId(toolId: string): AgentWriteToolHandler | undefined {
  return registeredWriteHandlers.find((handler) => handler.toolId === toolId);
}

export function listRegisteredWriteHandlers(): readonly AgentWriteToolHandler[] {
  return registeredWriteHandlers;
}

export { tasksCompleteHandler };
