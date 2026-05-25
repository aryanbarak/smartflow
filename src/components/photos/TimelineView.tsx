import { useRef } from "react";
import { type Photo } from "@/features/photos/photosService";
import { MasonryGrid } from "./MasonryGrid";

interface TimelineViewProps {
  photos: Photo[];
  aiTaggingIds?: Set<string>;
  onPhotoClick: (photo: Photo, index: number) => void;
  onPhotoDelete: (photo: Photo) => void;
}

interface MonthGroup {
  key: string;
  label: string;
  photos: Photo[];
  globalStartIndex: number;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );
}

function groupByMonth(photos: Photo[]): MonthGroup[] {
  const map = new Map<string, Photo[]>();
  for (const p of photos) {
    const k = getMonthKey(p.createdAt);
    const arr = map.get(k);
    if (arr) {
      arr.push(p);
    } else {
      map.set(k, [p]);
    }
  }
  let offset = 0;
  return Array.from(map.entries()).map(([key, groupPhotos]) => {
    const group: MonthGroup = {
      key,
      label: getMonthLabel(key),
      photos: groupPhotos,
      globalStartIndex: offset,
    };
    offset += groupPhotos.length;
    return group;
  });
}

export function TimelineView({
  photos,
  aiTaggingIds,
  onPhotoClick,
  onPhotoDelete,
}: Readonly<TimelineViewProps>) {
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const groups = groupByMonth(photos);

  if (groups.length === 0) {
    return (
      <p className="text-center text-slate-500 py-16">No photos yet.</p>
    );
  }

  function scrollTo(key: string) {
    sectionRefs.current.get(key)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="flex gap-6">
      {/* Main timeline */}
      <div className="flex-1 min-w-0 space-y-10">
        {groups.map((group) => (
          <section
            key={group.key}
            ref={(el) => {
              if (el) sectionRefs.current.set(group.key, el);
            }}
          >
            <h2 className="text-sm font-semibold text-slate-300 mb-3 sticky top-0 bg-slate-950/90 backdrop-blur py-2 z-10">
              {group.label}
              <span className="ml-2 text-slate-600 font-normal">
                {group.photos.length}
              </span>
            </h2>
            <MasonryGrid
              photos={group.photos}
              aiTaggingIds={aiTaggingIds}
              onPhotoClick={(photo, idx) =>
                onPhotoClick(photo, group.globalStartIndex + idx)
              }
              onPhotoDelete={onPhotoDelete}
            />
          </section>
        ))}
      </div>

      {/* Jump sidebar */}
      <nav className="hidden lg:flex flex-col gap-1 w-24 shrink-0 sticky top-4 self-start">
        {groups.map((group) => (
          <button
            key={group.key}
            type="button"
            onClick={() => scrollTo(group.key)}
            className="text-left text-[11px] text-slate-500 hover:text-slate-300 truncate transition-colors"
          >
            {group.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
