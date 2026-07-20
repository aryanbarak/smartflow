import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
const DEFAULT_EMAIL = "smartflow-local-qa@example.com";
const OTHER_EMAIL = "smartflow-local-qa-other@example.com";
export const LOCAL_QA_SCENARIOS = [
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
];
export const ARUX_RESET_TABLES = [
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
];

export function assertKnownScenario(scenario) {
  if (!LOCAL_QA_SCENARIOS.includes(scenario)) {
    throw new Error(`Unsupported local QA scenario: ${scenario}`);
  }
  return scenario;
}

function parseArgs(argv) {
  const args = { scenario: "empty", verifyRls: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--scenario") {
      args.scenario = argv[i + 1];
      i += 1;
    } else if (arg === "--verify-rls") {
      args.verifyRls = true;
    }
  }
  return args;
}

export function assertLocalUrl(value) {
  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    !LOCAL_HOSTS.has(url.hostname) ||
    url.username ||
    url.password ||
    (url.pathname && url.pathname !== "/") ||
    url.search ||
    url.hash
  ) {
    throw new Error("Refusing to seed: Supabase URL must be local loopback http.");
  }
  return url.toString().replace(/\/$/, "");
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

export function localDate(offsetDays = 0, now = new Date()) {
  const value = new Date(now);
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() + offsetDays);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function completedThisWeekDate(now = new Date()) {
  const value = new Date(now);
  value.setHours(12, 0, 0, 0);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - Math.min(day - 1, 2));
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const date = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function taskRows(userId, rows) {
  return rows.map((row) => ({
    user_id: userId,
    title: row.title,
    notes: row.notes ?? null,
    due_date: row.dueDate ?? null,
    completed: row.completed ?? false,
    completed_at: row.completedAt ?? null,
  }));
}

function todayAt(time) {
  return new Date(`${localDate()}T${time}:00`).toISOString();
}

function aruxSixTaskRows(userId) {
  const today = localDate();
  const tomorrow = localDate(1);
  const completedDate = completedThisWeekDate();
  return taskRows(userId, [
    { title: "Review active task list", dueDate: today },
    { title: "Prepare tomorrow's focus", dueDate: tomorrow },
    { title: "Organize workspace notes", dueDate: tomorrow },
    { title: "Review budget checkpoint" },
    { title: "Plan study session" },
    { title: "Archive reference document" },
    { title: "Completed this week sample A", dueDate: completedDate, completed: true, completedAt: new Date(`${completedDate}T09:00:00`).toISOString() },
    { title: "Completed this week sample B", dueDate: completedDate, completed: true, completedAt: new Date(`${completedDate}T10:00:00`).toISOString() },
    { title: "Completed this week sample C", dueDate: completedDate, completed: true, completedAt: new Date(`${completedDate}T11:00:00`).toISOString() },
    { title: "Completed this week sample D", dueDate: completedDate, completed: true, completedAt: new Date(`${completedDate}T12:00:00`).toISOString() },
  ]);
}

async function findUserByEmail(admin, email) {
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function upsertLocalUser(admin, email, password) {
  const existing = await findUserByEmail(admin, email);
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      email,
      password,
      email_confirm: true,
      user_metadata: { localQa: true },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { localQa: true },
  });
  if (error) throw error;
  return data.user;
}

function throwTableError(action, table, error) {
  throw new Error(`Local QA ${action} failed for ${table}: ${error?.message ?? "Unknown Supabase error"}`);
}

async function expectNoError(resultPromise, action, table) {
  const { error } = await resultPromise;
  if (error) throwTableError(action, table, error);
}

export async function resetUserData(admin, userId) {
  for (const table of ARUX_RESET_TABLES) {
    await expectNoError(admin.from(table).delete().eq("user_id", userId), "reset", table);
  }
}

export async function verifyResetScopeEmpty(admin, userId) {
  for (const table of ARUX_RESET_TABLES) {
    const { data, error } = await admin.from(table).select("id").eq("user_id", userId).limit(1);
    if (error) throwTableError("reset verification", table, error);
    if ((data ?? []).length > 0) {
      throw new Error(`Local QA reset verification failed: ${table} still has rows for the QA user.`);
    }
  }
}

async function insertRows(admin, table, rows, scenario) {
  await expectNoError(admin.from(table).insert(rows), `seed ${scenario}`, table);
}

async function upsertProfile(admin, userId, scenario) {
  await expectNoError(
    admin.from("profiles").upsert({
      user_id: userId,
      display_name: "SmartFlow Local QA",
    }, { onConflict: "user_id" }),
    `seed ${scenario}`,
    "profiles",
  );
}

export async function seedScenario(admin, userId, scenario) {
  await upsertProfile(admin, userId, scenario);

  if (scenario === "empty") return;

  const today = localDate();
  const tomorrow = localDate(1);
  const completedDate = completedThisWeekDate();

  if (scenario === "tasks-basic" || scenario === "workspace-rich") {
    await insertRows(admin, "tasks", [
      {
        user_id: userId,
        title: "Review active task list",
        due_date: today,
        completed: false,
      },
      {
        user_id: userId,
        title: "Prepare tomorrow's focus",
        due_date: tomorrow,
        completed: false,
      },
      {
        user_id: userId,
        title: "Completed this week sample",
        due_date: completedDate,
        completed: true,
        completed_at: new Date(`${completedDate}T09:00:00`).toISOString(),
      },
    ], scenario);
  }

  if (scenario === "arux-one-task") {
    await insertRows(admin, "tasks", taskRows(userId, [
      { title: "Review active task list", dueDate: localDate() },
    ]), scenario);
  }

  if (scenario === "arux-two-tasks") {
    await insertRows(admin, "tasks", taskRows(userId, [
      { title: "Review active task list", dueDate: localDate() },
      { title: "Prepare tomorrow's focus", dueDate: localDate(1) },
    ]), scenario);
  }

  if (scenario === "arux-six-tasks" || scenario === "arux-workspace-rich") {
    await insertRows(admin, "tasks", aruxSixTaskRows(userId), scenario);
  }

  if (scenario === "arux-complete-target") {
    await insertRows(admin, "tasks", taskRows(userId, [
      { title: "Selected task", dueDate: localDate() },
    ]), scenario);
  }

  if (scenario === "arux-completed-target") {
    const completedDate = completedThisWeekDate();
    await insertRows(admin, "tasks", taskRows(userId, [
      {
        title: "Selected task",
        dueDate: localDate(),
        completed: true,
        completedAt: new Date(`${completedDate}T09:00:00`).toISOString(),
      },
    ]), scenario);
  }

  if (scenario === "workspace-rich" || scenario === "arux-workspace-rich" || scenario === "arux-calendar-two") {
    await insertRows(admin, "calendar_events", [
      {
        user_id: userId,
        title: scenario === "arux-calendar-two" || scenario === "arux-workspace-rich" ? "Local QA planning block" : "Local QA focus block",
        date: today,
        start_time: "10:00",
        end_time: "10:30",
        type: "work",
        all_day: false,
      },
      ...(scenario === "arux-calendar-two" || scenario === "arux-workspace-rich"
        ? [{
            user_id: userId,
            title: "Local QA review",
            date: today,
            start_time: "14:00",
            end_time: "14:30",
            type: "work",
            all_day: false,
          }]
        : []),
    ], scenario);
  }

  if (scenario === "workspace-rich" || scenario === "arux-workspace-rich") {
    await insertRows(admin, "finance_transactions", [
      {
        user_id: userId,
        type: "expense",
        amount: 12.5,
        category: "Local QA",
        date: today,
        notes: "Deterministic local QA fixture",
      },
    ], scenario);
  }

  if (scenario === "workspace-rich" || scenario === "arux-workspace-rich" || scenario === "arux-learning-two") {
    await insertRows(admin, "learn_ai_messages", [
      {
        user_id: userId,
        mode: "learning",
        language: "en",
        role: "user",
        content: "Continue local QA learning context",
        created_at: todayAt("08:45"),
      },
      ...(scenario === "arux-learning-two" || scenario === "arux-workspace-rich"
        ? [{
            user_id: userId,
            mode: "learning",
            language: "en",
            role: "user",
            content: "Review deterministic ARUX learning context",
            created_at: todayAt("09:15"),
          }]
        : []),
    ], scenario);
  }
}

async function verifyRls(url, anonKey, email, password, otherEmail, otherPassword) {
  const userClient = createClient(url, anonKey);
  const otherClient = createClient(url, anonKey);

  const { data: userSession, error: userError } = await userClient.auth.signInWithPassword({
    email,
    password,
  });
  if (userError) throw userError;

  const { error: otherError } = await otherClient.auth.signInWithPassword({
    email: otherEmail,
    password: otherPassword,
  });
  if (otherError) throw otherError;

  const { data: ownRows, error: ownError } = await userClient
    .from("tasks")
    .select("id")
    .eq("user_id", userSession.user.id);
  if (ownError) throw ownError;

  const { data: blockedRows, error: blockedError } = await otherClient
    .from("tasks")
    .select("id")
    .eq("user_id", userSession.user.id);
  if (blockedError) throw blockedError;

  if ((ownRows ?? []).length === 0) {
    throw new Error("RLS verification requires at least one seeded task.");
  }
  if ((blockedRows ?? []).length !== 0) {
    throw new Error("RLS verification failed: another user can read QA user's tasks.");
  }
}

async function main() {
  const { scenario, verifyRls: shouldVerifyRls } = parseArgs(process.argv.slice(2));
  const url = assertLocalUrl(requiredEnv("SUPABASE_LOCAL_URL"));
  const anonKey = requiredEnv("SUPABASE_LOCAL_ANON_KEY");
  const serviceRoleKey = requiredEnv("SUPABASE_LOCAL_SERVICE_ROLE_KEY");
  const password = requiredEnv("SMARTFLOW_LOCAL_QA_PASSWORD");
  const otherPassword = process.env.SMARTFLOW_LOCAL_QA_OTHER_PASSWORD?.trim() || password;
  const email = process.env.SMARTFLOW_LOCAL_QA_EMAIL?.trim() || DEFAULT_EMAIL;
  const otherEmail = process.env.SMARTFLOW_LOCAL_QA_OTHER_EMAIL?.trim() || OTHER_EMAIL;

  assertKnownScenario(scenario);

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const user = await upsertLocalUser(admin, email, password);
  await resetUserData(admin, user.id);
  await verifyResetScopeEmpty(admin, user.id);
  await seedScenario(admin, user.id, scenario);

  if (shouldVerifyRls) {
    const otherUser = await upsertLocalUser(admin, otherEmail, otherPassword);
    await resetUserData(admin, otherUser.id);
    await verifyResetScopeEmpty(admin, otherUser.id);
    await verifyRls(url, anonKey, email, password, otherEmail, otherPassword);
  }

  console.log(`Local QA scenario ready: ${scenario}`);
  console.log(`Local QA email: ${email}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
