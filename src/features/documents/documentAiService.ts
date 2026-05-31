import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

const AI_WORKER_URL = import.meta.env.VITE_AI_AGENT_URL || 'https://api.barakzai.cloud/analyze';

export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  wordCount: number;
  language: string;
}

export const documentAiService = {
  async extractTextFromPdf(file: File): Promise<string> {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item): item is TextItem => 'str' in item)
        .map(item => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  },

  async generateSummary(
    text: string,
    language: 'de' | 'fa' | 'en' = 'de',
    customPrompt?: string
  ): Promise<SummaryResult> {
    const langLabel = language === 'de' ? 'German' : language === 'fa' ? 'Persian/Farsi' : 'English';

    const prompt = customPrompt ?? `
Analyze this document and provide:
1. A clear summary in ${langLabel} (3-5 sentences)
2. 5 key points as a JSON array

Document text:
${text.slice(0, 8000)}

Respond in this exact JSON format:
{
  "summary": "...",
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "language": "${language}"
}
Return ONLY the JSON. No markdown, no extra text.
`;

    const response = await fetch(AI_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, mode: 'general_it', language }),
    });

    if (!response.ok) throw new Error('AI service error');

    const data = await response.json() as { response?: string; content?: string };
    const content = data.response ?? data.content ?? '';

    try {
      const clean = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean) as { summary?: string; keyPoints?: string[]; language?: string };
      return {
        summary: parsed.summary ?? '',
        keyPoints: parsed.keyPoints ?? [],
        wordCount: text.split(/\s+/).length,
        language,
      };
    } catch {
      return {
        summary: content.slice(0, 500),
        keyPoints: [],
        wordCount: text.split(/\s+/).length,
        language,
      };
    }
  },

  async saveSummary(documentId: string, result: SummaryResult, extractedText: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({
        summary: result.summary,
        summary_language: result.language,
        summary_generated_at: new Date().toISOString(),
        extracted_text: extractedText.slice(0, 50000),
        word_count: result.wordCount,
        key_points: result.keyPoints,
      } as Record<string, unknown>)
      .eq('id', documentId);

    if (error) throw error;
  },

  async processDocument(
    file: File,
    documentId: string,
    language: 'de' | 'fa' | 'en' = 'de'
  ): Promise<SummaryResult> {
    const text = await this.extractTextFromPdf(file);
    const result = await this.generateSummary(text, language);
    await this.saveSummary(documentId, result, text);
    return result;
  },
};
