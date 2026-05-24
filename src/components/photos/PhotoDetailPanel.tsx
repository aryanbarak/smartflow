import { useState } from "react";
import { X, Tag } from "lucide-react";
import { type Photo, type Album } from "@/features/photos/photosService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PhotoDetailPanelProps {
  photo: Photo;
  albums: Album[];
  onClose: () => void;
  onUpdate: (patch: { caption?: string | null; tags?: string[]; albumId?: string | null }) => void;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function PhotoDetailPanel({
  photo,
  albums,
  onClose,
  onUpdate,
}: Readonly<PhotoDetailPanelProps>) {
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [tagInput, setTagInput] = useState(photo.tags.join(", "));
  const [albumId, setAlbumId] = useState(photo.albumId ?? "");
  const [dirty, setDirty] = useState(false);

  function handleSave() {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onUpdate({ caption: caption.trim() || null, tags, albumId: albumId || null });
    setDirty(false);
  }

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Photo Info</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-500 hover:text-white"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1.5 text-xs text-slate-500">
        <div className="flex justify-between gap-2">
          <span>File</span>
          <span className="text-slate-300 truncate text-right">{photo.fileName}</span>
        </div>
        {photo.fileSize != null && (
          <div className="flex justify-between">
            <span>Size</span>
            <span className="text-slate-300">{formatBytes(photo.fileSize)}</span>
          </div>
        )}
        {photo.width != null && photo.height != null && (
          <div className="flex justify-between">
            <span>Dimensions</span>
            <span className="text-slate-300">
              {photo.width} × {photo.height}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Uploaded</span>
          <span className="text-slate-300">
            {new Date(photo.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <hr className="border-slate-800" />

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">Caption</label>
        <Textarea
          value={caption}
          onChange={(e) => {
            setCaption(e.target.value);
            setDirty(true);
          }}
          placeholder="Add a caption…"
          className="text-sm bg-slate-800 border-slate-700 resize-none"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <Tag className="h-3 w-3" />
          Tags (comma-separated)
        </label>
        <Input
          value={tagInput}
          onChange={(e) => {
            setTagInput(e.target.value);
            setDirty(true);
          }}
          placeholder="nature, travel, 2024"
          className="text-sm bg-slate-800 border-slate-700"
        />
      </div>

      {albums.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Album</label>
          <select
            value={albumId}
            onChange={(e) => {
              setAlbumId(e.target.value);
              setDirty(true);
            }}
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="">No album</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {dirty && (
        <Button
          size="sm"
          className="w-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
          onClick={handleSave}
        >
          Save Changes
        </Button>
      )}
    </div>
  );
}
