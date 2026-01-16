const rawAgentUrl = import.meta.env.VITE_AI_AGENT_URL;

export const AI_AGENT_URL =
  typeof rawAgentUrl === "string" && rawAgentUrl.trim()
    ? rawAgentUrl
    : null;

export function isConfigured(): boolean {
  return getAgentBaseUrl() !== null;
}

export function getAgentBaseUrl(): string | null {
  if (!AI_AGENT_URL) return null;
  const trimmed = AI_AGENT_URL.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

export function buildAgentUrl(path: string): string {
  const baseUrl = getAgentBaseUrl();
  if (!baseUrl) {
    throw new Error("AI agent base URL is not configured.");
  }
  const normalizedPath = path.trim().replace(/^\/+/, "");
  return normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl;
}

/*
Verification checklist:
1) npm run dev
2) ensure .env has VITE_AI_AGENT_URL (or rely on dev proxy default)
3) open Learn with AI and send a message
4) confirm network call hits /__ai/analyze in dev
*/
