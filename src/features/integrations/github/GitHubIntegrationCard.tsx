import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Github, Loader2, Unplug } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useT, type TranslationKey } from "@/i18n";
import {
  createGitHubConnectionClient,
  GitHubConnectionClientError,
  type GitHubConnectionClient,
  type GitHubConnectionStatus,
} from "./githubConnectionClient";

type ViewState =
  | "loading"
  | "not_connected"
  | "connecting"
  | "connected"
  | "failed"
  | "not_configured"
  | "reconnect_required"
  | "disconnecting"
  | "disconnected";

interface GitHubIntegrationCardProps {
  client?: GitHubConnectionClient;
  navigateToProvider?(url: string): void;
}

function defaultClient() {
  try {
    return createGitHubConnectionClient({
      workerBaseUrl: (import.meta.env.VITE_AGENT_WORKER_URL as string | undefined) ?? "",
      async getAccessToken() {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token;
      },
    });
  } catch {
    return undefined;
  }
}

function viewState(status: GitHubConnectionStatus): ViewState {
  if (status.status === "connected") return "connected";
  if (status.status === "reconnect_required") return "reconnect_required";
  return "not_connected";
}

interface GitHubIntegrationViewProps {
  state: ViewState;
  accountLabel?: string;
  clientAvailable: boolean;
  t(key: TranslationKey, vars?: Record<string, string | number>): string;
  isRTL: boolean;
  onConnect(): void;
  onDisconnect(): void;
}

export function GitHubIntegrationView({
  state,
  accountLabel,
  clientAvailable,
  t,
  isRTL,
  onConnect,
  onDisconnect,
}: GitHubIntegrationViewProps) {
  const description = state === "loading"
    ? t("github_loading")
    : state === "not_connected"
      ? `${t("github_not_connected")} ${t("github_ready")}`
      : state === "connecting"
        ? t("github_connecting")
        : state === "connected"
          ? accountLabel ? t("github_connected", { account: accountLabel }) : t("github_connected_generic")
          : state === "reconnect_required"
            ? t("github_reconnect_required")
            : state === "disconnected"
              ? t("github_disconnected")
              : state === "not_configured"
                ? t("github_not_configured")
                : t("github_failed");
  const busy = state === "loading" || state === "connecting" || state === "disconnecting";
  const canDisconnect = state === "connected";
  const canConnect = state === "not_connected" || state === "disconnected" || state === "reconnect_required" || state === "failed";

  return (
    <section dir={isRTL ? "rtl" : "ltr"} className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
            <Github size={21} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{t("github_integration_title")}</h3>
              {state === "connected" && <CheckCircle2 size={15} className="text-emerald-400" aria-hidden="true" />}
              {(state === "failed" || state === "not_configured" || state === "reconnect_required") && (
                <AlertCircle size={15} className="text-amber-400" aria-hidden="true" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t("github_integration_description")}</p>
            <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">{description}</p>
            <p className="mt-1 text-[11px] text-muted-foreground/80">{t("github_read_only")}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin text-muted-foreground" aria-hidden="true" />}
          {canConnect && (
            <button
              type="button"
              onClick={onConnect}
              disabled={!clientAvailable}
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {state === "reconnect_required" ? t("github_reconnect") : t("github_connect")}
            </button>
          )}
          {canDisconnect && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium hover:bg-muted"
                >
                  <Unplug size={14} aria-hidden="true" />
                  {t("github_disconnect")}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("github_disconnect_title")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("github_disconnect_description")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={onDisconnect}>{t("github_disconnect_confirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </section>
  );
}

export function GitHubIntegrationCard({ client: providedClient, navigateToProvider }: GitHubIntegrationCardProps) {
  const { t, isRTL } = useT();
  const client = useMemo(() => providedClient ?? defaultClient(), [providedClient]);
  const [state, setState] = useState<ViewState>("loading");
  const [accountLabel, setAccountLabel] = useState<string>();

  useEffect(() => {
    let active = true;
    if (!client) {
      setState("not_configured");
      return () => { active = false; };
    }
    client.getStatus()
      .then((status) => {
        if (!active) return;
        setAccountLabel("accountLabel" in status ? status.accountLabel : undefined);
        setState(viewState(status));
      })
      .catch((error) => {
        if (!active) return;
        setState(error instanceof GitHubConnectionClientError && error.code === "not_configured" ? "not_configured" : "failed");
      });
    return () => { active = false; };
  }, [client]);

  async function connect() {
    if (!client || state === "connecting") return;
    setState("connecting");
    try {
      const { installationUrl } = await client.startConnection();
      (navigateToProvider ?? ((url: string) => window.location.assign(url)))(installationUrl);
    } catch (error) {
      setState(error instanceof GitHubConnectionClientError && error.code === "not_configured" ? "not_configured" : "failed");
    }
  }

  async function disconnect() {
    if (!client || state === "disconnecting") return;
    setState("disconnecting");
    try {
      await client.disconnect();
      setAccountLabel(undefined);
      setState("disconnected");
    } catch {
      setState("failed");
    }
  }

  return (
    <GitHubIntegrationView
      state={state}
      accountLabel={accountLabel}
      clientAvailable={Boolean(client)}
      t={t}
      isRTL={isRTL}
      onConnect={connect}
      onDisconnect={disconnect}
    />
  );
}
