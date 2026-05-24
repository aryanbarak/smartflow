import { type Photo } from "@/features/photos/photosService";
import { PhotoCard } from "./PhotoCard";

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo, index: number) => void;
  onPhotoDelete: (photo: Photo) => void;
}

export function PhotoGrid({ photos, onPhotoClick, onPhotoDelete }: Readonly<PhotoGridProps>) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {photos.map((photo, idx) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onClick={() => onPhotoClick(photo, idx)}
          onDelete={() => onPhotoDelete(photo)}
        />
      ))}
    </div>
  );
}
