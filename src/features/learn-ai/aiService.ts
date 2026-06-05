import type { LearnAILanguage } from "./types";
import { formatErrorForUser } from "./errorMessages";

const ANALYZE_URL = "https://api.barakzai.cloud/analyze";

type HistoryItem = { role: "user" | "assistant"; content: string };

type AskInput = {
  message: string;
  history: HistoryItem[];
  mode?: string;
  language?: string;
  memoryContext?: string;
};

export type AIResult = { answer: string };

export type AIError = {
  title: string;
  message: string;
  action?: string;
  canRetry: boolean;
  debug?: string;
};

export async function askLearnAI(input: AskInput): Promise<AIResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  let response: Response;
  try {
    response = await fetch(ANALYZE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        message: input.message,
        history: input.history,
        mode: input.mode,
        language: input.language,
        memoryContext: input.memoryContext,
      }),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("AI request timed out after 20 seconds.");
    }
    throw new Error("Unable to reach the AI endpoint.");
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const suffix = detail ? " " + detail : "";
    throw new Error(`AI endpoint returned ${response.status}.${suffix}`);
  }

  const data = (await response.json()) as { answer?: string };
  const answer =
    typeof data.answer === "string" && data.answer.trim()
      ? data.answer.trim()
      : "No response from AI.";

  return { answer };
}

export function formatError(error: unknown, language: LearnAILanguage): AIError {
  const formatted = formatErrorForUser(error, language);
  const debug = error instanceof Error
    ? (error as { debug?: string }).debug
    : undefined;
  return { ...formatted, debug };
}
