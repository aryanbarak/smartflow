import { Trash2 } from "lucide-react";
import { thumbUrl, type Photo } from "@/features/photos/photosService";

interface PhotoCardProps {
  photo: Photo;
  isAiTagging?: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function PhotoCard({
  photo,
  isAiTagging = false,
  onClick,
  onDelete,
}: Readonly<PhotoCardProps>) {
  return (
    // Outer div is the group container — not interactive itself.
    // Main click area and delete button are sibling <button>s, never nested.
    <div className="group relative overflow-hidden rounded-lg bg-slate-800 break-inside-avoid mb-3">
      {/* Primary click target */}
      <button
        type="button"
        className="w-full text-left cursor-pointer"
        onClick={onClick}
        aria-label={`View ${photo.caption ?? photo.fileName}`}
      >
        <img
          src={thumbUrl(photo)}
          alt={photo.caption ?? photo.fileName}
          className="w-full block transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors pointer-events-none" />

        {isAiTagging && (
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 text-[10px] text-cyan-300 font-medium pointer-events-none">
            <span className="h-2.5 w-2.5 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
            <span>AI tagging</span>
          </div>
        )}

        {(photo.caption || photo.tags.length > 0) && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {photo.caption && (
              <p className="text-xs text-white truncate">{photo.caption}</p>
            )}
            {photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {photo.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-slate-300 bg-white/10 px-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </button>

      {/* Delete — sibling of main button, not nested inside it */}
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Delete photo"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
