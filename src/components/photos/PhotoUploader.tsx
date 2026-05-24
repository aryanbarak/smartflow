import { useRef, useState } from "react";
import { Upload, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type UploadProgress } from "@/hooks/usePhotos";

interface PhotoUploaderProps {
  uploadQueue: UploadProgress[];
  onUpload: (files: File[]) => void;
}

export function PhotoUploader({ uploadQueue, onUpload }: Readonly<PhotoUploaderProps>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (images.length > 0) onUpload(images);
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-cyan-500 bg-cyan-500/5"
            : "border-slate-700 hover:border-slate-600",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Drop photos here or click to select</p>
        <p className="text-xs text-slate-600 mt-1">JPEG, PNG, WebP, HEIC supported</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploadQueue.length > 0 && (
        <div className="space-y-1.5">
          {uploadQueue.map((item) => (
            <div
              key={item.fileId}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-sm"
            >
              {item.status === "done" && (
                <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
              )}
              {item.status === "error" && (
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              )}
              {(item.status === "pending" || item.status === "uploading") && (
                <div className="h-4 w-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin flex-shrink-0" />
              )}
              <span className="flex-1 truncate text-slate-300">{item.fileName}</span>
              {item.status === "error" && item.error && (
                <span className="text-xs text-red-400 truncate max-w-[120px]">{item.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
