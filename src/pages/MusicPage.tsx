import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, Upload, Trash2, Music2, ChevronDown, ChevronUp,
  Play, Pause, AlertTriangle, Plus, ArrowLeft, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useMusicPlayer,
  parseVideoId,
  loadHistory,
  addToHistory,
  PRESETS,
  type HistoryEntry,
} from "@/hooks/useMusicPlayer";
import { loadPlaylists, savePlaylists, type Playlist, type PlaylistVideo } from "@/hooks/usePlaylists";
import { usePlaylistPlayer } from "@/contexts/PlaylistPlayerContext";
import { PlaylistsTab } from "@/components/music/PlaylistsTab";
import { PomodoroTimer } from "@/components/music/PomodoroTimer";

// ─── Search types ─────────────────────────────────────────────────────────────

interface InvidiousVideo {
  type: string;
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  videoThumbnails: Array<{ quality: string; url: string }>;
}

const SEARCH_API = "https://api.barakzai.cloud/search";

async function searchInvidious(query: string): Promise<InvidiousVideo[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(
      `${SEARCH_API}?q=${encodeURIComponent(query)}`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    const data = (await res.json()) as { results?: InvidiousVideo[]; error?: string };
    if (data.error) throw new Error(data.error);
    return data.results ?? [];
  } catch {
    clearTimeout(timeoutId);
    throw new Error("Search unavailable");
  }
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function makePlaylistVideo(video: InvidiousVideo): PlaylistVideo {
  return {
    videoId: video.videoId,
    title: video.title,
    thumbnail: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
    duration: formatDuration(video.lengthSeconds),
    addedAt: new Date().toISOString().split("T")[0],
  };
}

// ─── YouTube helpers ──────────────────────────────────────────────────────────

async function fetchYouTubeInfo(videoId: string): Promise<{ title: string; embeddable: boolean }> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (!res.ok) return { title: `Video ${videoId}`, embeddable: false };
    const data = (await res.json()) as { title?: string };
    const title = typeof data.title === "string" && data.title ? data.title : `Video ${videoId}`;
    return { title, embeddable: true };
  } catch {
    return { title: `Video ${videoId}`, embeddable: true };
  }
}

function isYouTubeEmbedError(data: unknown): boolean {
  if (data === null || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.event !== "onError") return false;
  const code = d.info;
  return code === 101 || code === 150 || code === 100;
}

function isYouTubeEnded(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return d.event === "onStateChange" && d.info === 0;
}

// ─── Search skeleton ──────────────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg bg-slate-800 overflow-hidden animate-pulse">
          <div className="aspect-video bg-slate-700" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-slate-700 rounded w-4/5" />
            <div className="h-3 bg-slate-700 rounded w-3/5" />
            <div className="h-2 bg-slate-700 rounded w-1/3 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Playlist dropdown (shared between VideoCard and player view) ──────────────

interface PlaylistDropdownProps {
  playlists: readonly Playlist[];
  onSelect: (playlistId: string | "new") => void;
  onClose: () => void;
  anchor?: "bottom" | "top";
}

function PlaylistDropdownMenu({ playlists, onSelect, onClose, anchor = "bottom" }: Readonly<PlaylistDropdownProps>) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          "absolute right-0 w-52 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden",
          anchor === "bottom" ? "top-full mt-1" : "bottom-full mb-1",
        )}
      >
        {playlists.length > 0 && (
          <>
            {playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2 truncate"
                onClick={() => { onSelect(pl.id); onClose(); }}
              >
                <span className="text-slate-400 flex-shrink-0">📋</span>
                <span className="truncate">{pl.name}</span>
              </button>
            ))}
            <div className="border-t border-slate-700/60" />
          </>
        )}
        <button
          type="button"
          className="w-full text-left px-3 py-2 text-sm text-cyan-400 hover:bg-slate-800 flex items-center gap-1.5"
          onClick={() => { onSelect("new"); onClose(); }}
        >
          <Plus className="h-3.5 w-3.5 flex-shrink-0" />
          Create new playlist
        </button>
      </div>
    </>
  );
}

// ─── Video card ───────────────────────────────────────────────────────────────

interface VideoCardProps {
  video: InvidiousVideo;
  isActive: boolean;
  isPlaying: boolean;
  playlists: readonly Playlist[];
  onPlay: () => void;
  onAddToPlaylist: (playlistId: string | "new") => void;
}

function VideoCard({ video, isActive, isPlaying, playlists, onPlay, onAddToPlaylist }: Readonly<VideoCardProps>) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-lg flex flex-col border transition-colors",
        isActive
          ? "border-cyan-500/40 bg-cyan-500/5"
          : "border-slate-700 bg-slate-800 hover:border-slate-600",
      )}
    >
      <div className="relative aspect-video flex-shrink-0 overflow-hidden rounded-t-lg">
        <img
          src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {video.lengthSeconds > 0 && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-mono px-1 rounded leading-4">
            {formatDuration(video.lengthSeconds)}
          </span>
        )}
        {isActive && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            {isPlaying
              ? <Pause className="h-8 w-8 text-white drop-shadow" />
              : <Play className="h-8 w-8 text-white drop-shadow ml-1" />}
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-xs font-medium text-slate-100 line-clamp-2 leading-snug">{video.title}</p>
        <p className="text-[11px] text-slate-400 truncate">{video.author}</p>
        <div className="flex gap-1.5 mt-auto pt-1">
          <Button
            size="sm"
            className={cn(
              "flex-1 gap-1 h-7 text-xs",
              isActive && "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30",
            )}
            onClick={onPlay}
          >
            {isActive && isPlaying
              ? <><Pause className="h-3 w-3" /> Pause</>
              : <><Play className="h-3 w-3" /> Play</>}
          </Button>
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-slate-400 hover:text-white flex-shrink-0"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Add to playlist"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            {dropdownOpen && (
              <PlaylistDropdownMenu
                playlists={playlists}
                onSelect={onAddToPlaylist}
                onClose={() => setDropdownOpen(false)}
                anchor="top"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create playlist modal ────────────────────────────────────────────────────

interface CreatePlaylistModalProps {
  videoTitle: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

function CreatePlaylistModal({ videoTitle, onConfirm, onCancel }: Readonly<CreatePlaylistModalProps>) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-80 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-slate-100">New Playlist</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-52" title={videoTitle}>
              Adding: {videoTitle}
            </p>
          </div>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onConfirm(name.trim());
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Playlist name…"
          className="bg-slate-800 border-slate-600"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={() => { if (name.trim()) onConfirm(name.trim()); }} disabled={!name.trim()}>
            Create & Add
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── YouTube tab ──────────────────────────────────────────────────────────────

interface YouTubeTabProps {
  playlists: readonly Playlist[];
  onAddToPlaylist: (video: InvidiousVideo, playlistId: string | "new") => void;
  onAddCurrentToPlaylist: (playlistId: string | "new") => void;
  onVideoEnded: () => void;
}

function YouTubeTab({ playlists, onAddToPlaylist, onAddCurrentToPlaylist, onVideoEnded }: Readonly<YouTubeTabProps>) {
  const { currentTrack, isPlaying, playYouTube, pause, resume, stop } = useMusicPlayer();

  const [input, setInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [embedError, setEmbedError] = useState(false);
  const [view, setView] = useState<"browse" | "player">("browse");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InvidiousVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);

  const activeVideoId = currentTrack?.type === "youtube" ? currentTrack.videoId : null;
  const isLocalhost =
    globalThis.location.hostname === "localhost" || globalThis.location.hostname === "127.0.0.1";
  const hasSearchQuery = searchQuery.trim().length > 0;

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      searchInvidious(q)
        .then((res) => {
          if (!cancelled) { setSearchResults(res); setSearchError(null); }
        })
        .catch(() => {
          if (!cancelled) {
            setSearchResults([]);
            setSearchError("Search unavailable. Please paste a YouTube URL directly.");
          }
        })
        .finally(() => { if (!cancelled) setIsSearching(false); });
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQuery]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data =
          typeof event.data === "string" ? (JSON.parse(event.data) as unknown) : event.data;
        if (isYouTubeEmbedError(data)) setEmbedError(true);
        if (isYouTubeEnded(data)) onVideoEnded();
      } catch {
        // ignore malformed messages
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onVideoEnded]);

  const handlePlay = useCallback(
    (videoId: string, title: string) => {
      setUrlError(null);
      setEmbedError(false);
      playYouTube(videoId, title);
      setHistory((prev) => addToHistory({ videoId, title }, prev));
      setView("player");
    },
    [playYouTube],
  );

  const handleSearchPlay = useCallback(
    (video: InvidiousVideo) => {
      if (activeVideoId === video.videoId) {
        if (isPlaying) { pause(); } else { resume(); }
        setView("player");
        return;
      }
      handlePlay(video.videoId, video.title);
    },
    [activeVideoId, isPlaying, pause, resume, handlePlay],
  );

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const vid = parseVideoId(trimmed);
    if (!vid) {
      setUrlError("Could not find a YouTube video ID in that URL. Try pasting the full URL.");
      return;
    }
    setIsLoadingTitle(true);
    fetchYouTubeInfo(vid)
      .then(({ title, embeddable }) => {
        setIsLoadingTitle(false);
        setInput("");
        handlePlay(vid, title);
        if (!embeddable) setEmbedError(true);
      })
      .catch(() => setIsLoadingTitle(false));
  };

  const embedSrc =
    activeVideoId && !embedError
      ? `https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`
      : null;

  return (
    <div className="space-y-5">
      {isLocalhost && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <span className="text-blue-400 flex-shrink-0 text-base leading-none mt-0.5" aria-hidden="true">ℹ</span>
          <p className="text-sm text-blue-200">
            YouTube playback works on <strong>barakzai.cloud</strong>. On localhost, use the{" "}
            <strong>My Music</strong> tab to upload local files.
          </p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); if (view === "player") setView("browse"); }}
          placeholder="Search for music, artists, playlists…"
          className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {/* ── Player view ────────────────────────────────────────────────────── */}
      {view === "player" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setView("browse")}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to browse
          </button>

          {embedError && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-200 font-medium">Video cannot be embedded</p>
                <p className="text-xs text-amber-300/70 mt-0.5">
                  The video owner has disabled playback on external sites.
                </p>
                {activeVideoId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${activeVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-200 underline mt-1 inline-block"
                  >
                    Watch on YouTube ↗
                  </a>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-amber-400 hover:text-amber-200 flex-shrink-0"
                onClick={() => { stop(); setEmbedError(false); setView("browse"); }}
              >
                Dismiss
              </Button>
            </div>
          )}

          {embedSrc && (
            <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg">
              <div className="relative w-full aspect-video">
                <iframe
                  key={activeVideoId}
                  src={embedSrc}
                  title="YouTube player"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Add to playlist while playing */}
          {activeVideoId && !embedError && (
            <div className="relative inline-block">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-slate-700 text-slate-300 hover:text-white"
                onClick={() => setPlayerDropdownOpen((v) => !v)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add to Playlist
              </Button>
              {playerDropdownOpen && (
                <PlaylistDropdownMenu
                  playlists={playlists}
                  onSelect={onAddCurrentToPlaylist}
                  onClose={() => setPlayerDropdownOpen(false)}
                  anchor="bottom"
                />
              )}
            </div>
          )}

          {activeVideoId && !embedSrc && !embedError && (
            <Button variant="outline" size="sm" onClick={isPlaying ? pause : resume} className="gap-2">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? "Pause" : "Resume"}
            </Button>
          )}
        </div>
      )}

      {/* ── Browse / search results ────────────────────────────────────────── */}
      {view === "browse" && (
        <div className="space-y-4">
          {isSearching && <SearchSkeleton />}

          {!isSearching && searchError && (
            <p className="text-sm text-amber-400 text-center py-3">{searchError}</p>
          )}

          {!isSearching && !searchError && hasSearchQuery && searchResults.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No results found.</p>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {searchResults.map((video) => (
                <VideoCard
                  key={video.videoId}
                  video={video}
                  isActive={activeVideoId === video.videoId}
                  isPlaying={isPlaying}
                  playlists={playlists}
                  onPlay={() => handleSearchPlay(video)}
                  onAddToPlaylist={(plId) => onAddToPlaylist(video, plId)}
                />
              ))}
            </div>
          )}

          {!hasSearchQuery && (
            <>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <Button
                      key={p.videoId}
                      variant={activeVideoId === p.videoId ? "default" : "secondary"}
                      size="sm"
                      className={cn(
                        "gap-1.5",
                        activeVideoId === p.videoId &&
                          "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
                      )}
                      onClick={() => handlePlay(p.videoId, p.title)}
                    >
                      {activeVideoId === p.videoId && isPlaying
                        ? <Pause className="h-3 w-3" />
                        : <Play className="h-3 w-3 ml-0.5" />}
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              {history.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Recent</p>
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-slate-300"
                      onClick={() => {
                        setHistory([]);
                        localStorage.removeItem("dailyflow:v1:youtube-history");
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((h) => (
                      <button
                        key={h.videoId}
                        type="button"
                        onClick={() => handlePlay(h.videoId, h.title)}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm transition-colors",
                          activeVideoId === h.videoId
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-500/40 hover:text-white",
                        )}
                      >
                        {h.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Always visible: URL input + presets when search active ────────── */}
      <div className="border-t border-slate-700/60 pt-5 space-y-5">
        <div>
          <p className="text-xs text-slate-500 mb-2">Or paste a YouTube URL directly</p>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => { setInput(e.target.value); setUrlError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="https://youtube.com/watch?v=…"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              disabled={isLoadingTitle}
            />
            <Button onClick={handleSubmit} disabled={!input.trim() || isLoadingTitle}>
              {isLoadingTitle ? "Loading…" : "Play"}
            </Button>
          </div>
          {urlError && <p className="text-sm text-destructive mt-1.5">{urlError}</p>}
          <p className="text-xs text-slate-500 mt-2">
            Tip: Not all YouTube videos allow embedding. Try a preset or a different video.
          </p>
        </div>

        {hasSearchQuery && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Quick Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.videoId}
                  variant={activeVideoId === p.videoId ? "default" : "secondary"}
                  size="sm"
                  className={cn(
                    "gap-1.5",
                    activeVideoId === p.videoId &&
                      "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
                  )}
                  onClick={() => handlePlay(p.videoId, p.title)}
                >
                  {activeVideoId === p.videoId && isPlaying
                    ? <Pause className="h-3 w-3" />
                    : <Play className="h-3 w-3 ml-0.5" />}
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Local files tab ──────────────────────────────────────────────────────────

function LocalTab() {
  const { localTracks, currentTrack, isPlaying, playLocal, pause, resume, removeLocalTrack, addLocalTracks } =
    useMusicPlayer();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      addLocalTracks(Array.from(files));
    },
    [addLocalTracks],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const activeId = currentTrack?.type === "local" ? currentTrack.id : null;

  return (
    <div className="space-y-4">
      <label
        htmlFor="local-file-input"
        className={cn(
          "block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-cyan-400 bg-cyan-500/10"
            : "border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/40",
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-300 font-medium">Drop audio files here or click to browse</p>
        <p className="text-xs text-slate-500 mt-1">MP3, WAV, OGG, M4A, FLAC</p>
        <input
          id="local-file-input"
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.ogg,.m4a,.flac,audio/*"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {localTracks.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-4">No tracks yet — upload some music above.</p>
      ) : (
        <div className="space-y-1">
          {localTracks.map((track, idx) => {
            const isActive = track.id === activeId;
            return (
              <div
                key={track.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
                  isActive ? "bg-cyan-500/10 border border-cyan-500/30" : "hover:bg-slate-800",
                )}
              >
                <span className="text-xs text-slate-500 w-5 text-right flex-shrink-0">
                  {isActive ? (
                    <Music2 className={cn("h-3.5 w-3.5", isPlaying ? "text-cyan-400 animate-pulse" : "text-slate-400")} />
                  ) : (
                    idx + 1
                  )}
                </span>
                <button
                  type="button"
                  className="flex-1 text-left min-w-0"
                  onClick={() => {
                    if (isActive) { if (isPlaying) { pause(); } else { resume(); } }
                    else { playLocal(track); }
                  }}
                >
                  <p className={cn("text-sm font-medium truncate", isActive ? "text-cyan-300" : "text-slate-200")}>
                    {track.name}
                  </p>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${track.name}`}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 transition-all"
                  onClick={() => removeLocalTrack(track.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Collapsible Pomodoro panel ───────────────────────────────────────────────

function CollapsiblePomodoro() {
  const [open, setOpen] = useState(true);
  return (
    <div className="w-full lg:w-72 flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-sm font-medium text-slate-300 hover:text-white mb-2 px-1"
      >
        <span>Pomodoro Timer</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <PomodoroTimer />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MusicPage() {
  const { playYouTube, currentTrack, isPlaying } = useMusicPlayer();
  const { isShuffled, setPlaylistLabel } = usePlaylistPlayer();

  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadPlaylists());
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [playlistIdx, setPlaylistIdx] = useState(0);
  const [createForVideo, setCreateForVideo] = useState<InvidiousVideo | null>(null);

  // Refs keep fresh values inside stable callbacks
  const activePlaylistRef = useRef<Playlist | null>(null);
  const isShuffledRef = useRef(false);
  const shuffleOrderRef = useRef<number[]>([]);

  useEffect(() => { activePlaylistRef.current = activePlaylist; }, [activePlaylist]);
  useEffect(() => { isShuffledRef.current = isShuffled; }, [isShuffled]);

  // When shuffle is toggled (possibly from MiniPlayer), regenerate the order
  useEffect(() => {
    const pl = activePlaylistRef.current;
    if (!pl || pl.videos.length === 0) return;
    if (isShuffled) {
      const order = pl.videos.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      shuffleOrderRef.current = order;
    } else {
      shuffleOrderRef.current = pl.videos.map((_, i) => i);
    }
  }, [isShuffled]);

  const persistPlaylists = useCallback(
    (next: Playlist[]) => {
      setPlaylists(next);
      savePlaylists(next);
      // Keep active playlist in sync if it was updated
      if (activePlaylist) {
        const updated = next.find((p) => p.id === activePlaylist.id);
        setActivePlaylist(updated ?? null);
        if (!updated) setPlaylistLabel(null);
      }
    },
    [activePlaylist, setPlaylistLabel],
  );

  const handlePlayAll = useCallback(
    (playlist: Playlist, startIdx = 0) => {
      if (playlist.videos.length === 0) return;
      const shuffled = isShuffledRef.current;
      const order = playlist.videos.map((_, i) => i);
      if (shuffled) {
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
      }
      shuffleOrderRef.current = order;
      const firstIdx = order[startIdx] ?? 0;
      setActivePlaylist(playlist);
      setPlaylistIdx(firstIdx);
      setPlaylistLabel(playlist.name);
      const video = playlist.videos[firstIdx];
      if (video) playYouTube(video.videoId, video.title);
    },
    [playYouTube, setPlaylistLabel],
  );

  const handleVideoEnded = useCallback(() => {
    const pl = activePlaylistRef.current;
    if (!pl || pl.videos.length === 0) return;
    const order = isShuffledRef.current ? shuffleOrderRef.current : pl.videos.map((_, i) => i);
    setPlaylistIdx((curr) => {
      const pos = order.indexOf(curr);
      const next = pos + 1;
      if (next >= order.length) {
        setActivePlaylist(null);
        setPlaylistLabel(null);
        return 0;
      }
      const nextIdx = order[next];
      const nextVideo = pl.videos[nextIdx];
      if (nextVideo) playYouTube(nextVideo.videoId, nextVideo.title);
      return nextIdx;
    });
  }, [playYouTube, setPlaylistLabel]);

  const handleAddToPlaylist = useCallback(
    (video: InvidiousVideo, playlistId: string | "new") => {
      if (playlistId === "new") {
        setCreateForVideo(video);
        return;
      }
      setPlaylists((prev) => {
        const next = prev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          if (pl.videos.some((v) => v.videoId === video.videoId)) {
            toast(`Already in "${pl.name}"`);
            return pl;
          }
          toast(`Added to "${pl.name}"`);
          return { ...pl, videos: [...pl.videos, makePlaylistVideo(video)] };
        });
        savePlaylists(next);
        return next;
      });
    },
    [],
  );

  const handleAddCurrentToPlaylist = useCallback(
    (playlistId: string | "new") => {
      if (!currentTrack || currentTrack.type !== "youtube") return;
      const fakeVideo: InvidiousVideo = {
        type: "video",
        videoId: currentTrack.videoId,
        title: currentTrack.title,
        author: "",
        lengthSeconds: 0,
        videoThumbnails: [],
      };
      handleAddToPlaylist(fakeVideo, playlistId);
    },
    [currentTrack, handleAddToPlaylist],
  );

  const handleCreateAndAdd = useCallback(
    (name: string) => {
      const video = createForVideo;
      setCreateForVideo(null);
      if (!name.trim() || !video) return;
      const newPlaylist: Playlist = {
        id: crypto.randomUUID(),
        name: name.trim(),
        createdAt: new Date().toISOString().split("T")[0],
        videos: [makePlaylistVideo(video)],
      };
      setPlaylists((prev) => {
        const next = [...prev, newPlaylist];
        savePlaylists(next);
        return next;
      });
      toast(`Created "${newPlaylist.name}" and added video`);
    },
    [createForVideo],
  );

  const activeVideoId = currentTrack?.type === "youtube" ? currentTrack.videoId : null;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto pb-28">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-semibold mb-1">Music</h1>
        <p className="text-muted-foreground">YouTube player, playlists &amp; your own audio files</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row gap-6"
      >
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="youtube">
            <TabsList className="mb-5">
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              <TabsTrigger value="local">My Music</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
            </TabsList>
            <TabsContent value="youtube">
              <YouTubeTab
                playlists={playlists}
                onAddToPlaylist={handleAddToPlaylist}
                onAddCurrentToPlaylist={handleAddCurrentToPlaylist}
                onVideoEnded={handleVideoEnded}
              />
            </TabsContent>
            <TabsContent value="local">
              <LocalTab />
            </TabsContent>
            <TabsContent value="playlists">
              <PlaylistsTab
                playlists={playlists}
                activePlaylistId={activePlaylist?.id ?? null}
                activeVideoId={activeVideoId}
                isPlaying={isPlaying}
                onPlayAll={handlePlayAll}
                onUpdatePlaylists={persistPlaylists}
              />
            </TabsContent>
          </Tabs>
        </div>

        <CollapsiblePomodoro />
      </motion.div>

      {createForVideo && (
        <CreatePlaylistModal
          videoTitle={createForVideo.title}
          onConfirm={handleCreateAndAdd}
          onCancel={() => setCreateForVideo(null)}
        />
      )}
    </div>
  );
}
