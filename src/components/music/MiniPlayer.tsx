import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SkipBack, SkipForward, Play, Pause, Volume2, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
import { cn } from "@/lib/utils";

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    pause,
    resume,
    stop,
    setVolume,
    seek,
    playNext,
    playPrev,
  } = useMusicPlayer();

  const location = useLocation();
  // When the Music page is open its own visible iframe is already playing;
  // suppress the hidden iframe here to avoid a second audio stream.
  const isOnMusicPage = location.pathname === "/music";
  const isYouTube = currentTrack?.type === "youtube";
  const isLocal = currentTrack?.type === "local";

  const ytSrc =
    isYouTube && currentTrack && isPlaying && !isOnMusicPage
      ? `https://www.youtube.com/embed/${currentTrack.videoId}?autoplay=1&rel=0`
      : "";

  if (!currentTrack) return null;

  const trackLabel = currentTrack.type === "youtube" ? currentTrack.title : currentTrack.name;

  return (
    <>
      {/* Hidden YouTube iframe — keeps audio alive across page navigation */}
      {isYouTube && (
        <iframe
          src={ytSrc}
          title="YouTube audio"
          allow="autoplay; encrypted-media"
          className="sr-only"
          aria-hidden="true"
        />
      )}

      <AnimatePresence>
        <motion.div
          key="mini-player"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 lg:left-64 z-50 bg-slate-900 border-t border-cyan-400/20"
        >
          {/* Seek row — local files only, uses Slider for full keyboard + click support */}
          {isLocal && duration > 0 && (
            <div className="flex items-center gap-2 px-4 pt-2">
              <span className="text-xs text-slate-500 w-10 text-right flex-shrink-0">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                min={0}
                max={duration}
                step={0.5}
                onValueChange={([v]) => seek(v)}
                className="flex-1"
                aria-label="Seek position"
              />
              <span className="text-xs text-slate-500 w-10 flex-shrink-0">
                {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Controls row */}
          <div className="flex items-center gap-3 px-4 py-2">
            {/* Track info */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {isYouTube && <span className="text-base leading-none flex-shrink-0" aria-hidden="true">▶</span>}
              <p className="text-sm font-medium text-white truncate">{trackLabel}</p>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-300 hover:text-white"
                onClick={playPrev}
                aria-label="Previous"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-full text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/40",
                )}
                onClick={isPlaying ? pause : resume}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-300 hover:text-white"
                onClick={playNext}
                aria-label="Next"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume — local files only, hidden on small screens */}
            {isLocal && (
              <div className="hidden sm:flex items-center gap-2 w-28 flex-shrink-0">
                <Volume2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setVolume(v)}
                  className="w-full"
                  aria-label="Volume"
                />
              </div>
            )}

            {/* Stop */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-white flex-shrink-0"
              onClick={stop}
              aria-label="Stop"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
