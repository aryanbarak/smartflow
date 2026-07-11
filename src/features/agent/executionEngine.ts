import { evaluateExecutionPolicy } from "./executionPolicy";
import { getHandlerByToolId } from "./handlers";
import { getToolById } from "./toolRegistry";
import type {
  AgentToolHandler,
  ExecutionEngineDependencies,
  ExecutionError,
  ExecutionRecord,
  ExecutionRequest,
  ExecutionResult,
  ExecutionStatus,
} from "./executionTypes";
import type { AgentToolDefinition, ExecutionPolicyDecision } from "./toolTypes";

export const EXECUTION_ENGINE_VERSION = "execution-engine-v1" as const;
const MAX_EXECUTION_RECORDS = 100;

const executionRecords: ExecutionRecord[] = [];

const defaultDependencies: ExecutionEngineDependencies = {
  getToolById,
  getHandlerByToolId,
  now: () => new Date(),
};

function duration(startedAt: string, completedAt: string) {
  return Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());
}

function error(code: string, message: string, retryable = false, details?: Record<string, unknown>): ExecutionError {
  return {
    code,
    message,
    retryable,
    details,
  };
}

function record(result: ExecutionResult) {
  executionRecords.push({
    requestId: result.requestId,
    stepId: result.stepId,
    toolId: result.toolId,
    status: result.status,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    durationMs: result.durationMs,
    policyStatus: result.policyDecision.status,
    errorCode: result.error?.code,
  });

  if (executionRecords.length > MAX_EXECUTION_RECORDS) {
    executionRecords.splice(0, executionRecords.length - MAX_EXECUTION_RECORDS);
  }
}

function result(
  request: ExecutionRequest,
  status: ExecutionStatus,
  policyDecision: ExecutionPolicyDecision,
  startedAt: string,
  completedAt: string,
  options: {
    data?: unknown;
    error?: ExecutionError;
    handler?: AgentToolHandler;
  } = {},
): ExecutionResult {
  const output: ExecutionResult = {
    requestId: request.requestId,
    stepId: request.step.id,
    toolId: request.toolId,
    status,
    success: status === "success",
    data: options.data,
    error: options.error,
    policyDecision,
    startedAt,
    completedAt,
    durationMs: duration(startedAt, completedAt),
    executionVersion: EXECUTION_ENGINE_VERSION,
    metadata: {
      readOnly: options.handler?.readOnly ?? false,
      handlerId: options.handler?.toolId,
      effectiveRiskLevel: policyDecision.effectiveRiskLevel,
    },
  };

  record(output);
  return output;
}

function isSupportedReadOnlyHandler(handler: AgentToolHandler) {
  return handler.readOnly === true;
}

function isSupportedReadOnlyTool(
  tool: AgentToolDefinition,
  policyDecision: ExecutionPolicyDecision,
) {
  return (
    tool.mode === "read" &&
    tool.externalEffect === false &&
    tool.reversible === true &&
    (policyDecision.effectiveRiskLevel === "none" ||
      policyDecision.effectiveRiskLevel === "low")
  );
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(error("TIMEOUT", "Handler execution timed out.", true));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function executeAgentTool(
  request: ExecutionRequest,
  dependencies: Partial<ExecutionEngineDependencies> = {},
): Promise<ExecutionResult> {
  const deps = { ...defaultDependencies, ...dependencies };
  const startedAt = deps.now().toISOString();
  const tool = deps.getToolById(request.toolId);
  const policyDecision = evaluateExecutionPolicy({
    step: request.step,
    tool,
    approval: request.approval,
    currentTime: deps.now(),
    context: request.context?.policyContext,
  });

  if (!tool) {
    const completedAt = deps.now().toISOString();
    return result(request, "tool_not_found", policyDecision, startedAt, completedAt, {
      error: error("TOOL_NOT_FOUND", "Tool is not registered."),
    });
  }

  if (!policyDecision.allowed) {
    const completedAt = deps.now().toISOString();
    return result(request, "policy_denied", policyDecision, startedAt, completedAt, {
      error: error("POLICY_DENIED", "Execution policy denied this request.", false, {
        policyStatus: policyDecision.status,
      }),
    });
  }

  const handler = deps.getHandlerByToolId(request.toolId);
  if (!handler || !isSupportedReadOnlyHandler(handler) || !isSupportedReadOnlyTool(tool, policyDecision)) {
    const completedAt = deps.now().toISOString();
    return result(request, "handler_not_found", policyDecision, startedAt, completedAt, {
      error: error("HANDLER_NOT_FOUND", "No supported read-only handler is registered for this tool."),
    });
  }

  const validation = handler.validateInput(request.input, tool.inputSchema);
  if (!validation.valid) {
    const completedAt = deps.now().toISOString();
    return result(request, "invalid_input", policyDecision, startedAt, completedAt, {
      handler,
      error: error("INVALID_INPUT", "Tool input failed validation.", false, {
        errors: validation.errors,
      }),
    });
  }

  try {
    const data = await withTimeout(
      Promise.resolve(handler.execute(request.input, {
        ...request.context,
        currentTime: request.context?.currentTime ?? request.requestedAt,
      })),
      handler.timeoutMs,
    );
    const completedAt = deps.now().toISOString();
    return result(request, "success", policyDecision, startedAt, completedAt, {
      data,
      handler,
    });
  } catch (caught) {
    const completedAt = deps.now().toISOString();
    const normalizedError =
      typeof caught === "object" && caught && "code" in caught
        ? (caught as ExecutionError)
        : error("HANDLER_FAILED", "Handler execution failed.", false);
    const status = normalizedError.code === "TIMEOUT" ? "timeout" : "failed";
    return result(request, status, policyDecision, startedAt, completedAt, {
      handler,
      error: normalizedError,
    });
  }
}

export function getExecutionRecords(): ExecutionRecord[] {
  return executionRecords.map((item) => ({ ...item }));
}

export function clearExecutionRecords() {
  executionRecords.splice(0, executionRecords.length);
}
