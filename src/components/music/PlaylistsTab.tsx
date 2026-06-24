import { useState } from "react";
import { Play, Pencil, Trash2, Check, X, ChevronUp, ChevronDown, ListMusic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type Playlist, type PlaylistTrack } from "@/features/music/musicService";
import {
  usePlaylists, usePlaylistTracks,
  useCreatePlaylist, useDeletePlaylist, useRemoveTrackFromPlaylist,
} from "@/features/music/useMusic";
import { musicService } from "@/features/music/musicService";

// ─── Playlist card ────────────────────────────────────────────────────────────

interface PlaylistCardProps {
  playlist: Playlist;
  isPlayingNow: boolean;
  coverUrl: string | null;
  onPlay: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onClick: () => void;
}

function PlaylistCard({
  playlist, isPlayingNow, coverUrl, onPlay, onRename, onDelete, onClick,
}: Readonly<PlaylistCardProps>) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(playlist.name);

  function commitRename() {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== playlist.name) onRename(trimmed);
    setIsRenaming(false);
  }

  return (
    <div className={cn(
      "rounded-xl border flex flex-col overflow-hidden transition-colors",
      isPlayingNow ? "border-cyan-500/50 bg-cyan-500/5" : "border-slate-700 bg-slate-800 hover:border-slate-600",
    )}>
      <button type="button" className="relative aspect-video w-full flex-shrink-0 overflow-hidden" onClick={onClick} aria-label={`Open ${playlist.name}`}>
        {coverUrl ? (
          <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <ListMusic className="h-10 w-10 text-slate-500" />
          </div>
        )}
        {isPlayingNow && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-cyan-300 bg-black/60 px-2 py-0.5 rounded-full">▶ Playing</span>
          </div>
        )}
        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full">
          {playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}
        </span>
      </button>
      <div className="p-3 flex flex-col gap-2">
        {isRenaming ? (
          <div className="flex items-center gap-1">
            <Input autoFocus value={draftName} onChange={e => setDraftName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setDraftName(playlist.name); setIsRenaming(false); } }}
              className="h-7 text-sm bg-slate-700 border-slate-600 px-2" />
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400" onClick={commitRename}><Check className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400" onClick={() => { setDraftName(playlist.name); setIsRenaming(false); }}><X className="h-3.5 w-3.5" /></Button>
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-100 truncate" title={playlist.name}>{playlist.name}</p>
        )}
        <div className="flex gap-1">
          <Button size="sm" className="flex-1 h-7 text-xs gap-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30" onClick={onPlay}>
            <Play className="h-3 w-3" /> Play All
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white"
            onClick={() => { setDraftName(playlist.name); setIsRenaming(true); }} aria-label="Rename"><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
            onClick={onDelete} aria-label="Delete playlist"><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}

// ─── Playlist detail view ──────────────────────────────────────────────────────

interface PlaylistDetailViewProps {
  playlist: Playlist;
  tracks: PlaylistTrack[];
  isLoadingTracks: boolean;
  activeVideoId: string | null;
  isPlaying: boolean;
  onBack: () => void;
  onPlayAll: () => void;
  onPlayTrack: (index: number) => void;
  onRemoveTrack: (track: PlaylistTrack) => void;
}

function PlaylistDetailView({
  playlist, tracks, isLoadingTracks, activeVideoId, isPlaying, onBack, onPlayAll, onPlayTrack, onRemoveTrack,
}: Readonly<PlaylistDetailViewProps>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">← Back</button>
        <h3 className="text-base font-semibold text-slate-100 truncate flex-1">{playlist.name}</h3>
        <Button size="sm" className="gap-1.5 h-8 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 flex-shrink-0"
          onClick={onPlayAll} disabled={tracks.length === 0}><Play className="h-3.5 w-3.5" /> Play All</Button>
      </div>

      {isLoadingTracks ? (
        <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-14 rounded-lg bg-slate-800 animate-pulse" />)}</div>
      ) : tracks.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-10">No tracks yet — search and add some above.</p>
      ) : (
        <div className="space-y-1.5">
          {tracks.map((track, idx) => {
            const isActive = track.youtubeId === activeVideoId;
            const thumb = track.thumbnailUrl ?? `https://i.ytimg.com/vi/${track.youtubeId}/mqdefault.jpg`;
            return (
              <div key={track.id} className={cn("flex items-center gap-2 rounded-lg p-2 transition-colors group", isActive ? "bg-cyan-500/10 border border-cyan-500/30" : "hover:bg-slate-800")}>
                <button type="button" onClick={() => onPlayTrack(idx)} className="relative flex-shrink-0 w-20 aspect-video overflow-hidden rounded">
                  <img src={thumb} alt={track.title} className="w-full h-full object-cover" loading="lazy" />
                  {isActive && isPlaying && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-[10px] text-cyan-300">▶</span></div>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-medium truncate", isActive ? "text-cyan-300" : "text-slate-200")}>{track.title}</p>
                  {track.artist && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{track.artist}</p>}
                </div>
                <button type="button" onClick={() => onRemoveTrack(track)} className="p-1 rounded text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Playlists tab ─────────────────────────────────────────────────────────────

export interface PlaylistsTabProps {
  activePlaylistId: string | null;
  activeVideoId: string | null;
  isPlaying: boolean;
  onPlayAll: (playlistId: string, tracks: PlaylistTrack[], startIdx?: number) => void;
}

export function PlaylistsTab({ activePlaylistId, activeVideoId, isPlaying, onPlayAll }: Readonly<PlaylistsTabProps>) {
  const { data: playlists = [], isLoading: isLoadingPlaylists } = usePlaylists();
  const { mutate: createPlaylist } = useCreatePlaylist();
  const { mutate: deletePlaylist } = useDeletePlaylist();
  const { mutate: removeTrack } = useRemoveTrackFromPlaylist();

  const [view, setView] = useState<"grid" | "detail">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const selectedPlaylist = playlists.find(p => p.id === selectedId) ?? null;
  const { data: selectedTracks = [], isLoading: isLoadingTracks } = usePlaylistTracks(selectedId);

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createPlaylist({ name: trimmed });
    toast(`Playlist "${trimmed}" created`);
    setNewName(""); setIsCreating(false);
  }

  function handleRename(id: string, name: string) {
    void musicService.updatePlaylist(id, { name });
    toast(`Renamed to "${name}"`);
  }

  function handleDelete(id: string) {
    const target = playlists.find(p => p.id === id);
    deletePlaylist(id);
    if (target) toast(`Deleted "${target.name}"`);
    if (selectedId === id) { setSelectedId(null); setView("grid"); }
  }

  function handleRemoveTrack(track: PlaylistTrack) {
    removeTrack({ trackId: track.id, playlistId: track.playlistId });
  }

  // Detail view
  if (view === "detail" && selectedPlaylist) {
    return (
      <PlaylistDetailView
        playlist={selectedPlaylist}
        tracks={selectedTracks}
        isLoadingTracks={isLoadingTracks}
        activeVideoId={activeVideoId}
        isPlaying={isPlaying}
        onBack={() => setView("grid")}
        onPlayAll={() => onPlayAll(selectedPlaylist.id, selectedTracks)}
        onPlayTrack={idx => onPlayAll(selectedPlaylist.id, selectedTracks, idx)}
        onRemoveTrack={handleRemoveTrack}
      />
    );
  }

  // Grid view
  if (isLoadingPlaylists) {
    return <div className="grid grid-cols-2 gap-4">{[0,1].map(i => <div key={i} className="aspect-video rounded-xl bg-slate-800 animate-pulse" />)}</div>;
  }

  const countLabel = playlists.length === 0 ? "No playlists yet" : `${playlists.length} playlist${playlists.length === 1 ? '' : 's'}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{countLabel}</p>
        <Button size="sm" variant="outline" className="gap-1.5 border-slate-700 text-slate-300 hover:text-white"
          onClick={() => { setIsCreating(true); setNewName(""); }}>＋ New Playlist</Button>
      </div>

      {isCreating && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700">
          <Input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setIsCreating(false); }}
            placeholder="Playlist name…" className="flex-1 h-8 text-sm bg-slate-700 border-slate-600" />
          <Button size="sm" className="h-8" onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
          <Button size="sm" variant="ghost" className="h-8 text-slate-400" onClick={() => setIsCreating(false)}>Cancel</Button>
        </div>
      )}

      {playlists.length === 0 && !isCreating ? (
        <div className="text-center py-16 space-y-2">
          <ListMusic className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-500">No playlists yet.</p>
          <p className="text-xs text-slate-600">Search for music and use the ＋ button to add videos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {playlists.map(pl => (
            <PlaylistCard key={pl.id} playlist={pl} isPlayingNow={pl.id === activePlaylistId}
              coverUrl={pl.coverUrl}
              onPlay={() => {
                musicService.getPlaylistTracks(pl.id).then(tracks => onPlayAll(pl.id, tracks)).catch(() => {});
              }}
              onRename={name => handleRename(pl.id, name)}
              onDelete={() => handleDelete(pl.id)}
              onClick={() => { setSelectedId(pl.id); setView("detail"); }} />
          ))}
        </div>
      )}
    </div>
  );
}
