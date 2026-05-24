import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Info, Trash2 } from "lucide-react";
import { photoUrl, type Photo, type Album } from "@/features/photos/photosService";
import { PhotoDetailPanel } from "./PhotoDetailPanel";

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  albums: Album[];
  onClose: () => void;
  onDelete: (photo: Photo) => void;
  onUpdate: (id: string, patch: { caption?: string | null; tags?: string[]; albumId?: string | null }) => void;
}

export function PhotoLightbox({
  photos,
  initialIndex,
  albums,
  onClose,
  onDelete,
  onUpdate,
}: Readonly<PhotoLightboxProps>) {
  const [index, setIndex] = useState(() => Math.min(initialIndex, Math.max(0, photos.length - 1)));
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, photos.length - 1)));
  }, [photos.length]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(
    () => setIndex((i) => Math.min(photos.length - 1, i + 1)),
    [photos.length],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  const photo = photos[index];
  if (!photo) return null;

  function handleDelete() {
    onDelete(photo);
    if (photos.length === 1) {
      onClose();
    } else if (index >= photos.length - 1) {
      setIndex((i) => Math.max(0, i - 1));
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex">
      {/* Photo pane */}
      <div className="flex-1 flex items-center justify-center relative min-w-0">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10 bg-gradient-to-b from-black/60 to-transparent">
          <span className="text-sm text-slate-400">
            {index + 1} / {photos.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowDetail((v) => !v)}
              className={`p-2 rounded-full transition-colors ${
                showDetail
                  ? "bg-white/20 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
              aria-label="Photo info"
            >
              <Info className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
              aria-label="Delete photo"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Photo */}
        <img
          key={photo.id}
          src={photoUrl(photo.r2Key)}
          alt={photo.caption ?? photo.fileName}
          className="max-h-[calc(100vh-80px)] max-w-full object-contain"
        />

        {/* Prev */}
        {index > 0 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Next */}
        {index < photos.length - 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Caption */}
        {photo.caption && !showDetail && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-sm text-white">{photo.caption}</p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {showDetail && (
        <div className="w-72 border-l border-slate-800 bg-slate-900 overflow-y-auto flex-shrink-0">
          <PhotoDetailPanel
            photo={photo}
            albums={albums}
            onClose={() => setShowDetail(false)}
            onUpdate={(patch) => onUpdate(photo.id, patch)}
          />
        </div>
      )}
    </div>
  );
}
