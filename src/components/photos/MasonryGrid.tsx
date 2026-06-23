import { type Photo } from "@/features/photos/photosService";
import { PhotoCard } from "./PhotoCard";

interface MasonryGridProps {
  photos: Photo[];
  aiTaggingIds?: Set<string>;
  onPhotoClick: (photo: Photo, index: number) => void;
  onPhotoDelete: (photo: Photo) => void;
  onToggleFavorite?: (photo: Photo) => void;
}

export function MasonryGrid({
  photos,
  aiTaggingIds,
  onPhotoClick,
  onPhotoDelete,
  onToggleFavorite,
}: Readonly<MasonryGridProps>) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
      {photos.map((photo, idx) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isAiTagging={aiTaggingIds?.has(photo.id) ?? false}
          onClick={() => onPhotoClick(photo, idx)}
          onDelete={() => onPhotoDelete(photo)}
          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(photo) : undefined}
        />
      ))}
    </div>
  );
}
