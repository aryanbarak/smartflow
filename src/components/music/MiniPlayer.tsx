import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SkipBack, SkipForward, Play, Pause, Volume2, X, Shuffle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import { usePlaylistPlayer } from "@/contexts/PlaylistPlayerContext";
import { cn } from "@/lib/utils";

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function postYouTubeCommand(iframe: HTMLIFrameElement | null, func: string) {
  try {
    iframe?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "https://www.youtube.com",
    );
  } catch {
    // Cross-origin command failures are non-fatal; the iframe will be unmounted on source change.
  }
}

export function MiniPlayer() {
  const {
    currentTrack, isPlaying, volume, currentTime, duration,
    pause, resume, stop, setVolume, seek, playNext, playPrev,
  } = useMusicPlayer();

  const location = useLocation();
  const isOnMusicPage = location.pathname === "/music";
  const isYouTube = currentTrack?.type === "youtube";
  const isLocal = currentTrack?.type === "local";
  const ytIframeRef = useRef<HTMLIFrameElement>(null);
  const lastVideoIdRef = useRef<string | null>(null);

  const activeVideoId = isYouTube && currentTrack ? currentTrack.videoId : null;
  const ytSrc = useMemo(() => {
    if (!activeVideoId) return "";
    const origin = typeof window === "undefined" ? "" : `&origin=${encodeURIComponent(window.location.origin)}`;
    return `https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0&enablejsapi=1&modestbranding=1${origin}`;
  }, [activeVideoId]);

  useEffect(() => {
    if (lastVideoIdRef.current && lastVideoIdRef.current !== activeVideoId) {
      postYouTubeCommand(ytIframeRef.current, "stopVideo");
    }
    lastVideoIdRef.current = activeVideoId;
  }, [activeVideoId]);

  useEffect(() => {
    return () => postYouTubeCommand(ytIframeRef.current, "stopVideo");
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== "https://www.youtube.com") return;
      try {
        const data = typeof e.data === "string" ? (JSON.parse(e.data) as unknown) : e.data;
        if (!data || typeof data !== "object") return;
        const payload = data as Record<string, unknown>;
        if (payload.event === "onStateChange" && payload.info === 0) playNext();
      } catch {
        // Ignore non-JSON messages from the iframe.
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [playNext]);

  useEffect(() => {
    if (!activeVideoId) return;
    const timer = setTimeout(() => {
      postYouTubeCommand(ytIframeRef.current, isPlaying ? "playVideo" : "pauseVideo");
    }, 300);
    return () => clearTimeout(timer);
  }, [isPlaying, activeVideoId]);

  const { playlistLabel, isShuffled, toggleShuffle } = usePlaylistPlayer();

  if (!currentTrack) return null;

  const baseLabel = currentTrack.type === "youtube" ? currentTrack.title : currentTrack.name;
  const sourceLabel = currentTrack.type === "youtube" ? "YouTube" : "Local audio";
  const trackLabel = playlistLabel ? `${playlistLabel} - ${baseLabel}` : baseLabel;
  const canSeek = isLocal && duration > 0;

  return (
    <>
      {isYouTube && ytSrc && (
        <iframe
          ref={ytIframeRef}
          src={ytSrc}
          title="YouTube audio"
          allow="autoplay; encrypted-media"
          className="sr-only"
          aria-hidden="true"
        />
      )}

      {/* Bottom bar hidden on /music — the page has its own NowPlayingCard in the sidebar */}
      {!isOnMusicPage && <AnimatePresence>
        <motion.div
          key="mini-player"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 lg:left-64 z-50 bg-slate-900 border-t border-cyan-400/20"
        >
          {canSeek && (
            <div className="flex items-center gap-2 px-4 pt-2">
              <span className="text-xs text-slate-500 w-10 text-right flex-shrink-0">{formatTime(currentTime)}</span>
              <Slider value={[currentTime]} min={0} max={duration} step={0.5} onValueChange={([v]) => seek(v)} className="flex-1" aria-label="Seek position" />
              <span className="text-xs text-slate-500 w-10 flex-shrink-0">{formatTime(duration)}</span>
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {playlistLabel ? (
                <span className="text-xs text-cyan-400 flex-shrink-0" aria-hidden="true">Playlist</span>
              ) : isYouTube ? (
                <span className="text-base leading-none flex-shrink-0" aria-hidden="true">▶</span>
              ) : null}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{trackLabel}</p>
                <p className="text-[11px] text-slate-400 truncate">{sourceLabel}</p>
              </div>
            </div>

            {playlistLabel && (
              <Button variant="ghost" size="icon" className={cn("h-8 w-8 flex-shrink-0", isShuffled ? "text-cyan-400" : "text-slate-500 hover:text-white")}
                onClick={toggleShuffle} aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}>
                <Shuffle className="h-4 w-4" />
              </Button>
            )}

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white" onClick={playPrev} aria-label="Previous"><SkipBack className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/40" onClick={isPlaying ? pause : resume} aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white" onClick={playNext} aria-label="Next"><SkipForward className="h-4 w-4" /></Button>
            </div>

            <div className="hidden sm:flex items-center gap-2 w-28 flex-shrink-0">
              <Volume2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <Slider value={[volume]} min={0} max={100} step={1} onValueChange={([v]) => setVolume(v)} className="w-full" aria-label="Volume" />
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white flex-shrink-0" onClick={stop} aria-label="Stop"><X className="h-4 w-4" /></Button>
          </div>
        </motion.div>
      </AnimatePresence>}
    </>
  );
}
