import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatePanel } from "@/components/common/StatePanel";
import { SkeletonBlock } from "@/components/common/Skeletons";
import { useFinance } from "@/hooks/useFinance";
import { toDateOnly } from "@/lib/date";

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function FinanceWidget() {
  const { transactions, isLoading, error } = useFinance();
  const currentMonth = useMemo(() => toDateOnly(new Date()).slice(0, 7), []);

  const summary = useMemo(() => {
    const monthTx = transactions.filter((tx) =>
      tx.date.startsWith(currentMonth)
    );
    const income = monthTx
      .filter((tx) => tx.type === "income")
      .reduce((s, tx) => s + tx.amount, 0);
    const expense = monthTx
      .filter((tx) => tx.type === "expense")
      .reduce((s, tx) => s + tx.amount, 0);
    return { income, expense, net: income - expense, hasAny: monthTx.length > 0 };
  }, [transactions, currentMonth]);

  const isInitialLoading = isLoading && transactions.length === 0;

  return (
    <Card className="glass-card card-accent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          Finance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error && !isInitialLoading ? (
          <StatePanel
            variant="error"
            title="Finance unavailable"
            description={error}
          />
        ) : isInitialLoading ? (
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-6 w-32" />
          </div>
        ) : !summary.hasAny ? (
          <p className="text-xs text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Income</span>
              <span className="text-sm font-medium">
                {formatCurrency(summary.income)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Expenses</span>
              <span className="text-sm font-medium">
                {formatCurrency(summary.expense)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Net</span>
              <span className="text-sm font-semibold">
                {formatCurrency(summary.net)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
