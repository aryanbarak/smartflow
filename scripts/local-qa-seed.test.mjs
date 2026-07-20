import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ARUX_RESET_TABLES,
  LOCAL_QA_SCENARIOS,
  assertKnownScenario,
  assertLocalUrl,
  localDate,
  resetUserData,
  seedScenario,
} from "./local-qa-seed.mjs";

function createAdminStub({ deleteErrors = {}, insertErrors = {} } = {}) {
  const calls = [];

  return {
    calls,
    from(table) {
      return {
        delete() {
          return {
            eq(column, value) {
              calls.push({ action: "delete", table, column, value });
              return Promise.resolve({ error: deleteErrors[table] ?? null });
            },
          };
        },
        insert(rows) {
          calls.push({ action: "insert", table, rows });
          return Promise.resolve({ error: insertErrors[table] ?? null });
        },
        upsert(rows, options) {
          calls.push({ action: "upsert", table, rows, options });
          return Promise.resolve({ error: insertErrors[table] ?? null });
        },
      };
    },
  };
}

describe("local QA seed safety helpers", () => {
  it("rejects unknown scenarios", () => {
    assert.throws(() => assertKnownScenario("production-like"), /Unsupported local QA scenario/);
  });

  it("rejects non-local and credential-bearing URLs before client creation", () => {
    assert.throws(() => assertLocalUrl("https://example.supabase.co"), /loopback/);
    assert.throws(() => assertLocalUrl("http://user:pass@127.0.0.1:54321"), /loopback/);
  });

  it("derives today and tomorrow from the supplied local date", () => {
    const now = new Date(2026, 6, 16, 23, 30, 0);

    assert.equal(localDate(0, now), "2026-07-16");
    assert.equal(localDate(1, now), "2026-07-17");
  });

  it("declares the ARUX browser scenarios explicitly", () => {
    assert.deepEqual(LOCAL_QA_SCENARIOS, [
      "empty",
      "tasks-basic",
      "workspace-rich",
      "arux-one-task",
      "arux-two-tasks",
      "arux-six-tasks",
      "arux-calendar-two",
      "arux-learning-two",
      "arux-workspace-rich",
      "arux-complete-target",
      "arux-completed-target",
    ]);
  });

  it("keeps the ARUX reset scope focused on browser-visible state", () => {
    assert.deepEqual(ARUX_RESET_TABLES, [
      "agent_chat_messages",
      "chat_sessions",
      "agent_briefings",
      "learn_ai_messages",
      "calendar_events",
      "finance_transactions",
      "documents",
      "tasks",
      "profiles",
      "user_settings",
    ]);
  });

  it("fails reset immediately on table-specific delete errors", async () => {
    const admin = createAdminStub({
      deleteErrors: {
        documents: { message: "permission denied" },
      },
    });

    await assert.rejects(
      () => resetUserData(admin, "user-1"),
      /Local QA reset failed for documents: permission denied/,
    );
    assert.equal(admin.calls.some((call) => call.table === "tasks"), false);
  });

  it("fails fixture insertion on table-specific insert errors", async () => {
    const admin = createAdminStub({
      insertErrors: {
        tasks: { message: "schema mismatch" },
      },
    });

    await assert.rejects(
      () => seedScenario(admin, "user-1", "tasks-basic"),
      /Local QA seed tasks-basic failed for tasks: schema mismatch/,
    );
  });

  it("upserts a stable profile before returning the empty scenario", async () => {
    const admin = createAdminStub();

    await seedScenario(admin, "user-1", "empty");

    assert.deepEqual(admin.calls, [{
      action: "upsert",
      table: "profiles",
      rows: {
        user_id: "user-1",
        display_name: "SmartFlow Local QA",
      },
      options: { onConflict: "user_id" },
    }]);
  });

  it("does not log sensitive values from validation helpers", () => {
    const originalLog = console.log;
    const originalError = console.error;
    let logCount = 0;
    let errorCount = 0;
    console.log = () => {
      logCount += 1;
    };
    console.error = () => {
      errorCount += 1;
    };

    try {
      assert.throws(() => assertLocalUrl("http://user:secret@127.0.0.1:54321"));

      assert.equal(logCount, 0);
      assert.equal(errorCount, 0);
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }
  });
});
