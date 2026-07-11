import { describe, expect, it } from "vitest";
import {
  appendExecutionAuditRecord,
  clearExecutionAuditRecords,
  getExecutionAuditRecords,
  getExecutionAuditRecordsByRequestId,
  getExecutionAuditRecordsByToolId,
  getLatestExecutionAuditRecord,
  sanitizeAuditMetadata,
  sanitizeErrorCode,
  sanitizeIdentifier,
} from "./executionAudit";
import {
  clearExecutionRecords,
  executeAgentTool,
  getExecutionRecords,
} from "./executionEngine";
import { listRegisteredHandlers } from "./handlers";
import type { ExecutionAuditRecord } from "./executionAuditTypes";
import type {
  AgentToolHandler,
  ExecutionContext,
  ExecutionRequest,
} from "./executionTypes";
import type {
  WorkspacePlanActionType,
  WorkspacePlanStep,
} from "../workspace/workspaceTypes";

const now = new Date("2026-07-10T09:00:00.000Z");

function deps(overrides: Partial<Parameters<typeof executeAgentTool>[1]> = {}) {
  return {
    now: () => now,
    ...overrides,
  };
}

function step(
  actionType: WorkspacePlanActionType,
  overrides: Partial<WorkspacePlanStep> = {},
): WorkspacePlanStep {
  return {
    id: "step-1",
    order: 1,
    title: `${actionType} step`,
    description: `${actionType} description.`,
    domain: "tasks",
    estimatedMinutes: 10,
    status: "proposed",
    actionType,
    reason: `${actionType} reason.`,
    requiresApproval: false,
    dependencies: [],
    optional: false,
    ...overrides,
  };
}

function request(
  toolId: string,
  actionType: WorkspacePlanActionType,
  context: ExecutionContext = {},
  overrides: Partial<ExecutionRequest> = {},
): ExecutionRequest {
  return {
    requestId: `request:${toolId}`,
    step: step(actionType),
    toolId,
    input: {},
    requestedAt: now.toISOString(),
    context,
    ...overrides,
  };
}

function auditRecord(overrides: Partial<ExecutionAuditRecord> = {}): ExecutionAuditRecord {
  return {
    auditId: "audit-1",
    requestId: "request-1",
    stepId: "step-1",
    toolId: "tasks.list",
    status: "success",
    policyStatus: "allowed",
    startedAt: now.toISOString(),
    completedAt: now.toISOString(),
    durationMs: 0,
    riskLevel: "none",
    source: "agent",
    executionVersion: "execution-engine-v1",
    policyVersion: "execution-policy-v1",
    auditVersion: "execution-audit-v1",
    metadata: { handlerId: "tasks.list" },
    ...overrides,
  };
}

describe("executionAudit", () => {
  it("creates started and success terminal records", async () => {
    clearExecutionAuditRecords();

    await executeAgentTool(
      request("tasks.list", "review", {
        tasks: [{ id: "task-1", title: "Review invoices", completed: false }],
      }),
      deps(),
    );

    const records = getExecutionAuditRecordsByRequestId("request:tasks.list");
    expect(records.map((record) => record.status)).toEqual(["started", "success"]);
    expect(records[0].completedAt).toBeUndefined();
    expect(records[1].completedAt).toBe(now.toISOString());
    expect(records[1].stepId).toBe("step-1");
  });

  it("audits policy denial", async () => {
    clearExecutionAuditRecords();

    await executeAgentTool(request("tasks.create", "create"), deps());

    const records = getExecutionAuditRecordsByRequestId("request:tasks.create");
    expect(records.map((record) => record.status)).toEqual(["started", "policy_denied"]);
    expect(records[1].policyStatus).toBe("approval_required");
    expect(records[1].errorCode).toBe("POLICY_DENIED");
  });

  it("audits unknown tool, missing handler, invalid input, timeout, and handler failure", async () => {
    clearExecutionAuditRecords();

    await executeAgentTool(request("unknown.tool", "review"), deps());
    await executeAgentTool(
      request("documents.list_recent", "review", {}, {
        step: step("review", { domain: "documents" }),
      }),
      deps(),
    );
    await executeAgentTool(request("tasks.list", "review", {}, { input: null as never }), deps());

    const slowHandler: AgentToolHandler = {
      ...listRegisteredHandlers()[0],
      timeoutMs: 1,
      execute() {
        return new Promise(() => undefined);
      },
    };
    await executeAgentTool(
      request("tasks.list", "review", {}, { requestId: "request-timeout" }),
      deps({ getHandlerByToolId: () => slowHandler }),
    );

    const failingHandler: AgentToolHandler = {
      ...listRegisteredHandlers()[0],
      execute() {
        throw new Error("Stack should not be stored.");
      },
    };
    await executeAgentTool(
      request("tasks.list", "review", {}, { requestId: "request-failed" }),
      deps({ getHandlerByToolId: () => failingHandler }),
    );

    const terminalStatuses = getExecutionAuditRecords()
      .filter((record) => record.status !== "started")
      .map((record) => record.status);

    expect(terminalStatuses).toEqual([
      "tool_not_found",
      "handler_not_found",
      "invalid_input",
      "timeout",
      "failed",
    ]);
  });

  it("creates exactly one terminal record per request", async () => {
    clearExecutionAuditRecords();

    await executeAgentTool(request("tasks.list", "review"), deps());

    const records = getExecutionAuditRecordsByRequestId("request:tasks.list");
    const terminalRecords = records.filter((record) => record.status !== "started");
    expect(records).toHaveLength(2);
    expect(terminalRecords).toHaveLength(1);
  });

  it("filters records by request and tool", () => {
    clearExecutionAuditRecords();

    appendExecutionAuditRecord(auditRecord({ requestId: "request-a", toolId: "tasks.list" }));
    appendExecutionAuditRecord(auditRecord({ requestId: "request-b", toolId: "calendar.list_today" }));

    expect(getExecutionAuditRecordsByRequestId("request-a")).toHaveLength(1);
    expect(getExecutionAuditRecordsByToolId("calendar.list_today")).toHaveLength(1);
    expect(getLatestExecutionAuditRecord()?.requestId).toBe("request-b");
  });

  it("bounds records to 200 and removes oldest first", () => {
    clearExecutionAuditRecords();

    for (let index = 0; index < 205; index += 1) {
      appendExecutionAuditRecord(auditRecord({
        auditId: `audit-${index}`,
        requestId: `request-${index}`,
      }));
    }

    const records = getExecutionAuditRecords();
    expect(records).toHaveLength(200);
    expect(records[0].requestId).toBe("request-5");
    expect(records[199].requestId).toBe("request-204");
  });

  it("does not store input or output payloads in audit records", async () => {
    clearExecutionAuditRecords();

    await executeAgentTool(
      request("tasks.list", "review", {
        tasks: [{ id: "task-1", title: "Sensitive task title", completed: false }],
      }),
      deps(),
    );

    const terminal = getLatestExecutionAuditRecord();
    expect(terminal?.metadata).toMatchObject({
      handlerId: "tasks.list",
      resultShape: "object",
      itemCount: 1,
      redacted: true,
    });
    expect(JSON.stringify(terminal)).not.toContain("Sensitive task title");
  });

  it("sanitizes metadata and identifiers deterministically", () => {
    const metadata = sanitizeAuditMetadata({
      handlerId: "tasks.list",
      token: "secret",
      apiKey: "secret",
      callbackUrl: "https://example.test/path?token=secret#hash",
      long: "x".repeat(300),
      nested: { safe: "yes", password: "hidden", tooDeep: { value: "removed" } },
      fn: () => "no",
      values: ["safe", "https://example.test/a?b=c#d", Symbol("no")],
    });

    expect(metadata).toEqual({
      handlerId: "tasks.list",
      callbackUrl: "https://example.test/path",
      long: "x".repeat(160),
      nested: { safe: "yes" },
      values: ["safe", "https://example.test/a"],
      redacted: true,
    });
    expect(sanitizeIdentifier("https://x.test/a?token=1#hash")).toBe("https://x.test/a");
    expect(sanitizeErrorCode("bad code!")).toBe("bad_code_");
    expect(sanitizeAuditMetadata(metadata)).toEqual(metadata);
  });

  it("returned records cannot mutate internal store", () => {
    clearExecutionAuditRecords();
    appendExecutionAuditRecord(auditRecord());

    const records = getExecutionAuditRecords();
    records[0].requestId = "mutated";
    records[0].metadata.handlerId = "mutated";

    expect(getExecutionAuditRecords()[0].requestId).toBe("request-1");
    expect(getExecutionAuditRecords()[0].metadata.handlerId).toBe("tasks.list");
  });

  it("clear function removes all records", () => {
    appendExecutionAuditRecord(auditRecord());
    clearExecutionAuditRecords();

    expect(getExecutionAuditRecords()).toEqual([]);
    expect(getLatestExecutionAuditRecord()).toBeUndefined();
  });

  it("audit failure does not block execution result delivery", async () => {
    clearExecutionAuditRecords();

    const result = await executeAgentTool(
      request("tasks.list", "review"),
      deps({
        appendExecutionAuditRecord() {
          throw new Error("Audit unavailable.");
        },
      }),
    );

    expect(result.status).toBe("success");
  });

  it("keeps ExecutionRecord as a compatibility projection over audit", async () => {
    clearExecutionRecords();

    await executeAgentTool(request("tasks.list", "review"), deps());

    const records = getExecutionRecords();
    expect(records).toEqual([
      {
        requestId: "request:tasks.list",
        stepId: "step-1",
        toolId: "tasks.list",
        status: "success",
        startedAt: now.toISOString(),
        completedAt: now.toISOString(),
        durationMs: 0,
        policyStatus: "allowed",
        errorCode: undefined,
      },
    ]);
  });
});
