import { safeGet, safeSet, storageKey } from "@/lib/storage";

export interface PlaylistVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: string;
  addedAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: string;
  videos: PlaylistVideo[];
}

const PLAYLISTS_KEY = storageKey("playlists");

export function loadPlaylists(): Playlist[] {
  return safeGet<Playlist[]>(PLAYLISTS_KEY, []);
}

export function savePlaylists(playlists: Playlist[]): void {
  safeSet(PLAYLISTS_KEY, playlists);
}
