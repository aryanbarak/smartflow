import { useState } from "react";
import { Wallet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { usePocketMoney } from "@/hooks/usePocketMoney";

interface Props {
  childId: string;
}

function monthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

export function PocketMoney({ childId }: Props) {
  const { records, isLoading, thisMonthRecord, currentMonth, setMonth, markPaid } = usePocketMoney(childId);
  const [amountInput, setAmountInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSetAmount() {
    const val = parseFloat(amountInput);
    if (Number.isNaN(val) || val <= 0) return;
    setSaving(true);
    try {
      await setMonth(val);
      setAmountInput("");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <div className="h-32 rounded-xl bg-slate-800 animate-pulse" />;
  }

  const history = records.filter((r) => r.month !== currentMonth).slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Current month */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">{monthLabel(currentMonth)}</span>
        </div>

        {thisMonthRecord ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-100">{thisMonthRecord.amount.toFixed(2)} €</p>
              {thisMonthRecord.paid && thisMonthRecord.paidAt && (
                <p className="text-xs text-emerald-400 mt-0.5">
                  Paid on {new Date(thisMonthRecord.paidAt).toLocaleDateString("de-DE")}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => void markPaid(thisMonthRecord.id, !thisMonthRecord.paid)}
              className={cn("gap-1.5", thisMonthRecord.paid ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-700 hover:bg-slate-600")}
            >
              {thisMonthRecord.paid && <Check className="w-3.5 h-3.5" />}
              {thisMonthRecord.paid ? "Paid" : "Mark paid"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No amount set for this month.</p>
        )}

        <div className="flex gap-2 items-center">
          <Input
            type="number"
            min={0}
            step={0.5}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder={thisMonthRecord ? `Change from ${thisMonthRecord.amount} €` : "Set amount (€)"}
            className="bg-slate-700 border-slate-600 h-8 text-sm flex-1"
          />
          <Button size="sm" className="h-8" onClick={() => void handleSetAmount()} disabled={saving || !amountInput}>
            {thisMonthRecord ? "Update" : "Set"}
          </Button>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-slate-500 uppercase tracking-wide">History</Label>
          {history.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2">
              <div>
                <p className="text-sm text-slate-300">{monthLabel(r.month)}</p>
                <p className="text-xs text-slate-500">{r.amount.toFixed(2)} €</p>
              </div>
              <span className={cn("text-xs px-2 py-0.5 rounded-full", r.paid ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400")}>
                {r.paid ? "Paid" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
