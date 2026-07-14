import { supabase } from '@/integrations/supabase/client';
import {
  getAiResponseLanguageInstruction,
  withAiResponseLanguageInstruction,
  type SupportedAiResponseLanguage,
} from '@/features/ai/responseLanguage';

const WORKER_URL = (import.meta.env.VITE_AGENT_WORKER_URL as string | undefined) ?? '';

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  wordCount: number;
  language: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function parseJsonResponse(content: string): { summary: string; keyPoints: string[] } {
  try {
    const clean = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as { summary?: string; keyPoints?: string[] };
    return { summary: parsed.summary ?? '', keyPoints: parsed.keyPoints ?? [] };
  } catch {
    return { summary: content.slice(0, 1500), keyPoints: [] };
  }
}

export const documentAiService = {
  async callWorker(
    message: string,
    options?: { text?: string; fileData?: { base64: string; mimeType: string; name: string }; language?: string }
  ): Promise<string> {
    const headers = await getAuthHeaders();
    const responseLanguage = options?.language === 'fa' || options?.language === 'de' || options?.language === 'en'
      ? options.language as SupportedAiResponseLanguage
      : undefined;
    const body: Record<string, unknown> = {
      message: responseLanguage ? withAiResponseLanguageInstruction(message, responseLanguage) : message,
    };
    if (options?.text) body.text = options.text;
    if (options?.fileData) body.fileData = options.fileData;
    if (responseLanguage) {
      body.language = responseLanguage;
      body.responseLanguage = responseLanguage;
      body.responseLanguageInstruction = getAiResponseLanguageInstruction(responseLanguage);
    }

    const response = await fetch(`${WORKER_URL}/documents/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? `Worker error: ${response.status}`);
    }

    const data = await response.json() as { answer?: string };
    return data.answer ?? '';
  },

  async generateSummaryFromText(
    text: string,
    language: 'de' | 'fa' | 'en' = 'en'
  ): Promise<SummaryResult> {
    const langLabel = language === 'de' ? 'German' : language === 'fa' ? 'Persian/Farsi' : 'English';
    const prompt = `Analyze this document and provide:
1. A clear summary in ${langLabel} (3-5 sentences)
2. 5 key points as a JSON array

Respond in this exact JSON format:
{"summary": "...", "keyPoints": ["point1", "point2", "point3", "point4", "point5"], "language": "${language}"}
Return ONLY the JSON. No markdown, no extra text.`;

    const content = await this.callWorker(prompt, { text, language });
    const parsed = parseJsonResponse(content);
    return { ...parsed, wordCount: text.split(/\s+/).length, language };
  },

  async generateSummaryFromPdf(
    blob: Blob,
    fileName: string,
    language: 'de' | 'fa' | 'en' = 'en'
  ): Promise<SummaryResult> {
    const langLabel = language === 'de' ? 'German' : language === 'fa' ? 'Persian/Farsi' : 'English';
    const base64 = await blobToBase64(blob);
    const prompt = `Analyze this PDF document and provide:
1. A clear summary in ${langLabel} (3-5 sentences)
2. 5 key points as a JSON array

Respond in this exact JSON format:
{"summary": "...", "keyPoints": ["point1", "point2", "point3", "point4", "point5"], "language": "${language}"}
Return ONLY the JSON. No markdown, no extra text.`;

    const content = await this.callWorker(prompt, {
      fileData: { base64, mimeType: 'application/pdf', name: fileName },
      language,
    });
    const parsed = parseJsonResponse(content);
    return { ...parsed, wordCount: 0, language };
  },

  async callWithText(text: string, prompt: string, language?: string): Promise<string> {
    return this.callWorker(prompt, { text, language });
  },

  async callWithPdf(blob: Blob, fileName: string, prompt: string, language?: string): Promise<string> {
    const base64 = await blobToBase64(blob);
    return this.callWorker(prompt, {
      fileData: { base64, mimeType: 'application/pdf', name: fileName },
      language,
    });
  },
};
