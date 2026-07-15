import type {
  AgentIntentProposal,
  AgentLlmReasoningCaller,
  AgentLlmReasoningRequest,
} from "./reasoningTypes";

export type AgentReasoningParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

export interface AgentReasoningServiceOptions {
  endpoint?: string;
  accessToken?: string;
  fetcher?: typeof fetch;
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? "";
}

export function parseLlmIntentJson(rawText: string): AgentReasoningParseResult {
  const json = extractJson(rawText);
  if (!json) return { ok: false, error: "No JSON object found." };

  try {
    return { ok: true, value: JSON.parse(json) };
  } catch {
    return { ok: false, error: "Malformed JSON." };
  }
}

export function createLlmReasoningCaller(
  options: AgentReasoningServiceOptions,
): AgentLlmReasoningCaller {
  return async (request: AgentLlmReasoningRequest) => {
    if (!options.endpoint) {
      return { rawText: "" };
    }

    const fetcher = options.fetcher ?? globalThis.fetch;
    const response = await fetcher(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      },
      body: JSON.stringify({
        message: request.prompt,
        session_id: request.sessionId ?? "flow-ai-reasoning",
        responseLanguage: request.responseLanguage,
      }),
    });

    if (!response.ok) {
      return { rawText: "" };
    }

    const data = (await response.json()) as { reply?: unknown; intent?: unknown };
    if (typeof data.intent === "object" && data.intent) {
      return { rawText: JSON.stringify(data.intent) };
    }
    return { rawText: typeof data.reply === "string" ? data.reply : "" };
  };
}

export function isPartialIntentProposal(value: unknown): value is Partial<AgentIntentProposal> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
