import { describe, expect, it } from "vitest";
import { resolveSupabaseClientConfig } from "./supabaseConfig";

describe("resolveSupabaseClientConfig", () => {
  it("uses the production client by default", () => {
    const config = resolveSupabaseClientConfig({});

    expect(config.mode).toBe("production");
    expect(config.url).toBe("https://taqxwnlwllbywaklwyno.supabase.co");
    expect(config.anonKey.length).toBeGreaterThan(20);
  });

  it("uses explicit loopback local QA config", () => {
    const config = resolveSupabaseClientConfig({
      VITE_SMARTFLOW_SUPABASE_MODE: "local-qa",
      VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      VITE_SUPABASE_ANON_KEY: "local-anon-key",
    });

    expect(config).toEqual({
      mode: "local-qa",
      url: "http://127.0.0.1:54321",
      anonKey: "local-anon-key",
    });
  });

  it("uses explicit localhost local QA config", () => {
    const config = resolveSupabaseClientConfig({
      VITE_SMARTFLOW_SUPABASE_MODE: "local-qa",
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_ANON_KEY: "local-anon-key",
    });

    expect(config.mode).toBe("local-qa");
    expect(config.url).toBe("http://localhost:54321");
  });

  it("supports IPv6 loopback local QA config", () => {
    const config = resolveSupabaseClientConfig({
      VITE_SMARTFLOW_SUPABASE_MODE: "local-qa",
      VITE_SUPABASE_URL: "http://[::1]:54321",
      VITE_SUPABASE_ANON_KEY: "local-anon-key",
    });

    expect(config.mode).toBe("local-qa");
    expect(config.url).toBe("http://[::1]:54321");
  });

  it("fails closed when local QA URL is missing", () => {
    expect(() =>
      resolveSupabaseClientConfig({
        VITE_SMARTFLOW_SUPABASE_MODE: "local-qa",
        VITE_SUPABASE_ANON_KEY: "local-anon-key",
      }),
    ).toThrow(/VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY/);
  });

  it("fails closed when local QA anon key is missing", () => {
    expect(() =>
      resolveSupabaseClientConfig({
        VITE_SMARTFLOW_SUPABASE_MODE: "local-qa",
        VITE_SUPABASE_URL: "http://127.0.0.1:54321",
      }),
    ).toThrow(/VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY/);
  });

  it.each([
    ["malformed URL", "not-a-url"],
    ["non-loopback URL", "https://taqxwnlwllbywaklwyno.supabase.co"],
    ["deceptive localhost hostname", "http://localhost.example.com:54321"],
    ["embedded username", "http://user@127.0.0.1:54321"],
    ["embedded password", "http://user:password@127.0.0.1:54321"],
    ["path-bearing URL", "http://127.0.0.1:54321/rest/v1"],
    ["query-bearing URL", "http://127.0.0.1:54321?key=value"],
    ["hash-bearing URL", "http://127.0.0.1:54321#fragment"],
  ])("rejects %s", (_label, url) => {
    expect(() =>
      resolveSupabaseClientConfig({
        VITE_SMARTFLOW_SUPABASE_MODE: "local-qa",
        VITE_SUPABASE_URL: url,
        VITE_SUPABASE_ANON_KEY: "local-anon-key",
      }),
    ).toThrow(/loopback/);
  });

  it("rejects unsupported modes", () => {
    expect(() =>
      resolveSupabaseClientConfig({
        VITE_SMARTFLOW_SUPABASE_MODE: "staging",
      }),
    ).toThrow(/Unsupported Supabase runtime mode/);
  });

  it("does not fall back to production after a local QA validation error", () => {
    expect(() =>
      resolveSupabaseClientConfig({
        VITE_SMARTFLOW_SUPABASE_MODE: "local-qa",
        VITE_SUPABASE_URL: "https://taqxwnlwllbywaklwyno.supabase.co",
        VITE_SUPABASE_ANON_KEY: "local-anon-key",
      }),
    ).toThrow(/loopback/);
  });
});
