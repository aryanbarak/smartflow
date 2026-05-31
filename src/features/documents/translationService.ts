const BASE_URL = (import.meta.env.VITE_AI_AGENT_URL as string | undefined)
  ?? 'https://api.barakzai.cloud/analyze';

const TRANSLATE_URL = BASE_URL.replace('/analyze', '/translate');

export type TranslateLang = 'fa' | 'de' | 'en';

export interface TranslationResult {
  translated: string;
  sourceLang?: string;
  charCount: number;
}

export const translationService = {
  async translate(
    text: string,
    targetLang: TranslateLang,
    sourceLang?: TranslateLang
  ): Promise<TranslationResult> {
    if (!text.trim()) throw new Error('No text to translate');
    if (text.length > 50000) throw new Error('Text too long (max 50,000 characters)');

    const response = await fetch(TRANSLATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang, targetLang }),
    });

    if (!response.ok) throw new Error('Translation service error');

    const data = await response.json() as { translated?: string; detected_source?: string; error?: string };
    if (data.error) throw new Error(data.error);

    return {
      translated: data.translated ?? '',
      sourceLang: data.detected_source?.toLowerCase(),
      charCount: text.length,
    };
  },

  async translateDocument(
    extractedText: string,
    targetLang: TranslateLang,
    sourceLang?: TranslateLang
  ): Promise<string> {
    const CHUNK_SIZE = 4000;
    const chunks: string[] = [];
    for (let i = 0; i < extractedText.length; i += CHUNK_SIZE) {
      chunks.push(extractedText.slice(i, i + CHUNK_SIZE));
    }
    const results = await Promise.all(
      chunks.map(chunk => this.translate(chunk, targetLang, sourceLang))
    );
    return results.map(r => r.translated).join('\n');
  },
};
