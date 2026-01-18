import type { LearnAIMode, LearnAILanguage } from "./types";
import { buildAgentUrl, isConfigured } from "@/config/aiAgent";
import { formatErrorForUser } from "./errorMessages";

type AskInput = {
  message: string;
  mode: LearnAIMode;
  language: LearnAILanguage;
};

export type AIResult = {
  answer: string;
  requestId?: string;
  cached?: boolean;
};

export type AIError = {
  title: string;
  message: string;
  action?: string;
  canRetry: boolean;
  debug?: string;
};

type AIAgentErrorCode =
  | "AI_AGENT_NOT_CONFIGURED"
  | "AI_AGENT_REQUEST_FAILED"
  | "AI_AGENT_BAD_RESPONSE"
  | "AI_AGENT_TIMEOUT"
  | "AI_AGENT_QUOTA_EXCEEDED";

class AIAgentError extends Error {
  code: AIAgentErrorCode;
  debug?: string;

  constructor(code: AIAgentErrorCode, message: string, debug?: string) {
    super(message);
    this.name = "AIAgentError";
    this.code = code;
    this.debug = debug;
  }
}

const logDebug = (message: string, details?: string) => {
  if (!import.meta.env.DEV) return;
  if (details) {
    console.debug(`[LearnAI] ${message}`, details);
  } else {
    console.debug(`[LearnAI] ${message}`);
  }
};

export async function askLearnAI(input: AskInput): Promise<{ answer: string }> {
  const useProxy = import.meta.env.DEV;
  if (!isConfigured() && !useProxy) {
    logDebug("AI agent not configured", "Missing VITE_AI_AGENT_URL");
    throw new AIAgentError(
      "AI_AGENT_NOT_CONFIGURED",
      "AI endpoint not configured. Set VITE_AI_AGENT_URL=https://api.barakzai.cloud (or http://localhost:8000 for local)."
    );
  }

  const url = useProxy ? "/__ai/analyze" : buildAgentUrl("/analyze");
  const controller = new AbortController();
  const timeoutMs = 20_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  // Generate request ID for tracking
  const requestId = crypto.randomUUID();
  logDebug(`Request ID: ${requestId}`, `message="${input.message.substring(0, 50)}..."`);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,  // Send request ID to backend
      },
      signal: controller.signal,
      body: JSON.stringify({
        message: input.message,
        language: input.language,
        mode: input.mode,
      }),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      logDebug("AI request timed out", `timeout=${timeoutMs}ms url=${url} requestId=${requestId}`);
      throw new AIAgentError(
        "AI_AGENT_TIMEOUT",
        "AI request timed out after 20 seconds.",
        `timeout=${timeoutMs}ms url=${url} requestId=${requestId}`
      );
    }
    const debug = err instanceof Error ? err.message : String(err);
    logDebug("AI request failed", `fetch failed: ${debug}; url=${url} requestId=${requestId}`);
    throw new AIAgentError(
      "AI_AGENT_REQUEST_FAILED",
      "Unable to reach the AI endpoint. Check network or CORS settings.",
      `fetch failed: ${debug}; url=${url} requestId=${requestId}`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      bodyText = "[unable to read response body]";
    }
    // Try to get request ID from response header
    const responseRequestId = response.headers.get("X-Request-ID");
    logDebug(
      "AI bad response",
      `status=${response.status} ${response.statusText}; body=${bodyText} requestId=${responseRequestId || requestId}`
    );
    throw new AIAgentError(
      "AI_AGENT_BAD_RESPONSE",
      `AI endpoint returned ${response.status}.`,
      `status=${response.status} ${response.statusText}; body=${bodyText} requestId=${responseRequestId || requestId}`
    );
  }
  
  // Log successful response with request ID from backend
  const backendRequestId = response.headers.get("X-Request-ID");
  if (backendRequestId) {
    logDebug(`Response received`, `requestId=${backendRequestId}`);
  }

  type AnalyzeResult = {
    summary?: string;
    steps?: string[];
    example?: string | null;
    pseudocode?: string | null;
    visual?: string | null;
    meta?: {
      type?: string;
      lang?: string;
      mode?: string;
      model?: string;
      cached?: boolean;
      retry_after_seconds?: number | null;
    };
    // Some responses might include answer as plain text.
    answer?: string;
  };

  const parseErrorMessage =
    input.language === "fa"
      ? "پاسخ قابل پردازش نبود. لطفا دوباره تلاش کنید."
      : input.language === "en"
      ? "The response could not be parsed. Please try again."
      : "Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen.";

  function toText(r: AnalyzeResult): string {
    if (typeof r.answer === "string" && r.answer.trim()) return r.answer.trim();

    const parts: string[] = [];
    if (r.summary) parts.push(r.summary.trim());

    if (Array.isArray(r.steps) && r.steps.length) {
      parts.push(
        input.language === "fa"
          ? "گام‌ها:"
          : input.language === "en"
          ? "Steps:"
          : "Schritte:"
      );
      r.steps.forEach((s, i) => parts.push(`${i + 1}. ${String(s).trim()}`));
    }

    if (r.example) {
      parts.push(
        input.language === "fa"
          ? "مثال:"
          : input.language === "en"
          ? "Example:"
          : "Beispiel:"
      );
      parts.push(String(r.example).trim());
    }

    if (r.pseudocode) {
      parts.push(input.language === "fa" ? "شبه‌کد:" : "Pseudocode:");
      parts.push(String(r.pseudocode).trim());
    }

    if (r.visual) {
      parts.push(input.language === "fa" ? "نمایش:" : "Visual:");
      parts.push(String(r.visual).trim());
    }

    const out = parts.join("\n").trim();
    return out || "No response from AI.";
  }

  let data: AnalyzeResult = {};
  try {
    data = (await response.json()) as AnalyzeResult;
  } catch (err) {
    const debug = err instanceof Error ? err.message : String(err);
    logDebug("AI invalid JSON", `json parse failed: ${debug}`);
    data = { summary: parseErrorMessage };
  }

  // Check for quota error in meta
  if (data.meta?.type === "quota") {
    throw new AIAgentError(
      "AI_AGENT_QUOTA_EXCEEDED",
      "AI quota exceeded",
      `retry_after=${data.meta.retry_after_seconds}s`
    );
  }

  return {
    answer: toText(data),
    requestId: backendRequestId || undefined,
    cached: data.meta?.cached,
  };
}

export function formatError(error: unknown, language: LearnAILanguage): AIError {
  const formatted = formatErrorForUser(error, language);
  const debug = error instanceof Error ? (error as any).debug : undefined;

  return {
    ...formatted,
    debug,
  };
}
