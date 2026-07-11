import type { AgentToolSchemaField } from "../toolTypes";
import type { ExecutionInputValidationResult } from "../executionTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function matchesType(value: unknown, field: AgentToolSchemaField) {
  switch (field.type) {
    case "string":
    case "date":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return isRecord(value);
    case "enum":
      return typeof value === "string" && field.enumValues?.includes(value);
    default:
      return false;
  }
}

export function validateInputAgainstSchema(
  input: unknown,
  schema: readonly AgentToolSchemaField[],
): ExecutionInputValidationResult {
  if (!isRecord(input)) {
    return { valid: false, errors: ["Input must be an object."] };
  }

  const errors: string[] = [];
  for (const field of schema) {
    const value = input[field.name];
    if (field.required && value === undefined) {
      errors.push(`${field.name} is required.`);
      continue;
    }
    if (value !== undefined && !matchesType(value, field)) {
      errors.push(`${field.name} must be ${field.type}.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
