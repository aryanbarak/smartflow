import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Upload, Trash2, Music2, ChevronDown, ChevronUp, Play, Pause, AlertTriangle } from "lucide-react";
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

// ─── YouTube helpers ──────────────────────────────────────────────────────────

async function fetchYouTubeInfo(videoId: string): Promise<{ title: string; embeddable: boolean }> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return { title: `Video ${videoId}`, embeddable: false };
    const data = (await res.json()) as { title?: string };
    const title = typeof data.title === "string" && data.title ? data.title : `Video ${videoId}`;
    return { title, embeddable: true };
  } catch {
    // Network error — let the iframe try; postMessage listener will catch errors
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

// ─── YouTube tab ──────────────────────────────────────────────────────────────

function YouTubeTab() {
  const { currentTrack, isPlaying, playYouTube, pause, resume, stop } = useMusicPlayer();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [error, setError] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState(false);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);

  const activeVideoId = currentTrack?.type === "youtube" ? currentTrack.videoId : null;
  const isLocalhost = typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  // Listen for YouTube postMessage errors (embedding not allowed)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data =
          typeof event.data === "string"
            ? (JSON.parse(event.data) as unknown)
            : event.data;
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
      setError(null);
      setEmbedError(false);
      playYouTube(videoId, title);
      setHistory((prev) => addToHistory({ videoId, title }, prev));
      setInput("");
    },
    [playYouTube],
  );

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const vid = parseVideoId(trimmed);
    if (!vid) {
      setError("Could not find a YouTube video ID in that URL. Try pasting the full URL.");
      return;
    }
    setIsLoadingTitle(true);
    fetchYouTubeInfo(vid).then(({ title, embeddable }) => {
      setIsLoadingTitle(false);
      handlePlay(vid, title);
      if (!embeddable) setEmbedError(true);
    }).catch(() => { setIsLoadingTitle(false); });
  };

  const embedSrc = activeVideoId && !embedError
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

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="Paste a YouTube URL or video ID…"
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            disabled={isLoadingTitle}
          />
        </div>
        <Button onClick={handleSubmit} disabled={!input.trim() || isLoadingTitle}>
          {isLoadingTitle ? "Loading…" : "Play"}
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        Tip: Not all YouTube videos allow embedding. Use the presets above or try a different video.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Presets */}
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
                activeVideoId === p.videoId && "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
              )}
              onClick={() => handlePlay(p.videoId, p.title)}
            >
              {activeVideoId === p.videoId && isPlaying ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3 ml-0.5" />
              )}
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* History chips */}
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

      {/* Embed error banner */}
      {embedError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-200 font-medium">Video cannot be embedded</p>
            <p className="text-xs text-amber-300/70 mt-0.5">
              The video owner has disabled playback on external sites. Try a different URL or use a preset.
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
            onClick={() => { stop(); setEmbedError(false); }}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Visible YouTube embed */}
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

      {/* Resume control when paused and no embed visible */}
      {activeVideoId && currentTrack?.type === "youtube" && !embedSrc && !embedError && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={isPlaying ? pause : resume} className="gap-2">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Pause" : "Resume"}
          </Button>
        </div>
      )}
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
