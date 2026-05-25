import { useState } from "react";
import { X, Tag, MapPin } from "lucide-react";
import { type Photo, type Album } from "@/features/photos/photosService";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useFamilyNames } from "@/hooks/useFamilyNames";

interface PhotoDetailPanelProps {
  photo: Photo;
  albums: Album[];
  onClose: () => void;
  onUpdate: (patch: {
    caption?: string | null;
    tags?: string[];
    albumId?: string | null;
    location?: string | null;
  }) => void;
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
  const [location, setLocation] = useState(photo.location ?? "");
  const [tags, setTags] = useState(photo.tags);
  const [tagInput, setTagInput] = useState("");
  const [albumId, setAlbumId] = useState(photo.albumId ?? "");
  const familyNames = useFamilyNames();

  function applyTag(tag: string) {
    const t = tag.trim();
    const lower = new Set(tags.map((x) => x.toLowerCase()));
    if (!t || lower.has(t.toLowerCase())) return;
    const next = [...tags, t];
    setTags(next);
    onUpdate({ tags: next });
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    onUpdate({ tags: next });
  }

  function commitTagInput() {
    if (tagInput.trim()) {
      applyTag(tagInput);
      setTagInput("");
    }
  }

  function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTagInput();
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  function handleAlbumChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setAlbumId(e.target.value);
    onUpdate({ albumId: e.target.value || null });
  }

  const lowerTags = new Set(tags.map((t) => t.toLowerCase()));
  const suggestions = familyNames.filter(
    (n) => !lowerTags.has(n.toLowerCase()),
  );

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
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => onUpdate({ caption: caption.trim() || null })}
          placeholder="Add a caption…"
          className="text-sm bg-slate-800 border-slate-700 resize-none"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Location
        </label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onBlur={() => onUpdate({ location: location.trim() || null })}
          placeholder="City, Country…"
          className="text-sm bg-slate-800 border-slate-700"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <Tag className="h-3 w-3" />
          Tags
        </label>
        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-800 border border-slate-700 rounded-md min-h-[38px]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 text-slate-200 text-xs rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={onTagKeyDown}
            onBlur={commitTagInput}
            placeholder={tags.length === 0 ? "Add tags…" : ""}
            className="flex-1 min-w-[80px] bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none"
          />
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, 6).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => applyTag(name)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
              >
                + {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {albums.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor="detail-album" className="text-xs font-medium text-slate-400">Album</label>
          <select
            id="detail-album"
            title="Album"
            value={albumId}
            onChange={handleAlbumChange}
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
    </div>
  );
}
