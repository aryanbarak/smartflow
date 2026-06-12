import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TtsLang = "de" | "fa";

export interface TtsProgress {
  current: number;
  total: number;
  engine: "azure" | "webspeech";
}

const WORKER_BASE =
  (import.meta.env.VITE_AI_AGENT_URL as string | undefined)?.replace("/analyze", "") ??
  "https://api.barakzai.cloud";

const AZURE_LOCALES: Record<TtsLang, string> = { de: "de-DE", fa: "fa-IR" };

// ─── Text chunking ────────────────────────────────────────────────────────────
// Splits at sentence endings; guarantees every chunk ≤ maxLen chars.
function chunkText(text: string, maxLen: number): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return [trimmed];

  const parts = trimmed.split(/(?<=[.!?\n])\s+/).filter((s) => s.trim());
  const chunks: string[] = [];
  let cur = "";

  for (const part of parts) {
    const next = cur ? `${cur} ${part}` : part;
    if (next.length <= maxLen) {
      cur = next;
    } else {
      if (cur) chunks.push(cur.trim());
      // If a single sentence exceeds maxLen, hard-split it
      cur = part.length > maxLen ? part.slice(0, maxLen) : part;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length > 0 ? chunks : [trimmed.slice(0, maxLen)];
}

// ─── Azure fetch (one chunk) ──────────────────────────────────────────────────
async function fetchAzureChunk(
  text: string,
  lang: TtsLang,
  token: string,
): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(`${WORKER_BASE}/tts-azure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

// ─── Audio buffer playback ────────────────────────────────────────────────────
function playBuffer(
  buffer: ArrayBuffer,
  audioRef: React.MutableRefObject<HTMLAudioElement | null>,
): Promise<void> {
  return new Promise((resolve) => {
    const blob = new Blob([buffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    const done = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  });
}

// ─── Web Speech one chunk ─────────────────────────────────────────────────────
function webSpeechChunk(
  text: string,
  lang: TtsLang,
  voiceName: string | undefined,
  rate: number,
  pitch: number,
): Promise<void> {
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = AZURE_LOCALES[lang];
    utter.rate = rate;
    utter.pitch = pitch;
    if (voiceName) {
      const v = globalThis.speechSynthesis.getVoices().find((x) => x.name === voiceName);
      if (v) utter.voice = v;
    }
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    globalThis.speechSynthesis.speak(utter);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface AzureTTSOptions {
  lang: TtsLang;
  rate?: number;
  pitch?: number;
  webSpeechVoiceName?: string;
}

export function useAzureTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<TtsProgress | null>(null);
  const abortRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    abortRef.current = true;
    globalThis.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setProgress(null);
  }, []);

  const play = useCallback(
    async (text: string, opts: AzureTTSOptions) => {
      const { lang, rate = 1, pitch = 1, webSpeechVoiceName } = opts;
      if (!text.trim()) return;

      stop();
      abortRef.current = false;
      setIsPlaying(true);

      // Try to get Supabase session token for Azure
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? null;

      const azureChunkSize = 1500;
      const wsChunkSize = 180;
      const useAzure = token !== null;
      const chunks = chunkText(text, useAzure ? azureChunkSize : wsChunkSize);
      const engine: TtsProgress["engine"] = useAzure ? "azure" : "webspeech";

      for (let i = 0; i < chunks.length; i++) {
        if (abortRef.current) break;
        setProgress({ current: i + 1, total: chunks.length, engine });

        if (useAzure) {
          const buffer = await fetchAzureChunk(chunks[i], lang, token!);
          if (buffer && !abortRef.current) {
            await playBuffer(buffer, audioRef);
          } else if (!buffer && !abortRef.current && "speechSynthesis" in globalThis) {
            // Azure chunk failed — fall back to Web Speech for this chunk
            await webSpeechChunk(chunks[i], lang, webSpeechVoiceName, rate, pitch);
          }
        } else if ("speechSynthesis" in globalThis) {
          await webSpeechChunk(chunks[i], lang, webSpeechVoiceName, rate, pitch);
        }
      }

      if (!abortRef.current) {
        setIsPlaying(false);
        setProgress(null);
      }
    },
    [stop],
  );

  useEffect(() => () => { stop(); }, [stop]);

  return { isPlaying, progress, play, stop };
}
