import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Flame,
  MessageSquare,
  Music,
  Pause,
  Play,
  Plus,
  Wallet,
} from "lucide-react";
import { AddHabitModal } from "@/features/habits/components/AddHabitModal";
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
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonBlock } from "@/components/common/Skeletons";
import { isSameDay, toDateOnly } from "@/lib/date";
import { useMusicPlayer, loadHistory } from "@/hooks/useMusicPlayer";

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

function Sparkline({
  data,
  gradientId,
}: Readonly<{ data: { value: number }[]; gradientId: string }>) {
  if (data.length < 2) return null;
  return (
    <div className="h-10 mt-1.5 -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function FocusPlaylistCard() {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, pause, resume, playYouTube } =
    useMusicPlayer();
  const lastPlayed = useMemo(() => loadHistory()[0] ?? null, []);

  const isYouTube = currentTrack?.type === "youtube";
  const trackTitle = currentTrack
    ? currentTrack.type === "youtube"
      ? currentTrack.title
      : currentTrack.name
    : null;
  const videoId = isYouTube ? currentTrack.videoId : null;
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : null;

  return (
    <Card className="glass-card card-accent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="icon-tile w-7 h-7 rounded-md">
            <Music className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold">Focus Playlist</p>
        </div>

        {currentTrack ? (
          <div className="flex items-center gap-3">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt=""
                className="w-12 h-12 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="icon-tile w-12 h-12 rounded-md">
                <Music className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{trackTitle}</p>
              <p className="text-[10px] text-muted-foreground">
                {isPlaying ? "Now playing" : "Paused"}
              </p>
            </div>
            <button
              type="button"
              aria-label={isPlaying ? "Pause" : "Resume"}
              onClick={isPlaying ? pause : resume}
              className="icon-tile w-8 h-8 rounded-full shrink-0 hover:bg-primary/20 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-primary" />
              ) : (
                <Play className="w-4 h-4 text-primary ml-0.5" />
              )}
            </button>
          </div>
        ) : lastPlayed ? (
          <div className="flex items-center gap-3">
            <img
              src={`https://img.youtube.com/vi/${lastPlayed.videoId}/mqdefault.jpg`}
              alt=""
              className="w-12 h-12 rounded-md object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">
                {lastPlayed.title}
              </p>
              <p className="text-[10px] text-muted-foreground">Last played</p>
            </div>
            <button
              type="button"
              aria-label="Play"
              onClick={() =>
                playYouTube(lastPlayed.videoId, lastPlayed.title)
              }
              className="icon-tile w-8 h-8 rounded-full shrink-0 hover:bg-primary/20 transition-colors"
            >
              <Play className="w-4 h-4 text-primary ml-0.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              No recent tracks
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2"
              onClick={() => navigate("/music")}
            >
              <Music className="w-3.5 h-3.5" />
              Browse Music
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [showAddHabit, setShowAddHabit] = useState(false);
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

  const dailyNetData = useMemo(() => {
    const monthTx = transactions
      .filter((tx) => tx.date.startsWith(currentMonth))
      .sort((a, b) => a.date.localeCompare(b.date));

    const byDate = new Map<string, number>();
    for (const tx of monthTx) {
      const delta = tx.type === "income" ? tx.amount : -tx.amount;
      byDate.set(tx.date, (byDate.get(tx.date) ?? 0) + delta);
    }

    let cumulative = 0;
    return Array.from(byDate.entries()).map(([date, delta]) => {
      cumulative += delta;
      return { date: date.slice(8), value: cumulative };
    });
  }, [transactions, currentMonth]);

  const eventsPerDay = useMemo(() => {
    const result: { date: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const count = events.filter((e) =>
        isSameDay(new Date(e.dateTimeStart), d),
      ).length;
      result.push({
        date: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        value: count,
      });
    }
    return result;
  }, [events, today]);

  const createdThisWeek = useMemo(() => {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return tasks.filter((t) => new Date(t.createdAt) >= weekAgo).length;
  }, [tasks, today]);

  const hasEventData = eventsPerDay.some((d) => d.value > 0);

  const isStatsLoading =
    (isEventsLoading && events.length === 0) ||
    (isTasksLoading && tasks.length === 0) ||
    (isFinanceLoading && transactions.length === 0);

  useSetPageTitle("Dashboard", todayLabel);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold font-display leading-tight">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{todayLabel}</p>
      </div>

      {/* ── Briefing (mobile — shown before stats) ── */}
      <div className="lg:hidden rounded-2xl shadow-elevated">
        <AgentBriefingCard />
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Open tasks — no sparkline, secondary stat instead */}
        <Card className="glass-card card-accent surface-elevated">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="icon-tile w-8 h-8 rounded-md">
                <CheckSquare className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Open tasks
              </span>
            </div>
            {isStatsLoading ? (
              <SkeletonBlock className="h-7 w-12" />
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight">
                  {incompleteCount}
                </p>
                <div className="h-10 flex items-end">
                  <p className="text-[11px] text-muted-foreground">
                    {createdThisWeek} created this week
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Events today — 7-day sparkline */}
        <Card className="glass-card card-accent surface-elevated">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="icon-tile w-8 h-8 rounded-md">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Events today
              </span>
            </div>
            {isStatsLoading ? (
              <SkeletonBlock className="h-7 w-8" />
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight">
                  {todayEventCount}
                </p>
                {hasEventData ? (
                  <Sparkline
                    data={eventsPerDay}
                    gradientId="sparkline-events"
                  />
                ) : (
                  <div className="h-10 flex items-end">
                    <p className="text-[11px] text-muted-foreground">
                      No events this week
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Net this month — running balance sparkline */}
        <Card className="glass-card card-accent surface-elevated col-span-2 sm:col-span-1">
          <CardContent className="p-3.5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="icon-tile w-8 h-8 rounded-md">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Net this month
              </span>
            </div>
            {isStatsLoading ? (
              <SkeletonBlock className="h-7 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight">
                  {formatCurrency(netThisMonth)}
                </p>
                {dailyNetData.length >= 2 ? (
                  <Sparkline
                    data={dailyNetData}
                    gradientId="sparkline-finance"
                  />
                ) : (
                  <div className="h-10 flex items-end">
                    <p className="text-[11px] text-muted-foreground">
                      {dailyNetData.length === 0
                        ? "No transactions yet"
                        : "1 transaction day"}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Main content: two columns on desktop, reordered single column on mobile ── */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_340px] gap-4 lg:gap-5">
        {/* Left column */}
        <div className="contents lg:block lg:space-y-4">
          <div className="hidden lg:block rounded-2xl shadow-elevated">
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
          {/* Flow AI — featured assistant card */}
          <div className="order-1 lg:order-none">
            <Card className="glass-card card-accent surface-elevated">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="icon-tile">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Flow AI</p>
                    <p className="text-xs text-muted-foreground">
                      Your intelligent assistant
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full gap-2 text-white border-0"
                  style={{ background: "var(--gradient-primary)" }}
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
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="icon-tile w-7 h-7 rounded-md">
                    <Plus className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">Quick Actions</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/tasks")}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/20 p-3 text-foreground transition-colors hover:bg-secondary/40 hover:border-primary/30"
                  >
                    <div className="icon-tile w-7 h-7 rounded-md">
                      <CheckSquare className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-[11px] font-medium">New Task</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/journal")}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/20 p-3 text-foreground transition-colors hover:bg-secondary/40 hover:border-primary/30"
                  >
                    <div className="icon-tile w-7 h-7 rounded-md">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-[11px] font-medium">Journal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddHabit(true)}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/20 p-3 text-foreground transition-colors hover:bg-secondary/40 hover:border-primary/30"
                  >
                    <div className="icon-tile w-7 h-7 rounded-md">
                      <Flame className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-[11px] font-medium">Add Habit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/finance")}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/20 p-3 text-foreground transition-colors hover:bg-secondary/40 hover:border-primary/30"
                  >
                    <div className="icon-tile w-7 h-7 rounded-md">
                      <Wallet className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-[11px] font-medium">
                      Record Expense
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
            {showAddHabit && (
              <AddHabitModal onClose={() => setShowAddHabit(false)} />
            )}
          </div>

          {/* Focus Playlist — live player widget */}
          <div className="order-6 lg:order-none">
            <FocusPlaylistCard />
          </div>
        </div>
      </div>
    </div>
  );
}
