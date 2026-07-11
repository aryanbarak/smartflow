import { agentToolDefinitions } from "./tools";
import type {
  AgentToolDefinition,
  AgentToolDomain,
  AgentToolOutputSchema,
  AgentToolSchemaField,
} from "./toolTypes";
import { validateToolDefinition, validateToolRegistry } from "./toolValidation";
import { getToolRiskSummary, isToolAllowedForApproval } from "./toolPolicy";

function cloneField(field: AgentToolSchemaField): AgentToolSchemaField {
  return {
    ...field,
    enumValues: field.enumValues ? [...field.enumValues] : undefined,
    defaultValue: Array.isArray(field.defaultValue)
      ? [...field.defaultValue]
      : field.defaultValue,
  };
}

function cloneOutputSchema(schema: AgentToolOutputSchema): AgentToolOutputSchema {
  return {
    ...schema,
    fields: schema.fields?.map(cloneField),
  };
}

function cloneTool(tool: AgentToolDefinition): AgentToolDefinition {
  return {
    ...tool,
    inputSchema: tool.inputSchema.map(cloneField),
    outputSchema: cloneOutputSchema(tool.outputSchema),
    tags: [...tool.tags],
    examples: tool.examples.map((example) => ({
      ...example,
      input: { ...example.input },
    })),
    constraints: [...tool.constraints],
  };
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
  }
  return value;
}

validateToolRegistry(agentToolDefinitions);
const immutableRegistry = deepFreeze(agentToolDefinitions.map(cloneTool));

export function listTools(): AgentToolDefinition[] {
  return immutableRegistry.map(cloneTool);
}

export function getToolById(id: string): AgentToolDefinition | undefined {
  const tool = immutableRegistry.find((definition) => definition.id === id);
  return tool ? cloneTool(tool) : undefined;
}

export function listToolsByDomain(domain: AgentToolDomain): AgentToolDefinition[] {
  return immutableRegistry
    .filter((definition) => definition.domain === domain)
    .map(cloneTool);
}

export function listEnabledTools(): AgentToolDefinition[] {
  return immutableRegistry
    .filter((definition) => definition.enabled)
    .map(cloneTool);
}

export {
  getToolRiskSummary,
  isToolAllowedForApproval,
  validateToolDefinition,
};
