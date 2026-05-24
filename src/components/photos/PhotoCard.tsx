import { Trash2 } from "lucide-react";
import { thumbUrl, type Photo } from "@/features/photos/photosService";

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
  onDelete: () => void;
}

export function PhotoCard({ photo, onClick, onDelete }: Readonly<PhotoCardProps>) {
  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg bg-slate-800 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <img
        src={thumbUrl(photo)}
        alt={photo.caption ?? photo.fileName}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Delete photo"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {photo.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-white truncate">{photo.caption}</p>
        </div>
      )}
    </div>
  );
}
