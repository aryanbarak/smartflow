import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface PhotoFilterState {
  search: string;
  filter: "all" | "tagged" | "untagged";
  sort: "newest" | "oldest" | "name";
  dateFrom: string;
  dateTo: string;
  tags: string[];
}

export const DEFAULT_FILTER: PhotoFilterState = {
  search: "",
  filter: "all",
  sort: "newest",
  dateFrom: "",
  dateTo: "",
  tags: [],
};

interface PhotoSearchBarProps {
  value: PhotoFilterState;
  onChange: (v: PhotoFilterState) => void;
  allTags: string[];
}

const FILTER_OPTIONS: { key: PhotoFilterState["filter"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "tagged", label: "Tagged" },
  { key: "untagged", label: "Untagged" },
];

const SORT_OPTIONS: { key: PhotoFilterState["sort"]; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "name", label: "Name" },
];

export function PhotoSearchBar({
  value,
  onChange,
  allTags,
}: Readonly<PhotoSearchBarProps>) {
  function set(patch: Partial<PhotoFilterState>) {
    onChange({ ...value, ...patch });
  }

  function toggleTag(tag: string) {
    const next = value.tags.includes(tag)
      ? value.tags.filter((t) => t !== tag)
      : [...value.tags, tag];
    set({ tags: next });
  }

  const hasActiveFilters =
    value.search ||
    value.filter !== "all" ||
    value.sort !== "newest" ||
    value.dateFrom ||
    value.dateTo ||
    value.tags.length > 0;

  return (
    <div className="space-y-3">
      {/* Search + reset */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <Input
            value={value.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search photos…"
            className="pl-8 text-sm bg-slate-800/60 border-slate-700 h-8"
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTER)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 shrink-0"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Filter + Sort row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => set({ filter: key })}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                value.filter === key
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-3.5 w-px bg-slate-700" />

        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => set({ sort: key })}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                value.sort === key
                  ? "bg-slate-700 text-slate-200"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1.5 ml-auto">
          <input
            type="date"
            title="From date"
            value={value.dateFrom}
            onChange={(e) => set({ dateFrom: e.target.value })}
            className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 [color-scheme:dark]"
          />
          <span className="text-slate-600 text-xs">–</span>
          <input
            type="date"
            title="To date"
            value={value.dateTo}
            onChange={(e) => set({ dateTo: e.target.value })}
            className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.slice(0, 20).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors ${
                value.tags.includes(tag)
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
