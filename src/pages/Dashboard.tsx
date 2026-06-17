import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, CheckSquare, MessageSquare, Plus, Wallet } from "lucide-react";
import { AgentBriefingCard } from "@/components/AgentBriefingCard";
import "@/components/AgentBriefingCard.css";
import { TodayWidget } from "@/components/dashboard/TodayWidget";
import { TasksWidget } from "@/components/dashboard/TasksWidget";
import { FinanceWidget } from "@/components/dashboard/FinanceWidget";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/features/profile/useProfile";
import { useEvents } from "@/hooks/useEvents";
import { useTasks } from "@/hooks/useTasks";
import { useFinance } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonBlock } from "@/components/common/Skeletons";
import { isSameDay, toDateOnly } from "@/lib/date";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { events, isLoading: isEventsLoading } = useEvents();
  const { tasks, isLoading: isTasksLoading } = useTasks();
  const { transactions, isLoading: isFinanceLoading } = useFinance();

  const today = useMemo(() => new Date(), []);
  const todayLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const firstName =
    profile?.displayName?.trim()?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const todayEventCount = useMemo(() => {
    const seen = new Set<string>();
    return events
      .filter((e) => isSameDay(new Date(e.dateTimeStart), today))
      .filter((e) => {
        const k = `${e.title}|${e.dateTimeStart}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      }).length;
  }, [events, today]);

  const incompleteCount = useMemo(
    () => tasks.filter((t) => !t.completed).length,
    [tasks],
  );

  const todayKey = useMemo(() => toDateOnly(today), [today]);
  const currentMonth = todayKey.slice(0, 7);
  const netThisMonth = useMemo(() => {
    const monthTx = transactions.filter((tx) =>
      tx.date.startsWith(currentMonth),
    );
    const income = monthTx
      .filter((tx) => tx.type === "income")
      .reduce((s, tx) => s + tx.amount, 0);
    const expense = monthTx
      .filter((tx) => tx.type === "expense")
      .reduce((s, tx) => s + tx.amount, 0);
    return income - expense;
  }, [transactions, currentMonth]);

  const isStatsLoading =
    (isEventsLoading && events.length === 0) ||
    (isTasksLoading && tasks.length === 0) ||
    (isFinanceLoading && transactions.length === 0);

  useSetPageTitle("Dashboard", todayLabel);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold font-display leading-tight">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{todayLabel}</p>
      </div>

      {/* ── Briefing (mobile — shown before stats) ── */}
      <div className="lg:hidden">
        <AgentBriefingCard />
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="glass-card card-accent">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckSquare className="w-3.5 h-3.5" />
              <span className="text-xs">Open tasks</span>
            </div>
            {isStatsLoading ? (
              <SkeletonBlock className="h-6 w-12" />
            ) : (
              <p className="text-xl font-semibold">{incompleteCount}</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card card-accent">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs">Events today</span>
            </div>
            {isStatsLoading ? (
              <SkeletonBlock className="h-6 w-8" />
            ) : (
              <p className="text-xl font-semibold">{todayEventCount}</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card card-accent col-span-2 sm:col-span-1">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="w-3.5 h-3.5" />
              <span className="text-xs">Net this month</span>
            </div>
            {isStatsLoading ? (
              <SkeletonBlock className="h-6 w-20" />
            ) : (
              <p className="text-xl font-semibold">
                {formatCurrency(netThisMonth)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Main content: two columns on desktop, reordered single column on mobile ──
           Mobile order (via flex order): FlowAI → Today → Tasks → Finance → QuickActions → FocusPlaylist
           Desktop: left column (Briefing, Today, Tasks, Finance) | right column (FlowAI, QuickActions, FocusPlaylist) */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-4 lg:gap-6">
        {/* Left column — contents on mobile so children participate in flex ordering */}
        <div className="contents lg:block lg:space-y-4">
          <div className="hidden lg:block">
            <AgentBriefingCard />
          </div>
          <div className="order-2 lg:order-none">
            <TodayWidget />
          </div>
          <div className="order-3 lg:order-none">
            <TasksWidget />
          </div>
          <div className="order-4 lg:order-none">
            <FinanceWidget />
          </div>
        </div>

        {/* Right column (sidebar) */}
        <div className="contents lg:block lg:space-y-4">
          {/* Flow AI */}
          <div className="order-1 lg:order-none">
            <Card className="glass-card card-accent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Flow AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Your intelligent assistant
                </p>
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => navigate("/chat")}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat with Flow AI
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="order-5 lg:order-none">
            <Card className="glass-card card-accent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" disabled>
                    New Task
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    New Note
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    Add Habit
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    Record Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Focus Playlist */}
          <div className="order-6 lg:order-none">
            <Card className="glass-card card-accent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Focus Playlist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
