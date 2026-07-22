import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { translations, type Lang, type TranslationKey } from "@/i18n";
import { GitHubIntegrationView } from "./GitHubIntegrationCard";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: vi.fn() } },
}));

function translator(lang: Lang) {
  return (key: TranslationKey, vars?: Record<string, string | number>) => {
    let value = String(translations[lang][key] ?? translations.en[key] ?? key);
    Object.entries(vars ?? {}).forEach(([name, replacement]) => {
      value = value.replace(`{{${name}}}`, String(replacement));
    });
    return value;
  };
}

function render(state: Parameters<typeof GitHubIntegrationView>[0]["state"], accountLabel?: string, lang: Lang = "en") {
  return renderToStaticMarkup(
    <GitHubIntegrationView
      state={state}
      accountLabel={accountLabel}
      clientAvailable
      t={translator(lang)}
      isRTL={lang === "fa"}
      onConnect={vi.fn()}
      onDisconnect={vi.fn()}
    />,
  );
}

describe("GitHub integration view", () => {
  it.each([
    ["not_connected", "GitHub is not connected", "Connect GitHub"],
    ["connecting", "Opening the secure GitHub connection", "Opening the secure GitHub connection"],
    ["connected", "Connected to smartflow-user", "Disconnect GitHub"],
    ["failed", "could not be loaded", "Connect GitHub"],
    ["not_configured", "not configured yet", "GitHub"],
    ["reconnect_required", "needs to be renewed", "Reconnect GitHub"],
    ["disconnected", "was disconnected", "Connect GitHub"],
  ] as const)("renders bounded %s state copy", (state, expected, action) => {
    const html = render(state, state === "connected" ? "smartflow-user" : undefined);
    expect(html).toContain(expected);
    expect(html).toContain(action);
    expect(html).not.toContain("installation_id");
    expect(html).not.toContain("github_account_id");
    expect(html).not.toContain("access_token");
    expect(html).not.toContain("providerError");
  });

  it("renders natural German copy", () => {
    const html = render("not_connected", undefined, "de");
    expect(html).toContain("GitHub ist nicht verbunden");
    expect(html).toContain("GitHub verbinden");
  });

  it("renders Persian copy with RTL direction and stable action order", () => {
    const html = render("connected", "smartflow-user", "fa");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("گیت‌هاب");
    expect(html).toContain("قطع اتصال گیت‌هاب");
    expect(html.indexOf("گیت‌هاب")).toBeLessThan(html.indexOf("قطع اتصال گیت‌هاب"));
  });
});
