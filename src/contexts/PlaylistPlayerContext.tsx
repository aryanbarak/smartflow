import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface PlaylistPlayerState {
  playlistLabel: string | null;
  isShuffled: boolean;
  setPlaylistLabel: (label: string | null) => void;
  toggleShuffle: () => void;
}

const PlaylistPlayerContext = createContext<PlaylistPlayerState>({
  playlistLabel: null,
  isShuffled: false,
  setPlaylistLabel: () => undefined,
  toggleShuffle: () => undefined,
});

export function PlaylistPlayerProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [playlistLabel, setPlaylistLabel] = useState<string | null>(null);
  const [isShuffled, setIsShuffled] = useState(false);

  const toggleShuffle = useCallback(() => setIsShuffled((v) => !v), []);

  const value = useMemo(
    () => ({ playlistLabel, isShuffled, setPlaylistLabel, toggleShuffle }),
    [playlistLabel, isShuffled, toggleShuffle],
  );

  return <PlaylistPlayerContext.Provider value={value}>{children}</PlaylistPlayerContext.Provider>;
}

export function usePlaylistPlayer(): PlaylistPlayerState {
  return useContext(PlaylistPlayerContext);
}
