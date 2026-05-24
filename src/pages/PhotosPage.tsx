import { useState } from "react";
import { Image, FolderOpen, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePhotos } from "@/hooks/usePhotos";
import { useAlbums } from "@/hooks/useAlbums";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { PhotoUploader } from "@/components/photos/PhotoUploader";
import { PhotoLightbox } from "@/components/photos/PhotoLightbox";
import { AlbumCard } from "@/components/photos/AlbumCard";
import { type Photo } from "@/features/photos/photosService";

type TabId = "photos" | "albums";

export default function PhotosPage() {
  const [tab, setTab] = useState<TabId>("photos");
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");

  const { photos, isLoading, uploadQueue, upload, remove, update } = usePhotos();
  const { albums, create: createAlbum, remove: removeAlbum } = useAlbums();

  const displayPhotos = activeAlbumId
    ? photos.filter((p) => p.albumId === activeAlbumId)
    : photos;

  function handleUpload(files: File[]) {
    upload(files, activeAlbumId ?? null);
    setShowUploader(false);
  }

  function handlePhotoDelete(photo: Photo) {
    remove(photo);
    if (lightboxIndex !== null && displayPhotos.length === 1) {
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

  function getCoverPhoto(albumId: string) {
    return photos.find((p) => p.albumId === albumId) ?? null;
  }

  function getPhotoCount(albumId: string) {
    return photos.filter((p) => p.albumId === albumId).length;
  }

  const tabs: { id: TabId; label: string; icon: typeof Image }[] = [
    { id: "photos", label: "All Photos", icon: Image },
    { id: "albums", label: "Albums", icon: FolderOpen },
  ];

  const isInAlbumView = activeAlbumId !== null;

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

      {/* Uploader */}
      {showUploader && (
        <PhotoUploader uploadQueue={uploadQueue} onUpload={handleUpload} />
      )}

      {/* Upload progress when uploader is hidden */}
      {!showUploader && uploadQueue.length > 0 && (
        <PhotoUploader uploadQueue={uploadQueue} onUpload={handleUpload} />
      )}

      {/* Tabs — hidden in album drill-down */}
      {!isInAlbumView && (
        <div className="flex gap-1 border-b border-slate-800">
          {tabs.map(({ id, label, icon: Icon }) => (
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

      {/* Photos content */}
      {(tab === "photos" || isInAlbumView) && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : displayPhotos.length === 0 ? (
            <div className="text-center py-20 space-y-2">
              <Image className="h-12 w-12 text-slate-700 mx-auto" />
              <p className="text-sm text-slate-500">No photos yet.</p>
              <p className="text-xs text-slate-600">Click Upload to add your first photos.</p>
            </div>
          ) : (
            <PhotoGrid
              photos={displayPhotos}
              onPhotoClick={(_photo, idx) => setLightboxIndex(idx)}
              onPhotoDelete={handlePhotoDelete}
            />
          )}
        </>
      )}

      {/* Albums content */}
      {tab === "albums" && !isInAlbumView && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {albums.length === 0
                ? "No albums"
                : `${albums.length} album${albums.length !== 1 ? "s" : ""}`}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-slate-700 text-slate-300 hover:text-white"
              onClick={() => {
                setCreatingAlbum(true);
                setNewAlbumName("");
              }}
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
              <Button
                size="sm"
                className="h-8"
                onClick={handleCreateAlbum}
                disabled={!newAlbumName.trim()}
              >
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-slate-400"
                onClick={() => setCreatingAlbum(false)}
              >
                Cancel
              </Button>
            </div>
          )}

          {albums.length === 0 && !creatingAlbum ? (
            <div className="text-center py-16 space-y-2">
              <FolderOpen className="h-10 w-10 text-slate-700 mx-auto" />
              <p className="text-sm text-slate-500">No albums yet.</p>
              <p className="text-xs text-slate-600">Create albums to organize your photos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  coverPhoto={getCoverPhoto(album.id)}
                  photoCount={getPhotoCount(album.id)}
                  onClick={() => {
                    setActiveAlbumId(album.id);
                    setTab("photos");
                  }}
                  onDelete={() => removeAlbum(album.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && displayPhotos[lightboxIndex] && (
        <PhotoLightbox
          photos={displayPhotos}
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
