import type {
  AgentToolCapability,
  AgentToolDefinition,
  AgentToolDomain,
  AgentToolValidationResult,
} from "./toolTypes";

const toolDomains: AgentToolDomain[] = [
  "tasks",
  "calendar",
  "habits",
  "finance",
  "documents",
  "learning",
  "conversations",
  "workspace",
  "system",
];

const toolCapabilities: AgentToolCapability[] = [
  "inspect",
  "search",
  "open",
  "summarize",
  "create",
  "update",
  "delete",
  "send",
  "schedule",
  "complete",
  "analyze",
  "recommend",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateSchemaField(field: unknown, path: string): string[] {
  if (!isRecord(field)) return [`${path} must be an object.`];
  const errors: string[] = [];
  if (!hasString(field.name)) errors.push(`${path}.name is required.`);
  if (!hasString(field.description)) errors.push(`${path}.description is required.`);
  if (typeof field.required !== "boolean") errors.push(`${path}.required must be boolean.`);
  if (
    field.type !== "string" &&
    field.type !== "number" &&
    field.type !== "boolean" &&
    field.type !== "date" &&
    field.type !== "array" &&
    field.type !== "object" &&
    field.type !== "enum"
  ) {
    errors.push(`${path}.type is invalid.`);
  }
  if (field.type === "enum" && (!Array.isArray(field.enumValues) || field.enumValues.length === 0)) {
    errors.push(`${path}.enumValues are required for enum fields.`);
  }
  if (field.sensitive !== undefined && typeof field.sensitive !== "boolean") {
    errors.push(`${path}.sensitive must be boolean when provided.`);
  }
  return errors;
}

function validateOutputSchema(schema: unknown): string[] {
  if (!isRecord(schema)) return ["outputSchema must be an object."];
  const errors = validateSchemaField(
    {
      name: "output",
      type: schema.type,
      required: true,
      description: schema.description,
    },
    "outputSchema",
  ).filter((error) => !error.includes("outputSchema.name"));
  if (schema.containsSensitiveData !== undefined && typeof schema.containsSensitiveData !== "boolean") {
    errors.push("outputSchema.containsSensitiveData must be boolean when provided.");
  }
  if (schema.fields !== undefined) {
    if (!Array.isArray(schema.fields)) {
      errors.push("outputSchema.fields must be an array when provided.");
    } else {
      schema.fields.forEach((field, index) => {
        errors.push(...validateSchemaField(field, `outputSchema.fields[${index}]`));
      });
    }
  }
  return errors;
}

export function validateToolDefinition(
  definition: unknown,
  existingDefinitions: readonly AgentToolDefinition[] = [],
): AgentToolValidationResult {
  if (!isRecord(definition)) {
    return { valid: false, errors: ["definition must be an object."] };
  }

  const tool = definition as Partial<AgentToolDefinition>;
  const errors: string[] = [];
  if (!hasString(tool.id)) errors.push("id is required.");
  if (!hasString(tool.name)) errors.push("name is required.");
  if (!hasString(tool.description)) errors.push("description is required.");
  if (!tool.domain || !toolDomains.includes(tool.domain)) errors.push("domain is invalid.");
  if (!tool.capability || !toolCapabilities.includes(tool.capability)) errors.push("capability is invalid.");
  if (tool.mode !== "read" && tool.mode !== "write" && tool.mode !== "mixed") errors.push("mode is invalid.");
  if (tool.riskLevel !== "none" && tool.riskLevel !== "low" && tool.riskLevel !== "medium" && tool.riskLevel !== "high") {
    errors.push("riskLevel is required.");
  }
  if (typeof tool.requiresApproval !== "boolean") errors.push("requiresApproval is required.");
  if (
    tool.approvalScope !== "view_only" &&
    tool.approvalScope !== "single_step" &&
    tool.approvalScope !== "multiple_steps" &&
    tool.approvalScope !== "entire_plan"
  ) {
    errors.push("approvalScope is invalid.");
  }
  if (typeof tool.reversible !== "boolean") errors.push("reversible is required.");
  if (typeof tool.externalEffect !== "boolean") errors.push("externalEffect is required.");
  if (typeof tool.enabled !== "boolean") errors.push("enabled is required.");
  if (!hasString(tool.version)) errors.push("version is required.");
  if (!Array.isArray(tool.inputSchema)) {
    errors.push("inputSchema must be an array.");
  } else {
    tool.inputSchema.forEach((field, index) => {
      errors.push(...validateSchemaField(field, `inputSchema[${index}]`));
    });
  }
  errors.push(...validateOutputSchema(tool.outputSchema));
  if (!Array.isArray(tool.tags)) errors.push("tags must be an array.");
  if (!Array.isArray(tool.examples)) errors.push("examples must be an array.");
  if (!Array.isArray(tool.constraints)) errors.push("constraints must be an array.");

  const duplicate = existingDefinitions.some((existing) => existing.id === tool.id);
  if (duplicate) errors.push(`duplicate tool id: ${tool.id}`);

  if (tool.mode !== "read" && tool.requiresApproval === false) {
    errors.push("state-changing tools must require approval.");
  }
  if (tool.mode !== "read" && typeof tool.externalEffect !== "boolean") {
    errors.push("state-changing tools must declare externalEffect.");
  }
  if (tool.riskLevel === "high" && tool.requiresApproval !== true) {
    errors.push("high-risk tools must require approval.");
  }
  if (tool.requiresApproval === false && tool.approvalScope !== "view_only") {
    errors.push("tools without approval must use view_only approval scope.");
  }

  return { valid: errors.length === 0, errors };
}

export function validateToolRegistry(definitions: readonly AgentToolDefinition[]) {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const definition of definitions) {
    if (seen.has(definition.id)) {
      errors.push(`duplicate tool id: ${definition.id}`);
    }
    const result = validateToolDefinition(definition);
    if (!result.valid) errors.push(...result.errors);
    seen.add(definition.id);
  }
  if (errors.length > 0) {
    throw new Error(`Invalid agent tool registry: ${errors.join("; ")}`);
  }
}
