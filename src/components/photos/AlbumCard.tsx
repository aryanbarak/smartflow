import { FolderOpen, Image as ImageIcon, Trash2 } from "lucide-react";
import { thumbUrl, type Photo, type Album } from "@/features/photos/photosService";
import { Button } from "@/components/ui/button";

interface AlbumCardProps {
  album: Album;
  coverPhoto: Photo | null;
  photoCount: number;
  onClick: () => void;
  onDelete: () => void;
}

export function AlbumCard({
  album,
  coverPhoto,
  photoCount,
  onClick,
  onDelete,
}: Readonly<AlbumCardProps>) {
  return (
    <div
      className="rounded-xl border border-slate-700 bg-slate-800 hover:border-slate-600 transition-colors overflow-hidden cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        {coverPhoto ? (
          <img
            src={thumbUrl(coverPhoto)}
            alt={album.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="h-10 w-10 text-slate-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
          <ImageIcon className="h-2.5 w-2.5" />
          {photoCount}
        </span>
      </div>

      <div className="p-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-200 truncate">{album.name}</p>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-slate-500 hover:text-red-400 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete album"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
