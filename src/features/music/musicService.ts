export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  color: string;
  tracks: Track[];
}

type PlaylistInput = {
  name: string;
  color: string;
};

const STORAGE_KEY = "dailyflow:music:library";

function normalizeTracks(value: unknown): Track[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title : "";
      const artist = typeof record.artist === "string" ? record.artist : "";
      const duration = typeof record.duration === "string" ? record.duration : "";
      const idValue = record.id;
      if (!title) return null;
      return {
        id: typeof idValue === "string" ? idValue : String(idValue ?? crypto.randomUUID()),
        title,
        artist,
        duration,
      };
    })
    .filter((item): item is Track => !!item);
}

function normalizePlaylist(value: unknown): Playlist | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : crypto.randomUUID();
  const name = typeof record.name === "string" ? record.name : "";
  const color = typeof record.color === "string" ? record.color : "from-slate-500 to-slate-700";
  const tracks = normalizeTracks(record.tracks);
  const trackCount = typeof record.trackCount === "number" ? record.trackCount : tracks.length;
  if (!name) return null;
  return {
    id,
    name,
    color,
    tracks,
    trackCount,
  };
}

export function getLibrary(): Playlist[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizePlaylist)
      .filter((item): item is Playlist => !!item);
  } catch {
    return [];
  }
}

export function saveLibrary(updatedLibrary: Playlist[]) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLibrary));
  } catch {
    // Ignore storage failures.
  }
}

export function createPlaylist(input: PlaylistInput): Playlist {
  return {
    id: crypto.randomUUID(),
    name: input.name,
    color: input.color,
    tracks: [],
    trackCount: 0,
  };
}

export function updatePlaylist(id: string, patch: Partial<Playlist>) {
  const library = getLibrary();
  const next = library.map((playlist) => {
    if (playlist.id !== id) return playlist;
    const tracks = patch.tracks ?? playlist.tracks;
    return {
      ...playlist,
      ...patch,
      tracks,
      trackCount: patch.trackCount ?? tracks.length,
    };
  });
  saveLibrary(next);
  return next;
}

export function removePlaylist(id: string) {
  const library = getLibrary();
  const next = library.filter((playlist) => playlist.id !== id);
  saveLibrary(next);
  return next;
}
