import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../migrations/20260722000000_github_read_only_connections.sql", import.meta.url),
  "utf8",
).toLowerCase();
const generatedTypes = readFileSync(
  new URL("../../src/integrations/supabase/types.ts", import.meta.url),
  "utf8",
);

describe("GitHub read-only connection migration", () => {
  it("enables RLS and exposes only an own-row select policy", () => {
    expect(migration).toContain("alter table public.github_connections enable row level security")
    expect(migration).toContain("for select")
    expect(migration).toContain("using (auth.uid() = user_id)")
    expect(migration).toContain("revoke insert, update, delete on public.github_connections from anon, authenticated")
  })

  it("keeps connection attempts service-role only", () => {
    expect(migration).toContain("alter table public.github_connection_attempts enable row level security")
    expect(migration).toContain("revoke all on public.github_connection_attempts from anon, authenticated")
    expect(migration).not.toMatch(/create policy[\s\S]*on public\.github_connection_attempts/)
  })

  it("contains no provider credential columns", () => {
    expect(migration).not.toMatch(/access_token|installation_token|private_key|client_secret|bearer_token/)
    expect(migration).toContain("setup_state_hash")
    expect(migration).toContain("oauth_state_hash")
  })

  it("is represented in the canonical generated Supabase types", () => {
    expect(generatedTypes).toContain("github_connection_attempts: {");
    expect(generatedTypes).toContain("github_connections: {");
    expect(generatedTypes).toContain("setup_state_hash: string");
    expect(generatedTypes).toContain("github_account_login: string");
    expect(generatedTypes).not.toContain("github_access_token");
    expect(generatedTypes).not.toContain("github_client_secret");
  });
})
