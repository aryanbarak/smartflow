import type { LearnAILanguage } from "./types";
import { formatErrorForUser } from "./errorMessages";

const ANALYZE_URL = "https://api.barakzai.cloud/analyze";

type HistoryItem = { role: "user" | "assistant"; content: string };

export type FileData = {
  base64: string;
  mimeType: string;
  name: string;
};

type AskInput = {
  message: string;
  history: HistoryItem[];
  mode?: string;
  language?: string;
  memoryContext?: string;
  fileData?: FileData; // ← new
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
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // longer timeout for files

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
        fileData: input.fileData ?? null, // ← new
      }),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("AI request timed out after 30 seconds.");
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

// Helper: convert File to base64 FileData
export async function fileToFileData(file: File): Promise<FileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:application/pdf;base64,XXXX"
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType: file.type, name: file.name });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}