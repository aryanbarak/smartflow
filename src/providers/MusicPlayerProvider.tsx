import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import {
  MusicPlayerContext,
  PRESETS,
  loadVolume,
  persistVolume,
  type ActiveTrack,
  type LocalTrack,
} from "@/hooks/useMusicPlayer";

const AUDIO_FORMATS = /\.(mp3|wav|ogg|m4a|flac)$/i;

function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || AUDIO_FORMATS.test(file.name);
}

function makeLocalTrack(file: File): LocalTrack {
  return {
    type: "local",
    id: crypto.randomUUID(),
    name: file.name.replace(/\.[^.]+$/, ""),
    objectUrl: URL.createObjectURL(file),
  };
}

export function MusicPlayerProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [currentTrack, setCurrentTrack] = useState<ActiveTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // S6754: setter name must match "set" + capitalized value name
  const [volumeLevel, setVolumeLevel] = useState<number>(loadVolume);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [localTracks, setLocalTracks] = useState<LocalTrack[]>([]);

  // Refs keep latest values fresh inside event listeners without re-subscribing
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const currentTrackRef = useRef<ActiveTrack | null>(null);
  const volumeRef = useRef<number>(loadVolume());

  useEffect(() => { localTracksRef.current = localTracks; }, [localTracks]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { volumeRef.current = volumeLevel; }, [volumeLevel]);

  // ─── HTML Audio element ───────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volumeRef.current / 100;
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      const ct = currentTrackRef.current;
      const lt = localTracksRef.current;
      if (ct?.type !== "local") return;
      const idx = lt.findIndex((t) => t.id === ct.id);
      const next = lt[idx + 1];
      if (next) {
        audio.src = next.objectUrl;
        void audio.play();
        setCurrentTrack(next);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const playYouTube = useCallback((videoId: string, title = "YouTube") => {
    audioRef.current?.pause();
    setCurrentTrack({ type: "youtube", videoId, title });
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const playLocal = useCallback((track: LocalTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTrack(track);
    audio.src = track.objectUrl;
    audio.volume = volumeRef.current / 100;
    void audio.play();
  }, []);

  const pause = useCallback(() => {
    if (currentTrackRef.current?.type === "local") audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (currentTrackRef.current?.type === "local") void audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ""; }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeLevel(v);
    persistVolume(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
  }, []);

  const seek = useCallback((seconds: number) => {
    if (currentTrackRef.current?.type !== "local" || !audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const playNext = useCallback(() => {
    const ct = currentTrackRef.current;
    if (!ct) return;
    if (ct.type === "local") {
      const lt = localTracksRef.current;
      const idx = lt.findIndex((t) => t.id === ct.id);
      const next = lt[(idx + 1) % lt.length];
      if (next) {
        const audio = audioRef.current;
        if (audio) { audio.src = next.objectUrl; void audio.play(); }
        setCurrentTrack(next);
        setIsPlaying(true);
      }
    } else {
      const idx = PRESETS.findIndex((p) => p.videoId === ct.videoId);
      const next = PRESETS[(idx + 1) % PRESETS.length];
      setCurrentTrack({ type: "youtube", videoId: next.videoId, title: next.title });
      setIsPlaying(true);
    }
  }, []);

  const playPrev = useCallback(() => {
    const ct = currentTrackRef.current;
    if (!ct) return;
    if (ct.type === "local") {
      const lt = localTracksRef.current;
      const idx = lt.findIndex((t) => t.id === ct.id);
      const prev = lt[(idx - 1 + lt.length) % lt.length];
      if (prev) {
        const audio = audioRef.current;
        if (audio) { audio.src = prev.objectUrl; void audio.play(); }
        setCurrentTrack(prev);
        setIsPlaying(true);
      }
    } else {
      const idx = PRESETS.findIndex((p) => p.videoId === ct.videoId);
      const prev = PRESETS[(idx - 1 + PRESETS.length) % PRESETS.length];
      setCurrentTrack({ type: "youtube", videoId: prev.videoId, title: prev.title });
      setIsPlaying(true);
    }
  }, []);

  const addLocalTracks = useCallback((files: File[]) => {
    const eligible = files.filter(isAudioFile);
    if (eligible.length === 0) return;
    const newTracks = eligible.map(makeLocalTrack);
    setLocalTracks((prev) => [...prev, ...newTracks]);
    if (!currentTrackRef.current && newTracks[0]) {
      const first = newTracks[0];
      const audio = audioRef.current;
      if (audio) {
        audio.src = first.objectUrl;
        audio.volume = volumeRef.current / 100;
        void audio.play();
      }
      setCurrentTrack(first);
      setIsPlaying(true);
    }
  }, []);

  const removeLocalTrack = useCallback((id: string) => {
    setLocalTracks((prev) => {
      const hit = prev.find((t) => t.id === id);
      if (hit) URL.revokeObjectURL(hit.objectUrl);
      return prev.filter((t) => t.id !== id);
    });
    if (currentTrackRef.current?.type === "local" && currentTrackRef.current.id === id) {
      const audio = audioRef.current;
      if (audio) { audio.pause(); audio.src = ""; }
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  }, []);

  const ctxValue = useMemo(
    () => ({
      currentTrack,
      isPlaying,
      volume: volumeLevel,
      currentTime,
      duration,
      localTracks,
      playYouTube,
      playLocal,
      pause,
      resume,
      stop,
      setVolume,
      seek,
      playNext,
      playPrev,
      addLocalTracks,
      removeLocalTrack,
    }),
    [
      currentTrack, isPlaying, volumeLevel, currentTime, duration, localTracks,
      playYouTube, playLocal, pause, resume, stop, setVolume,
      seek, playNext, playPrev, addLocalTracks, removeLocalTrack,
    ],
  );

  return (
    <MusicPlayerContext.Provider value={ctxValue}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
