import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChecklist } from "@/hooks/useChecklist";
import { useHomework } from "@/hooks/useHomework";
import { useExams } from "@/hooks/useExams";
import { useRewardPoints } from "@/hooks/useRewardPoints";
import { todayStr } from "@/features/family-hub/familyHubService";
import { useAuth } from "@/hooks/useAuth";
import { Child } from "@/features/family/familyService";

const AI_AGENT_URL = import.meta.env.VITE_AI_AGENT_URL ?? "https://api.barakzai.cloud";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 space-y-1">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

interface Props {
  child: Child;
}

export function WeeklyReport({ child }: Props) {
  const { session } = useAuth() as { session: { access_token: string } | null };
  const { completedCount, totalCount } = useChecklist(child.id);
  const { homework } = useHomework(child.id);
  const { exams } = useExams(child.id);
  const { totalThisMonth } = useRewardPoints(child.id);

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const today = todayStr();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const recentHomework = homework.filter((h) => h.dueDate >= weekAgo && h.dueDate <= today);
  const onTime = recentHomework.filter((h) => h.completed).length;
  const late = recentHomework.filter((h) => !h.completed && h.dueDate < today).length;
  const recentExams = exams.filter((e) => e.examDate >= weekAgo && e.examDate <= today);
  const checklistRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  async function handleGenerate() {
    if (!session) return;
    setGenerating(true);
    setGenError(null);
    try {
      const resp = await fetch(`${AI_AGENT_URL}/family/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          childName: child.name,
          checklistRate,
          homeworkStats: { onTime, late, total: recentHomework.length },
          exams: recentExams.map((e) => ({ subject: e.subject, grade: e.grade })),
          points: totalThisMonth,
          systemPrompt:
            "You are a family assistant. Analyze this child's week and give a warm, encouraging report for parents in German. Include: what went well, what needs attention, one specific tip.",
        }),
      });
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const data = await resp.json() as { report?: string; text?: string };
      setAiReport(data.report ?? data.text ?? JSON.stringify(data));
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Checklist today" value={`${completedCount}/${totalCount}`} sub={`${checklistRate}% done`} />
        <StatCard label="Homework (7d)" value={`${onTime}/${recentHomework.length}`} sub={late > 0 ? `${late} overdue` : "All on time"} />
        <StatCard label="Exams this week" value={recentExams.length} sub={recentExams.length > 0 ? recentExams.map((e) => e.subject).join(", ") : "None"} />
        <StatCard label="Points this month" value={totalThisMonth} sub="⭐ earned" />
      </div>

      <Button
        onClick={() => void handleGenerate()}
        disabled={generating || !session}
        className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {generating ? "Generating..." : "Generate AI Report"}
      </Button>

      {genError && (
        <p className="text-sm text-red-400 text-center">{genError}</p>
      )}

      {aiReport && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-violet-300 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI Weekly Report
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{aiReport}</p>
        </div>
      )}
    </div>
  );
}
