import { useState } from "react";
import { Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRewardPoints } from "@/hooks/useRewardPoints";

interface Props {
  childId: string;
}

const GOAL = 50;

function StarsDisplay({ count }: { count: number }) {
  const stars = Math.min(count, 20);
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: stars }).map((_, i) => (
        <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
      ))}
      {count > 20 && <span className="text-amber-400 text-sm font-medium">+{count - 20} more</span>}
    </div>
  );
}

export function RewardSystem({ childId }: Props) {
  const { thisMonthPoints, totalThisMonth, isLoading, addPoints } = useRewardPoints(childId);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [pts, setPts] = useState("1");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const n = parseInt(pts, 10);
    if (!reason.trim() || Number.isNaN(n) || n <= 0) return;
    setSaving(true);
    try {
      await addPoints(n, reason.trim());
      setReason("");
      setPts("1");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  const pct = Math.min(Math.round((totalThisMonth / GOAL) * 100), 100);
  const reachedGoal = totalThisMonth >= GOAL;

  if (isLoading) {
    return <div className="h-32 rounded-xl bg-slate-800 animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      {/* Points summary */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-amber-400">{totalThisMonth}</p>
            <p className="text-xs text-slate-400">points this month</p>
          </div>
          {reachedGoal && (
            <span className="text-2xl">🏆</span>
          )}
        </div>

        <StarsDisplay count={totalThisMonth} />

        {/* Goal progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Goal: {GOAL} points</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add points */}
      {showForm ? (
        <div className="space-y-3 p-4 rounded-xl border border-slate-700 bg-slate-800">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-slate-400">Reason</Label>
              <Input
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Great job in school!"
                className="bg-slate-700 border-slate-600 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Points</Label>
              <Input
                type="number"
                min={1}
                value={pts}
                onChange={(e) => setPts(e.target.value)}
                className="bg-slate-700 border-slate-600 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleAdd()} disabled={saving || !reason.trim()}>Award</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="gap-1.5 text-slate-400 hover:text-slate-200">
          <Plus className="w-4 h-4" /> Award points
        </Button>
      )}

      {/* Points history */}
      {thisMonthPoints.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 uppercase tracking-wide">This month</Label>
          {thisMonthPoints.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2">
              <span className="text-sm text-slate-300">{p.reason}</span>
              <span className="text-sm font-medium text-amber-400">+{p.points} ⭐</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
