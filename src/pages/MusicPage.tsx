import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, Upload, Trash2, Music2, ChevronDown, ChevronUp,
  Play, Pause, AlertTriangle, Plus, ArrowLeft,
} from "lucide-react";
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
import { PomodoroTimer } from "@/components/music/PomodoroTimer";

// ─── Invidious search ─────────────────────────────────────────────────────────

interface InvidiousVideo {
  type: string;
  videoId: string;
  title: string;
  author: string;
  lengthSeconds: number;
  videoThumbnails: Array<{ quality: string; url: string }>;
}

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://invidious.privacyredirect.com",
];

async function searchInvidious(query: string): Promise<InvidiousVideo[]> {
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=1`,
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const data = (await res.json()) as InvidiousVideo[];
      return data.filter((v) => v.type === "video");
    } catch {
      // try next instance
    }
  }
  throw new Error("All Invidious instances unavailable");
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
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

// ─── Video card ───────────────────────────────────────────────────────────────

interface VideoCardProps {
  video: InvidiousVideo;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onAdd: () => void;
}

function VideoCard({ video, isActive, isPlaying, onPlay, onAdd }: VideoCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden flex flex-col border transition-colors",
        isActive
          ? "border-cyan-500/40 bg-cyan-500/5"
          : "border-slate-700 bg-slate-800 hover:border-slate-600",
      )}
    >
      <div className="relative aspect-video flex-shrink-0">
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
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-slate-400 hover:text-white flex-shrink-0"
            onClick={onAdd}
            aria-label="Add to playlist"
            title="Save to history"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── YouTube tab ──────────────────────────────────────────────────────────────

function YouTubeTab() {
  const { currentTrack, isPlaying, playYouTube, pause, resume, stop } = useMusicPlayer();

  // URL input state
  const [input, setInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);

  // Player state
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [embedError, setEmbedError] = useState(false);
  const [view, setView] = useState<"browse" | "player">("browse");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InvidiousVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const activeVideoId = currentTrack?.type === "youtube" ? currentTrack.videoId : null;
  const isLocalhost =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const hasSearchQuery = searchQuery.trim().length > 0;

  // Debounced search — cancelled flag prevents stale state updates from slow requests
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
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Listen for YouTube postMessage embed errors
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data =
          typeof event.data === "string" ? (JSON.parse(event.data) as unknown) : event.data;
        if (isYouTubeEmbedError(data)) setEmbedError(true);
      } catch {
        // ignore malformed messages
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

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

  const handleAddToHistory = useCallback((videoId: string, title: string) => {
    setHistory((prev) => addToHistory({ videoId, title }, prev));
  }, []);

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
      {/* Localhost notice */}
      {isLocalhost && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <span className="text-blue-400 flex-shrink-0 text-base leading-none mt-0.5" aria-hidden="true">ℹ</span>
          <p className="text-sm text-blue-200">
            YouTube playback works on <strong>barakzai.cloud</strong>. On localhost, use the{" "}
            <strong>My Music</strong> tab to upload local files.
          </p>
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (view === "player") setView("browse");
          }}
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

          {/* Embed error banner */}
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

          {activeVideoId && !embedSrc && !embedError && (
            <Button variant="outline" size="sm" onClick={isPlaying ? pause : resume} className="gap-2">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? "Pause" : "Resume"}
            </Button>
          )}
        </div>
      )}

      {/* ── Browse / search results view ───────────────────────────────────── */}
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
                  onPlay={() => handleSearchPlay(video)}
                  onAdd={() => handleAddToHistory(video.videoId, video.title)}
                />
              ))}
            </div>
          )}

          {/* Default browse content: presets + history (shown when no search) */}
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

      {/* ── Always visible: URL input + presets (when search results shown) ─── */}
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

        {/* Presets shown when search results are visible (browse shows them already) */}
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

// ─── Local files tab ─────────────────────────────────────────────────────────

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
      {/* Drop zone — <label> naturally opens the file dialog on click */}
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
        <p className="text-sm text-slate-300 font-medium">
          Drop audio files here or click to browse
        </p>
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

      {/* Playlist */}
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
                    if (isActive) {
                      if (isPlaying) { pause(); } else { resume(); }
                    } else {
                      playLocal(track);
                    }
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
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto pb-28">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-semibold mb-1">Music</h1>
        <p className="text-muted-foreground">YouTube player &amp; your own audio files</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row gap-6"
      >
        {/* Main area */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="youtube">
            <TabsList className="mb-5">
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              <TabsTrigger value="local">My Music</TabsTrigger>
            </TabsList>
            <TabsContent value="youtube">
              <YouTubeTab />
            </TabsContent>
            <TabsContent value="local">
              <LocalTab />
            </TabsContent>
          </Tabs>
        </div>

        {/* Pomodoro side panel */}
        <CollapsiblePomodoro />
      </motion.div>
    </div>
  );
}
