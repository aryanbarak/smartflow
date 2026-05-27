import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChecklist } from "@/hooks/useChecklist";

interface Props {
  childId: string;
  onAwardPoints?: (pts: number, reason: string) => void;
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{done} of {total} done</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DailyChecklist({ childId, onAwardPoints }: Props) {
  const { templates, completedIds, completedCount, totalCount, isLoading, toggle, addTemplate, deleteTemplate } =
    useChecklist(childId);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newIcon, setNewIcon] = useState("✅");

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    await addTemplate(title, newIcon);
    setNewTitle("");
    setNewIcon("✅");
    setShowAdd(false);
  }

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-lg bg-slate-800 animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <ProgressBar done={completedCount} total={totalCount} />

      <div className="space-y-2">
        {templates.map((t) => {
          const done = completedIds.has(t.id);
          return (
            <div
              key={t.id}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 border transition-all cursor-pointer select-none",
                done ? "border-emerald-500/30 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
              )}
              onClick={() => void toggle(t.id, () => onAwardPoints?.(1, "Checkliste abgeschlossen"))}
            >
              <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all", done ? "border-emerald-500 bg-emerald-500" : "border-slate-500")}>
                {done && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-lg">{t.icon}</span>
              <span className={cn("flex-1 text-sm", done ? "line-through text-slate-500" : "text-slate-200")}>
                {t.title}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); void deleteTemplate(t.id); }}
                className="text-slate-600 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {showAdd ? (
        <div className="flex gap-2 items-center p-3 rounded-xl border border-slate-700 bg-slate-800">
          <Input
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            className="w-14 text-center bg-slate-700 border-slate-600"
            maxLength={2}
          />
          <Input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
            placeholder="New item..."
            className="flex-1 bg-slate-700 border-slate-600"
          />
          <Button size="sm" onClick={() => void handleAdd()} disabled={!newTitle.trim()}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 text-slate-400 hover:text-slate-200">
          <Plus className="w-4 h-4" />
          Add item
        </Button>
      )}
    </div>
  );
}
