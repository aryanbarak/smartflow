import { useState, useMemo } from "react";
import { Image, FolderOpen, Clock, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePhotos } from "@/hooks/usePhotos";
import { useAlbums } from "@/hooks/useAlbums";
import { MasonryGrid } from "@/components/photos/MasonryGrid";
import { PhotoUploader } from "@/components/photos/PhotoUploader";
import { PhotoLightbox } from "@/components/photos/PhotoLightbox";
import { AlbumCard } from "@/components/photos/AlbumCard";
import { TimelineView } from "@/components/photos/TimelineView";
import {
  PhotoSearchBar,
  DEFAULT_FILTER,
  type PhotoFilterState,
} from "@/components/photos/PhotoSearchBar";
import { type Photo } from "@/features/photos/photosService";

type TabId = "photos" | "albums" | "timeline";

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function matchesSearch(photo: Photo, q: string): boolean {
  return (
    photo.fileName.toLowerCase().includes(q) ||
    (photo.caption?.toLowerCase().includes(q) ?? false) ||
    (photo.location?.toLowerCase().includes(q) ?? false) ||
    photo.tags.some((t) => t.toLowerCase().includes(q))
  );
}

function sortPhotos(photos: Photo[], sort: PhotoFilterState["sort"]): Photo[] {
  if (sort === "oldest") return [...photos].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (sort === "name") return [...photos].sort((a, b) => a.fileName.localeCompare(b.fileName));
  return photos;
}

function applyFilters(photos: Photo[], f: PhotoFilterState): Photo[] {
  let result = photos;
  if (f.filter === "tagged") result = result.filter((p) => p.tags.length > 0);
  else if (f.filter === "untagged") result = result.filter((p) => p.tags.length === 0);
  const q = f.search.trim().toLowerCase();
  if (q) result = result.filter((p) => matchesSearch(p, q));
  if (f.dateFrom) result = result.filter((p) => p.createdAt.slice(0, 10) >= f.dateFrom);
  if (f.dateTo) result = result.filter((p) => p.createdAt.slice(0, 10) <= f.dateTo);
  if (f.tags.length > 0) {
    const lower = new Set(f.tags.map((t) => t.toLowerCase()));
    result = result.filter((p) => p.tags.some((t) => lower.has(t.toLowerCase())));
  }
  return sortPhotos(result, f.sort);
}

function albumLabel(count: number): string {
  const s = count === 1 ? "" : "s";
  return count === 0 ? "No albums" : `${count} album${s}`;
}

const SKELETON_KEYS = ["s0", "s1", "s2", "s3", "s4", "s5"];

const TAB_DEFS: { id: TabId; label: string; icon: typeof Image }[] = [
  { id: "photos", label: "All Photos", icon: Image },
  { id: "albums", label: "Albums", icon: FolderOpen },
  { id: "timeline", label: "Timeline", icon: Clock },
];

// ─── Photo grid renderer ──────────────────────────────────────────────────────

interface GridRenderProps {
  isLoading: boolean;
  filteredPhotos: Photo[];
  tab: TabId;
  isInAlbumView: boolean;
  aiTaggingIds: Set<string>;
  onPhotoClick: (photo: Photo, idx: number) => void;
  onPhotoDelete: (photo: Photo) => void;
}

function renderPhotoGrid({
  isLoading,
  filteredPhotos,
  tab,
  isInAlbumView,
  aiTaggingIds,
  onPhotoClick,
  onPhotoDelete,
}: GridRenderProps): React.ReactNode {
  if (isLoading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
        {SKELETON_KEYS.map((k) => (
          <div key={k} className="rounded-lg bg-slate-800 animate-pulse mb-3 h-48" />
        ))}
      </div>
    );
  }
  if (filteredPhotos.length === 0) {
    return (
      <div className="text-center py-20 space-y-2">
        <Image className="h-12 w-12 text-slate-700 mx-auto" />
        <p className="text-sm text-slate-500">No photos found.</p>
      </div>
    );
  }
  if (tab === "timeline" && !isInAlbumView) {
    return (
      <TimelineView
        photos={filteredPhotos}
        aiTaggingIds={aiTaggingIds}
        onPhotoClick={onPhotoClick}
        onPhotoDelete={onPhotoDelete}
      />
    );
  }
  return (
    <MasonryGrid
      photos={filteredPhotos}
      aiTaggingIds={aiTaggingIds}
      onPhotoClick={onPhotoClick}
      onPhotoDelete={onPhotoDelete}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PhotosPage() {
  const [tab, setTab] = useState<TabId>("photos");
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [filterState, setFilterState] = useState<PhotoFilterState>(DEFAULT_FILTER);

  const { photos, isLoading, uploadQueue, aiTaggingIds, upload, remove, update } = usePhotos();
  const { albums, create: createAlbum, remove: removeAlbum } = useAlbums();

  const albumPhotos = useMemo(
    () => (activeAlbumId ? photos.filter((p) => p.albumId === activeAlbumId) : photos),
    [photos, activeAlbumId],
  );
  const filteredPhotos = useMemo(
    () => applyFilters(albumPhotos, filterState),
    [albumPhotos, filterState],
  );
  const allTags = useMemo(
    () => [...new Set(photos.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b)),
    [photos],
  );

  const isInAlbumView = activeAlbumId !== null;
  const showPhotoContent = tab === "photos" || tab === "timeline" || isInAlbumView;

  function handleUpload(files: File[]) {
    upload(files, activeAlbumId ?? null);
    setShowUploader(false);
  }

  function handlePhotoDelete(photo: Photo) {
    remove(photo);
    if (lightboxIndex !== null && filteredPhotos.length === 1) {
      setLightboxIndex(null);
    }
  }

  async function handleCreateAlbum() {
    const name = newAlbumName.trim();
    if (!name) return;
    await createAlbum(name);
    setNewAlbumName("");
    setCreatingAlbum(false);
  }

  const photoGrid = renderPhotoGrid({
    isLoading,
    filteredPhotos,
    tab,
    isInAlbumView,
    aiTaggingIds,
    onPhotoClick: (_photo, idx) => setLightboxIndex(idx),
    onPhotoDelete: handlePhotoDelete,
  });

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            {isInAlbumView
              ? (albums.find((a) => a.id === activeAlbumId)?.name ?? "Album")
              : "Photos"}
          </h1>
          {isInAlbumView && (
            <button
              type="button"
              onClick={() => setActiveAlbumId(null)}
              className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mt-0.5 transition-colors"
            >
              ← All Photos
            </button>
          )}
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
          onClick={() => setShowUploader((v) => !v)}
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {(showUploader || uploadQueue.length > 0) && (
        <PhotoUploader uploadQueue={uploadQueue} onUpload={handleUpload} />
      )}

      {!isInAlbumView && (
        <div className="flex gap-1 border-b border-slate-800">
          {TAB_DEFS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === id
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-slate-500 hover:text-slate-300",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {showPhotoContent && (
        <>
          <PhotoSearchBar value={filterState} onChange={setFilterState} allTags={allTags} />
          {photoGrid}
        </>
      )}

      {tab === "albums" && !isInAlbumView && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{albumLabel(albums.length)}</p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-slate-700 text-slate-300 hover:text-white"
              onClick={() => { setCreatingAlbum(true); setNewAlbumName(""); }}
            >
              <Plus className="h-4 w-4" />
              New Album
            </Button>
          </div>

          {creatingAlbum && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700">
              <Input
                autoFocus
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateAlbum();
                  if (e.key === "Escape") setCreatingAlbum(false);
                }}
                placeholder="Album name…"
                className="flex-1 h-8 text-sm bg-slate-700 border-slate-600"
              />
              <Button size="sm" className="h-8" onClick={handleCreateAlbum} disabled={!newAlbumName.trim()}>
                Create
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-slate-400" onClick={() => setCreatingAlbum(false)}>
                Cancel
              </Button>
            </div>
          )}

          {albums.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  coverPhoto={photos.find((p) => p.albumId === album.id) ?? null}
                  photoCount={photos.filter((p) => p.albumId === album.id).length}
                  onClick={() => { setActiveAlbumId(album.id); setTab("photos"); }}
                  onDelete={() => removeAlbum(album.id)}
                />
              ))}
            </div>
          ) : (
            !creatingAlbum && (
              <div className="text-center py-16 space-y-2">
                <FolderOpen className="h-10 w-10 text-slate-700 mx-auto" />
                <p className="text-sm text-slate-500">No albums yet.</p>
                <p className="text-xs text-slate-600">Create albums to organize your photos.</p>
              </div>
            )
          )}
        </div>
      )}

      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <PhotoLightbox
          photos={filteredPhotos}
          initialIndex={lightboxIndex}
          albums={albums}
          onClose={() => setLightboxIndex(null)}
          onDelete={handlePhotoDelete}
          onUpdate={update}
        />
      )}
    </div>
  );
}
