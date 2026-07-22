import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { handleGitHubIntegrationRequest } from "../../agent/worker/github-integration";
import type { Env } from "../../agent/worker/types";

const RUN_LOCAL = process.env.SMARTFLOW_RUN_LOCAL_SUPABASE === "1";
const API_URL = process.env.SMARTFLOW_LOCAL_SUPABASE_URL ?? "";
const ANON_KEY = process.env.SMARTFLOW_LOCAL_SUPABASE_ANON_KEY ?? "";
const SERVICE_ROLE_KEY = process.env.SMARTFLOW_LOCAL_SUPABASE_SERVICE_ROLE_KEY ?? "";
const PASSWORD = "SmartFlow-local-RLS-2026!";

interface LocalUser {
  id: string;
  email: string;
  accessToken: string;
  client: SupabaseClient;
}

function localClient(key: string) {
  return createClient(API_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function createLocalUser(admin: SupabaseClient, label: string): Promise<LocalUser> {
  const email = `github-rls-${label}-${crypto.randomUUID()}@smartflow.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("Local test user was not created.");

  const client = localClient(ANON_KEY);
  const signIn = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signIn.error || !signIn.data.session) {
    throw signIn.error ?? new Error("Local test user did not receive a session.");
  }
  return { id: data.user.id, email, accessToken: signIn.data.session.access_token, client };
}

function workerEnv(): Env {
  return {
    SMARTFLOW_WORKER_MODE: "local-qa",
    SUPABASE_URL: API_URL,
    SUPABASE_ANON_KEY: ANON_KEY,
    SUPABASE_SERVICE_KEY: SERVICE_ROLE_KEY,
    GEMINI_API_KEY: "unused-local-test-value",
    GEMINI_MODEL: "unused-local-test-model",
    GITHUB_APP_ID: "12345",
    GITHUB_CLIENT_ID: "Iv1_local_test",
    GITHUB_APP_SLUG: "smartflow-local-qa",
    GITHUB_SETUP_URL: "http://127.0.0.1:8787/github/connect/setup",
    GITHUB_CALLBACK_URL: "http://127.0.0.1:8787/github/connect/callback",
    GITHUB_ALLOWED_ORIGINS: "http://localhost:8080",
    GITHUB_APP_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nAA==\n-----END PRIVATE KEY-----",
    GITHUB_CLIENT_SECRET: "local-test-secret",
    AI: {} as Ai,
  };
}

function workerRequest(path: string, method = "GET", accessToken?: string) {
  return new Request(`http://127.0.0.1:8787${path}`, {
    method,
    headers: {
      Origin: "http://localhost:8080",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}

function githubMock(fetcher: typeof fetch): typeof fetch {
  return async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const parsed = new URL(url);
    if (parsed.origin !== "https://github.com" && parsed.origin !== "https://api.github.com") {
      return fetcher(input, init);
    }
    if (url === "https://github.com/login/oauth/access_token") {
      return Response.json({ access_token: "transient-user-token", token_type: "bearer" });
    }
    if (parsed.pathname.startsWith("/user/installations/")) {
      const installationId = Number(parsed.pathname.split("/").pop());
      return Response.json({
        id: installationId,
        app_id: 12345,
        account: { id: 9001, login: "local-verified-user" },
      });
    }
    throw new Error(`Unexpected mocked GitHub path: ${parsed.pathname}`);
  };
}

const localDescribe = RUN_LOCAL ? describe.sequential : describe.skip;

localDescribe("GitHub connection live local Supabase RLS", () => {
  let admin: SupabaseClient;
  let userA: LocalUser;
  let userB: LocalUser;

  beforeAll(async () => {
    if (!API_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
      throw new Error("Local Supabase test environment is incomplete.");
    }
    admin = localClient(SERVICE_ROLE_KEY);
    userA = await createLocalUser(admin, "a");
    userB = await createLocalUser(admin, "b");
  });

  beforeEach(async () => {
    await admin.from("github_connection_attempts").delete().in("user_id", [userA.id, userB.id]);
    await admin.from("github_connections").delete().in("user_id", [userA.id, userB.id]);
  });

  afterAll(async () => {
    if (!admin) return;
    await admin.from("github_connection_attempts").delete().in("user_id", [userA?.id, userB?.id].filter(Boolean));
    await admin.from("github_connections").delete().in("user_id", [userA?.id, userB?.id].filter(Boolean));
    if (userA?.id) await admin.auth.admin.deleteUser(userA.id);
    if (userB?.id) await admin.auth.admin.deleteUser(userB.id);
  });

  it("isolates verified connection reads and denies browser mutations", async () => {
    const rows = [
      {
        user_id: userA.id,
        installation_id: 7001,
        github_account_id: 8001,
        github_account_login: "user-a",
        status: "connected",
        verified_at: new Date().toISOString(),
      },
      {
        user_id: userB.id,
        installation_id: 7002,
        github_account_id: 8002,
        github_account_login: "user-b",
        status: "connected",
        verified_at: new Date().toISOString(),
      },
    ];
    expect((await admin.from("github_connections").insert(rows)).error).toBeNull();

    const own = await userA.client.from("github_connections").select("github_account_login,status");
    expect(own.error).toBeNull();
    expect(own.data).toEqual([{ github_account_login: "user-a", status: "connected" }]);

    const other = await userB.client.from("github_connections").select("github_account_login").eq("user_id", userA.id);
    expect(other.error).toBeNull();
    expect(other.data).toEqual([]);

    const browserInsert = await userA.client.from("github_connections").insert({ ...rows[0], installation_id: 7999 });
    const browserUpdate = await userA.client.from("github_connections").update({ installation_id: 7999 }).eq("user_id", userA.id);
    const browserDelete = await userA.client.from("github_connections").delete().eq("user_id", userA.id);
    expect(browserInsert.error).not.toBeNull();
    expect(browserUpdate.error).not.toBeNull();
    expect(browserDelete.error).not.toBeNull();

    const unchanged = await admin.from("github_connections").select("installation_id").eq("user_id", userA.id).single();
    expect(unchanged.data?.installation_id).toBe(7001);
  });

  it("keeps connection attempts inaccessible to browser roles and available to service operations", async () => {
    const attempt = {
      user_id: userA.id,
      setup_state_hash: "a".repeat(64),
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    };
    expect((await admin.from("github_connection_attempts").insert(attempt)).error).toBeNull();
    expect((await admin.from("github_connection_attempts").select("id").eq("user_id", userA.id)).data).toHaveLength(1);

    expect((await userA.client.from("github_connection_attempts").select("id")).error).not.toBeNull();
    expect((await userA.client.from("github_connection_attempts").insert({ ...attempt, setup_state_hash: "b".repeat(64) })).error).not.toBeNull();
    expect((await userA.client.from("github_connection_attempts").update({ completed_at: new Date().toISOString() }).eq("user_id", userA.id)).error).not.toBeNull();
    expect((await userA.client.from("github_connection_attempts").delete().eq("user_id", userA.id)).error).not.toBeNull();
  });

  it("enforces schema constraints and prevents one installation from being mapped to two users", async () => {
    const verifiedAt = new Date().toISOString();
    expect((await admin.from("github_connections").insert({
      user_id: userA.id,
      installation_id: 7100,
      github_account_id: 8100,
      github_account_login: "user-a",
      status: "connected",
      verified_at: verifiedAt,
    })).error).toBeNull();

    const duplicateInstallation = await admin.from("github_connections").insert({
      user_id: userB.id,
      installation_id: 7100,
      github_account_id: 8200,
      github_account_login: "user-b",
      status: "connected",
      verified_at: verifiedAt,
    });
    const invalidClaim = await admin.from("github_connections").insert({
      user_id: userB.id,
      installation_id: -1,
      github_account_id: 8200,
      github_account_login: "user-b",
      status: "connected",
      verified_at: verifiedAt,
    });
    expect(duplicateInstallation.error).not.toBeNull();
    expect(invalidClaim.error).not.toBeNull();
  });

  it("uses live single-use state rows and never trusts the setup claim before verification", async () => {
    const fetcher = githubMock(fetch);
    const dependencies = {
      fetcher,
      createAppJwt: async () => "unused-app-jwt",
    };
    const started = await handleGitHubIntegrationRequest(
      workerRequest("/github/connect/start", "POST", userA.accessToken),
      workerEnv(),
      dependencies,
    );
    expect(started?.status).toBe(200);
    const startBody = await started!.json() as { installationUrl: string };
    const setupState = new URL(startBody.installationUrl).searchParams.get("state");
    expect(setupState).toBeTruthy();

    const setup = await handleGitHubIntegrationRequest(
      workerRequest(`/github/connect/setup?state=${setupState}&installation_id=7200`),
      workerEnv(),
      dependencies,
    );
    expect(setup?.status).toBe(302);
    expect((await admin.from("github_connections").select("id").eq("user_id", userA.id)).data).toEqual([]);

    const setupReplay = await handleGitHubIntegrationRequest(
      workerRequest(`/github/connect/setup?state=${setupState}&installation_id=7200`),
      workerEnv(),
      dependencies,
    );
    expect(setupReplay?.status).toBe(400);

    const oauthState = new URL(setup!.headers.get("Location")!).searchParams.get("state");
    const callback = await handleGitHubIntegrationRequest(
      workerRequest(`/github/connect/callback?state=${oauthState}&code=local-code`),
      workerEnv(),
      dependencies,
    );
    expect(callback?.status).toBe(200);

    const persisted = await admin.from("github_connections").select("user_id,installation_id").eq("user_id", userA.id).single();
    expect(persisted.data).toEqual({ user_id: userA.id, installation_id: 7200 });
    const hiddenFromB = await userB.client.from("github_connections").select("id").eq("user_id", userA.id);
    expect(hiddenFromB.data).toEqual([]);

    const callbackReplay = await handleGitHubIntegrationRequest(
      workerRequest(`/github/connect/callback?state=${oauthState}&code=local-code`),
      workerEnv(),
      dependencies,
    );
    expect(callbackReplay?.status).toBe(400);
  });

  it("rejects expired live attempts before any claim can be finalized", async () => {
    const rawState = "A".repeat(43);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawState));
    const setupStateHash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    expect((await admin.from("github_connection_attempts").insert({
      user_id: userA.id,
      setup_state_hash: setupStateHash,
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    })).error).toBeNull();

    const result = await handleGitHubIntegrationRequest(
      workerRequest(`/github/connect/setup?state=${rawState}&installation_id=7300`),
      workerEnv(),
      { fetcher: githubMock(fetch), createAppJwt: async () => "unused-app-jwt" },
    );
    expect(result?.status).toBe(400);
    expect((await admin.from("github_connections").select("id").eq("user_id", userA.id)).data).toEqual([]);
  });
});
