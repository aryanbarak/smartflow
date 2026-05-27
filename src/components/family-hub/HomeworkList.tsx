import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useHomework } from "@/hooks/useHomework";
import { todayStr } from "@/features/family-hub/familyHubService";

const SUBJECT_EMOJI: Record<string, string> = {
  Mathe: "🔢", Mathematik: "🔢", Deutsch: "📝", Englisch: "🇬🇧",
  Sachkunde: "🌍", Sport: "🏃", Musik: "🎵", Kunst: "🎨",
  Biologie: "🌱", Chemie: "⚗️", Physik: "⚛️", Geschichte: "📜",
  Geographie: "🗺️", Informatik: "💻",
};

function subjectEmoji(subject: string): string {
  return SUBJECT_EMOJI[subject] ?? "📋";
}

function dueDateStatus(dueDate: string): "overdue" | "today" | "upcoming" {
  const today = todayStr();
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  return "upcoming";
}

interface Props {
  childId: string;
  onAwardPoints?: (pts: number, reason: string) => void;
}

export function HomeworkList({ childId, onAwardPoints }: Props) {
  const { homework, isLoading, add, toggle, remove } = useHomework(childId);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");

  async function handleAdd() {
    if (!subject.trim() || !title.trim()) return;
    await add({ subject: subject.trim(), title: title.trim(), dueDate, priority });
    setSubject(""); setTitle(""); setDueDate(todayStr()); setPriority("normal");
    setShowForm(false);
  }

  async function handleToggle(id: string, completed: boolean) {
    await toggle(id, !completed);
    if (!completed) {
      const hw = homework.find((h) => h.id === id);
      if (hw && hw.dueDate >= todayStr()) {
        onAwardPoints?.(2, "Hausaufgaben pünktlich erledigt");
      }
    }
  }

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-lg bg-slate-800 animate-pulse" />)}</div>;
  }

  const pending = homework.filter((h) => !h.completed);
  const done = homework.filter((h) => h.completed);

  return (
    <div className="space-y-4">
      {pending.length === 0 && done.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">No homework yet. 🎉</p>
      )}

      {pending.map((hw) => {
        const status = dueDateStatus(hw.dueDate);
        return (
          <div key={hw.id} className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 transition-all", status === "overdue" ? "border-red-500/40 bg-red-500/10" : status === "today" ? "border-amber-500/40 bg-amber-500/10" : "border-slate-700 bg-slate-800/50")}>
            <button type="button" onClick={() => void handleToggle(hw.id, hw.completed)} className="mt-0.5 w-5 h-5 rounded border-2 border-slate-500 flex-shrink-0 hover:border-cyan-400 transition-colors" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span>{subjectEmoji(hw.subject)}</span>
                <span className="text-xs font-medium text-slate-400">{hw.subject}</span>
                {status === "overdue" && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              </div>
              <p className="text-sm text-slate-200 mt-0.5">{hw.title}</p>
              <p className={cn("text-xs mt-0.5", status === "overdue" ? "text-red-400" : status === "today" ? "text-amber-400" : "text-slate-500")}>
                {status === "overdue" ? "Überfällig — " : status === "today" ? "Heute fällig — " : ""}{hw.dueDate}
              </p>
            </div>
            <button type="button" onClick={() => void remove(hw.id)} className="text-slate-600 hover:text-red-400 transition-colors mt-0.5">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {done.length > 0 && (
        <details className="group">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 select-none">
            {done.length} completed
          </summary>
          <div className="mt-2 space-y-2">
            {done.map((hw) => (
              <div key={hw.id} className="flex items-center gap-3 rounded-xl border border-slate-800 px-4 py-2 opacity-50">
                <button type="button" onClick={() => void handleToggle(hw.id, hw.completed)} className="w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400 text-xs">✓</span>
                </button>
                <span className="text-sm line-through text-slate-500 flex-1">{hw.title}</span>
                <button type="button" onClick={() => void remove(hw.id)} className="text-slate-700 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {showForm ? (
        <div className="space-y-3 p-4 rounded-xl border border-slate-700 bg-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Mathe" className="bg-slate-700 border-slate-600 h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-slate-700 border-slate-600 h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Aufgaben Seite 42..." className="bg-slate-700 border-slate-600 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "normal" | "high")}>
              <SelectTrigger className="w-32 h-8 bg-slate-700 border-slate-600 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8" onClick={() => void handleAdd()} disabled={!subject.trim() || !title.trim()}>Save</Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="gap-1.5 text-slate-400 hover:text-slate-200">
          <Plus className="w-4 h-4" />
          Add homework
        </Button>
      )}
    </div>
  );
}
