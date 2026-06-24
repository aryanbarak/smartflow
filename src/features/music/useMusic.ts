import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { musicService, type MusicTrack } from './musicService';
import { toast } from 'sonner';

const K = {
  playlists: ['playlists'] as const,
  playlistTracks: (id: string) => ['playlist-tracks', id] as const,
  history: ['play-history'] as const,
  liked: ['liked-tracks'] as const,
};

export function usePlaylists() {
  return useQuery({ queryKey: K.playlists, queryFn: musicService.getPlaylists });
}

export function usePlaylistTracks(playlistId: string | null) {
  return useQuery({
    queryKey: K.playlistTracks(playlistId ?? ''),
    queryFn: () => musicService.getPlaylistTracks(playlistId!),
    enabled: !!playlistId,
  });
}

export function usePlayHistory() {
  return useQuery({ queryKey: K.history, queryFn: () => musicService.getHistory(20) });
}

export function useLikedTracks() {
  return useQuery({ queryKey: K.liked, queryFn: musicService.getLikedTracks });
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      musicService.createPlaylist(name, description),
    onSuccess: () => { qc.invalidateQueries({ queryKey: K.playlists }); },
    onError: () => { toast.error('Failed to create playlist'); },
  });
}

export function useDeletePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => musicService.deletePlaylist(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: K.playlists }); },
    onError: () => { toast.error('Failed to delete playlist'); },
  });
}

export function useAddTrackToPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, track }: { playlistId: string; track: MusicTrack }) =>
      musicService.addTrackToPlaylist(playlistId, track),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: K.playlistTracks(vars.playlistId) });
      qc.invalidateQueries({ queryKey: K.playlists });
    },
    onError: () => { toast.error('Failed to add track'); },
  });
}

export function useRemoveTrackFromPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, playlistId }: { trackId: string; playlistId: string }) =>
      musicService.removeTrackFromPlaylist(trackId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: K.playlistTracks(vars.playlistId) });
      qc.invalidateQueries({ queryKey: K.playlists });
    },
    onError: () => { toast.error('Failed to remove track'); },
  });
}

export function useAddToHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (track: MusicTrack) => musicService.addToHistory(track),
    onSuccess: () => { qc.invalidateQueries({ queryKey: K.history }); },
  });
}

export function useLikeTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (track: MusicTrack) => musicService.likeTrack(track),
    onSuccess: () => { qc.invalidateQueries({ queryKey: K.liked }); },
    onError: () => { toast.error('Failed to like track'); },
  });
}

export function useUnlikeTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (youtubeId: string) => musicService.unlikeTrack(youtubeId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: K.liked }); },
    onError: () => { toast.error('Failed to unlike track'); },
  });
}
