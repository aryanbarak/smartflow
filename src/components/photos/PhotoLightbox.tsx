import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Trash2,
  Download,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { photoUrl, type Photo, type Album } from "@/features/photos/photosService";
import { PhotoDetailPanel } from "./PhotoDetailPanel";

// ─── Touch-gesture hook ────────────────────────────────────────────────────────

function useTouchGestures(
  prev: () => void,
  next: () => void,
  zoom: number,
  setZoom: React.Dispatch<React.SetStateAction<number>>,
) {
  const startX = useRef(0);
  const startY = useRef(0);
  const didPinch = useRef(false);
  const lastDist = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      didPinch.current = false;
    } else {
      didPinch.current = true;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length !== 2) {
      lastDist.current = null;
      return;
    }
    didPinch.current = true;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    if (lastDist.current !== null) {
      setZoom((z) => Math.max(1, Math.min(4, z * (dist / lastDist.current))));
    }
    lastDist.current = dist;
  }

  function onTouchEnd(e: React.TouchEvent) {
    lastDist.current = null;
    if (didPinch.current || zoom > 1) return;
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
  }

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(n: number | null): string {
  if (!n) return "";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  albums: Album[];
  onClose: () => void;
  onDelete: (photo: Photo) => void;
  onUpdate: (id: string, patch: { caption?: string | null; tags?: string[]; albumId?: string | null; location?: string | null }) => void;
}

export function PhotoLightbox({
  photos,
  initialIndex,
  albums,
  onClose,
  onDelete,
  onUpdate,
}: Readonly<PhotoLightboxProps>) {
  const [index, setIndex] = useState(() =>
    Math.min(initialIndex, Math.max(0, photos.length - 1)),
  );
  const [showDetail, setShowDetail] = useState(false);
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, photos.length - 1)));
  }, [photos.length]);

  useEffect(() => {
    setZoom(1);
  }, [index]);

  useEffect(() => {
    if (!imgRef.current) return;
    imgRef.current.style.transform = `scale(${zoom})`;
    imgRef.current.style.transition = zoom === 1 ? "transform 0.2s ease" : "none";
  }, [zoom]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(
    () => setIndex((i) => Math.min(photos.length - 1, i + 1)),
    [photos.length],
  );

  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures(
    prev,
    next,
    zoom,
    setZoom,
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
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

  function handleDownload() {
    const a = document.createElement("a");
    a.href = photoUrl(photo.r2Key);
    a.download = photo.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleShare() {
    const url = photoUrl(photo.r2Key);
    try {
      if (navigator.share) {
        await navigator.share({ url, title: photo.caption ?? photo.fileName });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied to clipboard");
      }
    } catch {
      await navigator.clipboard.writeText(url).catch(() => {});
      toast("Link copied to clipboard");
    }
  }

  const meta = [
    photo.width && photo.height ? `${photo.width}×${photo.height}` : null,
    fmtBytes(photo.fileSize),
    new Date(photo.createdAt).toLocaleDateString(),
    photo.location,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex">
      {/* Photo pane */}
      <div
        className="flex-1 flex items-center justify-center relative min-w-0 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 z-10 bg-gradient-to-b from-black/60 to-transparent">
          <span className="text-sm text-slate-400">
            {index + 1} / {photos.length}
          </span>
          <div className="flex items-center gap-0.5">
            {[
              { icon: Share2, label: "Share", action: handleShare },
              { icon: Download, label: "Download", action: handleDownload },
              { icon: Trash2, label: "Delete", action: handleDelete, danger: true },
            ].map(({ icon: Icon, label, action, danger }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className={`p-2 rounded-full transition-colors ${
                  danger
                    ? "text-slate-400 hover:text-red-400 hover:bg-white/10"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
                aria-label={label}
              >
                <Icon className="h-4.5 w-4.5" />
              </button>
            ))}
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
              <Info className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Photo */}
        <button
          type="button"
          className="flex items-center justify-center w-full h-full focus:outline-none"
          onClick={() => setZoom((z) => (z > 1 ? 1 : 2.5))}
          aria-label={zoom > 1 ? "Zoom out" : "Zoom in"}
        >
          <img
            ref={imgRef}
            key={photo.id}
            src={photoUrl(photo.r2Key)}
            alt={photo.caption ?? photo.fileName}
            className={`max-h-[calc(100vh-80px)] max-w-full object-contain select-none ${zoom > 1 ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            draggable={false}
          />
        </button>

        {/* Prev */}
        {index > 0 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Bottom metadata */}
        {!showDetail && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            {photo.caption && (
              <p className="text-sm text-white mb-1">{photo.caption}</p>
            )}
            <p className="text-xs text-slate-500">{meta.join("  ·  ")}</p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {showDetail && (
        <div className="w-72 border-l border-slate-800 bg-slate-900 overflow-y-auto flex-shrink-0">
          <PhotoDetailPanel
            key={photo.id}
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
