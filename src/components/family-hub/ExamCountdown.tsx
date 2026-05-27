import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useExams } from "@/hooks/useExams";
import { todayStr } from "@/features/family-hub/familyHubService";

function daysUntil(dateStr: string): number {
  const exam = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  return Math.round((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function countdownColor(days: number): string {
  if (days < 0) return "text-slate-400";
  if (days < 3) return "text-red-400";
  if (days < 7) return "text-orange-400";
  if (days < 14) return "text-amber-400";
  return "text-emerald-400";
}

function countdownBg(days: number): string {
  if (days < 0) return "border-slate-700 bg-slate-800/50";
  if (days < 3) return "border-red-500/40 bg-red-500/10";
  if (days < 7) return "border-orange-500/40 bg-orange-500/10";
  if (days < 14) return "border-amber-500/40 bg-amber-500/10";
  return "border-emerald-500/30 bg-emerald-500/5";
}

interface Props {
  childId: string;
  onAwardPoints?: (pts: number, reason: string) => void;
}

export function ExamCountdown({ childId, onAwardPoints }: Props) {
  const { exams, isLoading, add, setGrade, remove } = useExams(childId);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState("");

  async function handleAdd() {
    if (!subject.trim()) return;
    await add({ subject: subject.trim(), examDate, notes: notes.trim() || undefined });
    setSubject(""); setExamDate(todayStr()); setNotes(""); setShowForm(false);
  }

  async function handleGrade(id: string) {
    const g = gradeInput.trim();
    if (!g) return;
    const isPassing = !["5", "6", "F", "Nicht bestanden"].includes(g);
    await setGrade(id, g, isPassing ? () => onAwardPoints?.(5, "Prüfung bestanden") : undefined);
    setGradingId(null);
    setGradeInput("");
  }

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-800 animate-pulse" />)}</div>;
  }

  if (exams.length === 0 && !showForm) {
    return (
      <div className="text-center py-6 space-y-3">
        <p className="text-slate-500 text-sm">No exams scheduled.</p>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="gap-1.5 text-slate-400 hover:text-slate-200">
          <Plus className="w-4 h-4" /> Add exam
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exams.map((exam) => {
        const days = daysUntil(exam.examDate);
        const isPast = days < 0;
        return (
          <div key={exam.id} className={cn("rounded-xl border px-4 py-3 space-y-2", countdownBg(days))}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-200">{exam.subject}</p>
                <p className="text-xs text-slate-500">{exam.examDate}</p>
                {exam.notes && <p className="text-xs text-slate-500 mt-0.5">{exam.notes}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                {isPast ? (
                  exam.grade ? (
                    <span className="text-lg font-bold text-slate-300">Note: {exam.grade}</span>
                  ) : (
                    gradingId === exam.id ? (
                      <div className="flex items-center gap-1">
                        <Input value={gradeInput} onChange={(e) => setGradeInput(e.target.value)} className="w-16 h-7 text-sm bg-slate-700 border-slate-600" placeholder="1-6" />
                        <Button size="sm" className="h-7 px-2" onClick={() => void handleGrade(exam.id)}>✓</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs border-slate-600" onClick={() => setGradingId(exam.id)}>Enter grade</Button>
                    )
                  )
                ) : (
                  <div>
                    <span className={cn("text-2xl font-bold", countdownColor(days))}>{days}</span>
                    <p className="text-xs text-slate-500">{days === 1 ? "Tag noch" : "Tage noch"}</p>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => void remove(exam.id)} className="text-slate-600 hover:text-red-400 transition-colors mt-0.5">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      {showForm ? (
        <div className="space-y-3 p-4 rounded-xl border border-slate-700 bg-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Mathe" className="bg-slate-700 border-slate-600 h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Exam date</Label>
              <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="bg-slate-700 border-slate-600 h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Kapitel 3-5..." className="bg-slate-700 border-slate-600 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleAdd()} disabled={!subject.trim()}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="gap-1.5 text-slate-400 hover:text-slate-200">
          <Plus className="w-4 h-4" /> Add exam
        </Button>
      )}
    </div>
  );
}
