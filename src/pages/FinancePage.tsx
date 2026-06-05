import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  FileBarChart,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatePanel } from "@/components/common/StatePanel";
import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonListItem,
} from "@/components/common/Skeletons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFinance } from "@/hooks/useFinance";
import {
  Transaction,
  TransactionType,
} from "@/features/finance/financeService";
import { BudgetGoalsWidget } from "@/features/finance/components/BudgetGoalsWidget";
import { CsvImportExport } from "@/features/finance/components/CsvImportExport";
import { BankImportTool } from "@/features/finance/components/BankImportTool";
import { BudgetLimitsWidget } from "@/features/finance/components/BudgetLimitsWidget";
import { SavingsGoalsWidget } from "@/features/finance/components/SavingsGoalsWidget";
import { FinanceCharts } from "@/features/finance/components/FinanceCharts";
import { RecurringTransactions } from "@/features/finance/components/RecurringTransactions";
import { generateMonthlyReport } from "@/features/finance/reportService";
import { cn } from "@/lib/utils";

const categories = ["Food", "Transport", "Rent", "Health", "Other"];

type GroupBy = "none" | "day" | "week";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Local date helper: interpret "YYYY-MM-DD" as local midnight */
function toLocalDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return new Date(`${value}T00:00:00`);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatMonthYear(date: Date): string {
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
}

// week starts on Monday
function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 Sun, 1 Mon, ...
  const diff = (day + 6) % 7; // 0 for Mon, 6 for Sun
  d.setDate(d.getDate() - diff);
  return d;
}

function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface TransactionGroup {
  key: string;
  label: string;
  transactions: Transaction[];
  income: number;
  expense: number;
  net: number;
}

export default function FinancePage() {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    isLoading,
    error: financeError,
    refresh,
  } = useFinance();

  // This Month / All
  const [filter, setFilter] = useState<"month" | "all">("month");
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    startOfMonth(new Date())
  );

  // Dialog / form
  const [type, setType] = useState<TransactionType>("expense");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Search / filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showIncome, setShowIncome] = useState(true);
  const [showExpense, setShowExpense] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Grouping for list + chart
  const [groupBy, setGroupBy] = useState<GroupBy>("day");

  const [showImport, setShowImport] = useState(false);

  // ---------- Scope + month navigation ----------

  const baseTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((tx) =>
      isSameMonth(toLocalDate(tx.date), selectedMonth)
    );
  }, [transactions, filter, selectedMonth]);

  // ---------- Filters + search ----------

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return baseTransactions.filter((tx) => {
      if (!showIncome && tx.type === "income") return false;
      if (!showExpense && tx.type === "expense") return false;
      if (categoryFilter !== "all" && tx.category !== categoryFilter)
        return false;

      if (!query) return true;
      const haystack = `${tx.category} ${tx.notes ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [
    baseTransactions,
    categoryFilter,
    searchQuery,
    showExpense,
    showIncome,
  ]);

  // ---------- Grouping by day/week (for list + chart) ----------

  const groups = useMemo<TransactionGroup[]>(() => {
    if (groupBy === "none") {
      const income = filteredTransactions
        .filter((tx) => tx.type === "income")
        .reduce((s, tx) => s + tx.amount, 0);
      const expense = filteredTransactions
        .filter((tx) => tx.type === "expense")
        .reduce((s, tx) => s + tx.amount, 0);

      return [
        {
          key: "all",
          label: "All transactions",
          transactions: filteredTransactions,
          income,
          expense,
          net: income - expense,
        },
      ];
    }

    const map = new Map<string, TransactionGroup>();

    for (const tx of filteredTransactions) {
      const d = toLocalDate(tx.date);
      let key: string;
      let label: string;

      if (groupBy === "day") {
        key = formatDateISO(d);
        label = d.toLocaleDateString();
      } else {
        const wkStart = startOfWeek(d);
        key = `week-${formatDateISO(wkStart)}`;
        const wkEnd = new Date(wkStart);
        wkEnd.setDate(wkEnd.getDate() + 6);
        label = `${wkStart.toLocaleDateString()} - ${wkEnd.toLocaleDateString()}`;
      }

      if (!map.has(key)) {
        map.set(key, {
          key,
          label,
          transactions: [],
          income: 0,
          expense: 0,
          net: 0,
        });
      }

      const group = map.get(key)!;
      group.transactions.push(tx);
      if (tx.type === "income") group.income += tx.amount;
      else group.expense += tx.amount;
      group.net = group.income - group.expense;
    }

    const result = Array.from(map.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );
    return result;
  }, [filteredTransactions, groupBy]);

  // ---------- Totals = Ø®Ù„Ø§ØµÙ‡â€ŒÛŒ Ø¯ÛŒØªØ§ÛŒ Ù‚Ø§Ø¨Ù„ Ù…Ø´Ø§Ù‡Ø¯Ù‡ ----------

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = filteredTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    filteredTransactions.forEach((tx) => {
      const current = map.get(tx.category) ?? { income: 0, expense: 0 };
      if (tx.type === "income") current.income += tx.amount;
      else current.expense += tx.amount;
      map.set(tx.category, current);
    });
    const items = Array.from(map.entries())
      .map(([category, values]) => ({
        category,
        income: values.income,
        expense: values.expense,
      }))
      .sort((a, b) => b.expense - a.expense);
    const totalExpense = items.reduce((sum, item) => sum + item.expense, 0);
    return {
      totalExpense,
      items: items.map((item) => ({
        ...item,
        expenseShare: totalExpense ? item.expense / totalExpense : 0,
      })),
    };
  }, [filteredTransactions]);

  const hasAnyTransactions = transactions.length > 0;
  const hasFilteredResults = filteredTransactions.length > 0;
  const isInitialLoading = isLoading && !transactions.length;

  const currentMonthStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`;

  const currentMonthTransactions = useMemo(
    () => transactions.filter((tx) => isSameMonth(toLocalDate(tx.date), selectedMonth)),
    [transactions, selectedMonth],
  );

  const last6Months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en", { month: "short" });
      const income = transactions
        .filter((t) => t.date?.startsWith(key) && t.type === "income")
        .reduce((s, t) => s + Number(t.amount), 0);
      const expenses = transactions
        .filter((t) => t.date?.startsWith(key) && t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0);
      return { month: label, income, expenses };
    });
  }, [transactions]);

  const monthLabel =
    filter === "all" ? "All time" : formatMonthYear(selectedMonth);

  const handleScopeChange = (value: "month" | "all") => {
    setFilter(value);
    if (value === "month") {
      setSelectedMonth(startOfMonth(new Date()));
    }
  };

  const handlePrevMonth = () => {
    if (filter === "all") return;
    setSelectedMonth((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    if (filter === "all") return;
    setSelectedMonth((prev) => addMonths(prev, 1));
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setShowIncome(true);
    setShowExpense(true);
    setCategoryFilter("all");
  };

  // ---------- CRUD handlers ----------

  const openNew = () => {
    setEditingTx(null);
    setType("expense");
    setAmount("");
    setCategory(categories[0]);
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setFormError(null);
    setIsDialogOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setType(tx.type);
    setAmount(tx.amount.toString());
    setCategory(tx.category);
    setDate(tx.date);
    setNotes(tx.notes ?? "");
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const numericAmount = Number(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setFormError("Amount must be a positive number.");
      return;
    }
    if (!category) {
      setFormError("Category is required.");
      return;
    }
    if (editingTx) {
      void updateTransaction(editingTx.id, {
        type,
        amount: numericAmount,
        category,
        date,
        notes,
      });
    } else {
      void addTransaction({
        type,
        amount: numericAmount,
        category,
        date,
        notes,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      void removeTransaction(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // ---------- Export visible data to PDF ----------

  const handleExportPdf = () => {
    if (filteredTransactions.length === 0) return;

    const docTitle =
      filter === "all"
        ? "Finance - All transactions"
        : `Finance - ${monthLabel}`;

    const win = window.open("", "_blank");
    if (!win) return;

    const style = `
      <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
        .meta { color: #555; font-size: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; }
        .right { text-align: right; }
        .income { color: #15803d; }
        .expense { color: #b91c1c; }
        .totals { margin-top: 16px; font-size: 13px; }
      </style>
    `;

    const rowsHtml = filteredTransactions
      .map((tx) => {
        const d = toLocalDate(tx.date).toLocaleDateString();
        const sign = tx.type === "income" ? "+" : "-";
        const cls = tx.type === "income" ? "income" : "expense";
        return `
          <tr>
            <td>${d}</td>
            <td>${tx.type}</td>
            <td>${tx.category}</td>
            <td>${tx.notes ?? ""}</td>
            <td class="right ${cls}">${sign}${formatCurrency(tx.amount)}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <title>${docTitle}</title>
          ${style}
        </head>
        <body>
          <h1>${docTitle}</h1>
          <div class="meta">
            Group by: ${groupBy.toUpperCase()} | 
            Scope: ${filter === "all" ? "All" : monthLabel} |
            Generated: ${new Date().toLocaleString()}
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Notes</th>
                <th class="right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="totals">
            <strong>Income:</strong> ${formatCurrency(totals.income)} |
            <strong>Expenses:</strong> ${formatCurrency(totals.expense)} |
            <strong>Net:</strong> ${formatCurrency(totals.net)}
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  // ---------- Monthly PDF report ----------

  const handleExportReport = async () => {
    const byCategory = Object.entries(
      filteredTransactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
          return acc;
        }, {} as Record<string, number>),
    )
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const bytes = await generateMonthlyReport({
      month: currentMonthStr,
      totalIncome: totals.income,
      totalExpenses: totals.expense,
      balance: totals.net,
      byCategory,
      transactions: filteredTransactions.map((t) => ({
        date: t.date,
        type: t.type,
        category: t.category,
        amount: Number(t.amount),
        notes: t.notes ?? null,
      })),
    });

    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-report-${currentMonthStr}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Monthly report downloaded");
  };


  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {financeError && (
        <div className="mb-4">
          <StatePanel
            variant="error"
            title="Finance failed to load"
            description={financeError || "Failed to load finance data. Please try again."}
          />
        </div>
      )}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 gap-3 flex-wrap"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold mb-1">Finance</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleExportPdf}
            disabled={!hasFilteredResults}
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => void handleExportReport()}
            disabled={!hasFilteredResults}
          >
            <FileBarChart className="w-4 h-4" />
            Monthly Report
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setShowImport(true)}
          >
            <Upload className="w-4 h-4" />
            Import PDF
          </Button>
          <CsvImportExport
            transactions={transactions}
            onImport={async (rows) => {
              for (const row of rows) {
                await addTransaction(row);
              }
            }}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-glow" onClick={openNew}>
                <Plus className="w-4 h-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTx ? "Edit Transaction" : "Add Transaction"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <Tabs
                  value={type}
                  onValueChange={(value) =>
                    setType(value as TransactionType)
                  }
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="expense" className="flex-1">
                      Expense
                    </TabsTrigger>
                    <TabsTrigger value="income" className="flex-1">
                      Income
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleSave}>
                  {editingTx ? "Save Changes" : "Save Transaction"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Totals */}
      {isInitialLoading ? (
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-3 mb-6"
        >
          <Card className="bg-success/10 border-success/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="text-xl font-semibold text-success">
                    {formatCurrency(totals.income)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-success/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="text-xl font-semibold text-destructive">
                    {formatCurrency(totals.expense)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-xl font-semibold text-primary">
                    {formatCurrency(totals.net)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Transactions header: tabs + month nav + group by */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <CardTitle className="text-lg">Transactions</CardTitle>
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs
            value={filter}
            onValueChange={(value) =>
              handleScopeChange(value as "month" | "all")
            }
          >
            <TabsList className="bg-secondary">
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-1 text-xs sm:text-sm",
              filter === "all" && "opacity-60"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrevMonth}
              disabled={filter === "all"}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="min-w-[120px] text-center font-medium">
              {monthLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextMonth}
              disabled={filter === "all"}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Select
            value={groupBy}
            onValueChange={(v) => setGroupBy(v as GroupBy)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No grouping</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by category or notes..."
          className="max-w-xs"
        />
        <Toggle
          pressed={showIncome}
          onPressedChange={setShowIncome}
          className="rounded-full"
        >
          Income
        </Toggle>
        <Toggle
          pressed={showExpense}
          onPressedChange={setShowExpense}
          className="rounded-full"
        >
          Expense
        </Toggle>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Category insights</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryStats.items.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No category data for current filters.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {categoryStats.items.slice(0, 5).map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.category}</span>
                    <span>
                      {formatCurrency(item.expense)}
                      {categoryStats.totalExpense > 0 && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({Math.round(item.expenseShare * 100)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-destructive"
                      style={{ width: `${item.expenseShare * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grouped list + empty states */}
      {isInitialLoading ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonListItem key={idx} />
            ))}
          </CardContent>
        </Card>
      ) : !hasAnyTransactions ? (
        <StatePanel
          variant="empty"
          title="No transactions yet"
          description="Start by adding your first income or expense. Once you have data, charts and category insights will appear here."
          actionLabel="Add entry"
          onAction={openNew}
        />
      ) : !hasFilteredResults ? (
        <StatePanel
          variant="empty"
          title="No results for your current filters"
          description="Try adjusting your search, type toggles, or category filter."
          actionLabel="Clear filters"
          onAction={handleClearFilters}
        />
      ) : (
        <Card>
          <CardContent className="space-y-4 pt-6">
            {groups.map((g) => (
              <div key={g.key} className="space-y-2">
                {groupBy !== "none" && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {g.label}
                    </span>
                    <span>
                      {g.transactions.length} item
                      {g.transactions.length > 1 ? "s" : ""} Net:{" "}
                      <span
                        className={cn(
                          g.net >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {g.net >= 0 ? "+" : "-"}
                        {formatCurrency(Math.abs(g.net))}
                      </span>
                    </span>
                  </div>
                )}

                {g.transactions.map((tx) => {
                  const dateLabel = toLocalDate(tx.date).toLocaleDateString();
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary"
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          tx.type === "income"
                            ? "bg-success/20"
                            : "bg-destructive/20"
                        )}
                      >
                        {tx.type === "income" ? (
                          <TrendingUp className="w-5 h-5 text-success" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tx.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.notes || "No notes"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            tx.type === "income"
                              ? "text-success"
                              : "text-destructive"
                          )}
                        >
                          {tx.type === "income" ? "+" : "-"}$
                          {formatCurrency(tx.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dateLabel}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(tx)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(tx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
<AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the selected transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Charts */}
      <div className="mt-6">
        <FinanceCharts
          transactions={filteredTransactions}
          months={last6Months}
        />
      </div>

      {/* Budget Goals */}
      <div className="mt-4">
        <BudgetGoalsWidget />
      </div>

      {/* Budget Limits + Savings Goals */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BudgetLimitsWidget
          currentMonth={currentMonthStr}
          transactions={currentMonthTransactions}
        />
        <SavingsGoalsWidget />
      </div>

      {/* Recurring Transactions */}
      <div className="mt-4">
        <RecurringTransactions onApplied={refresh} />
      </div>

      <AnimatePresence>
        {showImport && (
          <BankImportTool
            onImportComplete={() => { /* transactions reload automatically via useFinance subscription */ }}
            onClose={() => setShowImport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}










