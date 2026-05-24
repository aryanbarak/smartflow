import { createContext, useContext } from "react";
import { safeGet, safeSet, storageKey } from "@/lib/storage";

// ─── Track types ───────────────────────────────────────────────────────────────

export interface YouTubeTrack {
  type: "youtube";
  videoId: string;
  title: string;
}

export interface LocalTrack {
  type: "local";
  id: string;
  name: string;
  objectUrl: string;
}

export type ActiveTrack = YouTubeTrack | LocalTrack;

// ─── YouTube history ────────────────────────────────────────────────────────────

export interface HistoryEntry {
  videoId: string;
  title: string;
}

export const YOUTUBE_HISTORY_KEY = storageKey("youtube-history");
export const VOLUME_KEY = storageKey("music-volume");

export const PRESETS = [
  { label: "Lofi", videoId: "jfKfPfyJRdk", title: "Lo-fi Hip Hop" },
  { label: "Rain", videoId: "q76bMs-NwRk", title: "Rain Sounds" },
  { label: "Piano", videoId: "4oStw0r33so", title: "Peaceful Piano Radio" },
  { label: "Deep Focus", videoId: "WPni755-Krg", title: "Deep Focus" },
] as const;

/** Extract an 11-char YouTube video ID from a URL, embed URL, or bare ID. */
export function parseVideoId(input: string): string | null {
  const cleaned = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) return cleaned;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = p.exec(cleaned);
    if (m) return m[1];
  }
  return null;
}

// ─── Persistence helpers ────────────────────────────────────────────────────────

export function loadVolume(): number {
  return safeGet<number>(VOLUME_KEY, 80);
}

export function persistVolume(v: number) {
  safeSet(VOLUME_KEY, v);
}

export function loadHistory(): HistoryEntry[] {
  return safeGet<HistoryEntry[]>(YOUTUBE_HISTORY_KEY, []);
}

export function addToHistory(entry: HistoryEntry, current: HistoryEntry[]): HistoryEntry[] {
  const deduped = current.filter((h) => h.videoId !== entry.videoId);
  const next = [entry, ...deduped].slice(0, 10);
  safeSet(YOUTUBE_HISTORY_KEY, next);
  return next;
}

// ─── Context ────────────────────────────────────────────────────────────────────

export interface MusicPlayerState {
  currentTrack: ActiveTrack | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  localTracks: LocalTrack[];
  playYouTube: (videoId: string, title?: string) => void;
  playLocal: (track: LocalTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
  seek: (seconds: number) => void;
  playNext: () => void;
  playPrev: () => void;
  addLocalTracks: (files: File[]) => void;
  removeLocalTrack: (id: string) => void;
}

const noop = () => undefined;

export const MusicPlayerContext = createContext<MusicPlayerState>({
  currentTrack: null,
  isPlaying: false,
  volume: 80,
  currentTime: 0,
  duration: 0,
  localTracks: [],
  playYouTube: noop,
  playLocal: noop,
  pause: noop,
  resume: noop,
  stop: noop,
  setVolume: noop,
  seek: noop,
  playNext: noop,
  playPrev: noop,
  addLocalTracks: noop,
  removeLocalTrack: noop,
});

export function useMusicPlayer(): MusicPlayerState {
  return useContext(MusicPlayerContext);
}
