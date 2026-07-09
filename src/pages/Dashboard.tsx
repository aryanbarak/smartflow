import { useMemo, useState } from "react";
import {
  WorkspaceReveal,
  WorkspaceRevealSection,
} from "@/components/animations/WorkspaceReveal";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Briefcase,
  Calendar,
  CheckSquare,
  FileText,
  Flame,
  MessageSquare,
  Music,
  Pause,
  Play,
  Plus,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AddHabitModal } from "@/features/habits/components/AddHabitModal";
import { AgentBriefingCard } from "@/components/AgentBriefingCard";
import "@/components/AgentBriefingCard.css";
import { FlowAIOrb } from "@/components/FlowAIOrb";
import { SmartflowAsciiSphere } from "@/components/smartflow";
import { SmartAcademyWidget } from "@/components/dashboard/SmartAcademyWidget";
import { TodaysFocusWidget } from "@/components/dashboard/TodaysFocusWidget";
import { AiInsightsWidget } from "@/components/dashboard/AiInsightsWidget";
import { RecommendedTopicsWidget } from "@/components/dashboard/RecommendedTopicsWidget";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { useEvents } from "@/hooks/useEvents";
import { useTasks } from "@/hooks/useTasks";
import { useFinance } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonBlock } from "@/components/common/Skeletons";
import { isSameDay, toDateOnly } from "@/lib/date";
import { useMusicPlayer, loadHistory } from "@/hooks/useMusicPlayer";

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
    <Card className="glass-card">
      <CardContent className="p-3 space-y-3">
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

function FlowAIAssistantRail({ lowData = false }: Readonly<{ lowData?: boolean }>) {
  const navigate = useNavigate();
  const prompts = [
    { label: "Plan my day", prompt: "Help me plan my day" },
    { label: "Continue learning", prompt: "Help me continue learning today" },
    { label: "Review documents", prompt: "Help me review my recent documents" },
    { label: "Analyze habits", prompt: "Analyze my habits and give me insights" },
  ];

  return (
    <Card className="glass-card relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-[300px] w-[300px] opacity-30"
      >
        <SmartflowAsciiSphere />
      </div>

      <CardContent className="relative z-10 space-y-4 p-4">
        <div className="flex min-h-[104px] items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-visible">
              <FlowAIOrb
                size="md"
                state="presence"
                beam={false}
                particles
                glowIntensity={0.9}
                theme="transparent"
                ariaLabel="Flow AI active assistant"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Flow AI</p>
              <p className="text-xs leading-5 text-muted-foreground">
                {lowData
                  ? "Add a few signals and I\u2019ll start preparing your day."
                  : "I prepared today's workspace."}
              </p>
            </div>
          </div>

        <div className="space-y-2">
            {prompts.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() =>
                  navigate("/chat", {
                    state: { initialPrompt: item.prompt },
                  })
                }
                className="w-full rounded-lg border border-border/35 bg-background/20 px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-primary/10"
              >
                {item.label}
              </button>
            ))}
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
  );
}

function WelcomeWorkspace() {
  const navigate = useNavigate();
  const setupActions = [
    {
      label: "Add your first task",
      description: "Tell SmartFlow what needs attention.",
      icon: CheckSquare,
      onClick: () => navigate("/tasks"),
    },
    {
      label: "Review calendar",
      description: "Give Flow AI a sense of your available time.",
      icon: Calendar,
      onClick: () => navigate("/calendar"),
    },
    {
      label: "Upload a document",
      description: "Add context Flow AI can help you organize.",
      icon: FileText,
      onClick: () => navigate("/documents"),
    },
    {
      label: "Continue Smart Academy",
      description: "Start a learning signal for recommendations.",
      icon: BookOpen,
      onClick: () => navigate("/learn-ai"),
    },
    {
      label: "Record your first expense",
      description: "Create the first monthly finance signal.",
      icon: Wallet,
      onClick: () => navigate("/finance"),
    },
    {
      label: "Chat with Flow AI",
      description: "Tell Flow AI what you want SmartFlow to become.",
      icon: MessageSquare,
      onClick: () =>
        navigate("/chat", {
          state: {
            initialPrompt:
              "Help me set up SmartFlow. Ask me what I want this workspace to help me with.",
          },
        }),
    },
  ];

  const learningSignals = [
    "Tasks tell me what matters.",
    "Calendar tells me available time.",
    "Documents give context.",
    "Finance gives monthly signals.",
    "Learning activity guides recommendations.",
  ];

  return (
    <>
      <WorkspaceRevealSection order={0}>
        <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-card/35 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{
              background:
                "radial-gradient(ellipse 46% 34% at 50% 0%, rgba(196,184,255,0.13), transparent 72%), radial-gradient(ellipse 32% 22% at 12% 12%, rgba(34,211,238,0.055), transparent 74%)",
            }}
          />
          <div className="relative z-10 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/75">
              Welcome Workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.8rem]">
              Welcome to SmartFlow.
            </h1>
            <p className="mt-3 text-base leading-7 text-foreground/90">
              I&apos;m still learning how you work.
            </p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              Add a few signals and I&apos;ll start preparing your workspace.
            </p>
          </div>
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={1}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Setup Signals
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Start with these</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {setupActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="group flex min-h-[104px] flex-col rounded-xl border border-border/35 bg-background/25 p-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/10"
              >
                <action.icon className="h-4 w-4 text-primary" />
                <span className="mt-3 text-sm font-semibold">{action.label}</span>
                <span className="mt-1 text-xs leading-5 text-muted-foreground">
                  {action.description}
                </span>
              </button>
            ))}
          </div>
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={2}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              What I need to learn
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">The signals that shape your workspace</h2>
          </div>
          <div className="rounded-xl border border-border/25 bg-background/15 p-4 backdrop-blur-sm">
            <ul className="grid gap-2 text-sm text-foreground/90 sm:grid-cols-2">
              {learningSignals.map((item) => (
                <li key={item} className="flex gap-2 rounded-lg border border-border/25 bg-secondary/[0.06] px-3 py-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span className="leading-5">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </WorkspaceRevealSection>
    </>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showDailyStoryDetails, setShowDailyStoryDetails] = useState(false);
  const { events, isLoading: isEventsLoading } = useEvents();
  const { tasks, isLoading: isTasksLoading } = useTasks();
  const { transactions, isLoading: isFinanceLoading } = useFinance();

  const today = useMemo(() => new Date(), []);
  const todayLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";
    return "Still here";
  }, [today]);

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
  const totalSignals = tasks.length + events.length + transactions.length;
  const isLowDataWorkspace = !isStatsLoading && totalSignals < 5;

  const dailyStoryBullets = useMemo(
    () => [
      `${incompleteCount} open task${incompleteCount === 1 ? "" : "s"} need attention today.`,
      todayEventCount > 0
        ? `${todayEventCount} calendar event${todayEventCount === 1 ? "" : "s"} may shape your available focus time.`
        : "Your calendar looks open enough for deeper work.",
      `This month is currently at ${formatCurrency(netThisMonth)} net.`,
      createdThisWeek > 0
        ? `${createdThisWeek} task${createdThisWeek === 1 ? "" : "s"} were created this week, so start with the active list.`
        : "No new tasks were added this week, so review what is already in motion.",
    ],
    [createdThisWeek, incompleteCount, netThisMonth, todayEventCount],
  );
  const flowAISkills = [
    {
      title: "Plan My Day",
      description: "Optimize today's schedule.",
      icon: Calendar,
      onClick: () =>
        navigate("/chat", {
          state: { initialPrompt: "Help me plan my day and choose what to do first." },
        }),
    },
    {
      title: "Study With Me",
      description: "Focus and learning support.",
      icon: BookOpen,
      onClick: () => navigate("/learn-ai"),
    },
    {
      title: "Analyze My Habits",
      description: "Understand your routines.",
      icon: Flame,
      onClick: () =>
        navigate("/chat", {
          state: { initialPrompt: "Analyze my habits and give me insights on my routines." },
        }),
    },
    {
      title: "Review Finances",
      description: "Review spending patterns.",
      icon: Wallet,
      onClick: () => navigate("/finance"),
    },
    {
      title: "Weekly Briefing",
      description: "AI-generated summaries.",
      icon: FileText,
      onClick: () => navigate("/briefing/weekly"),
    },
    {
      title: "Career Assistant",
      description: "Jobs, CV and interview help.",
      icon: Briefcase,
      onClick: () =>
        navigate("/chat", {
          state: {
            initialPrompt: "Help me with my career: jobs, CV, applications, and interview preparation.",
          },
        }),
    },
  ];

  useSetPageTitle("Dashboard", todayLabel);

  return (
    <WorkspaceReveal className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 pt-5 lg:pt-6 pb-8 space-y-7 [&_.glass-card]:!bg-card/45 [&_.glass-card]:!border-primary/10 [&_.card-accent]:before:!opacity-25">
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-7">
          {isLowDataWorkspace ? (
            <WelcomeWorkspace />
          ) : (
            <>
      <WorkspaceRevealSection order={0}>
        <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-card/35 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{
              background:
                "radial-gradient(ellipse 46% 34% at 50% 0%, rgba(196,184,255,0.13), transparent 72%), radial-gradient(ellipse 32% 22% at 12% 12%, rgba(34,211,238,0.055), transparent 74%)",
            }}
          />

          <div className="relative z-10 flex flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/75">
              {todayLabel}
            </p>
            <h1 className="mt-1.5 max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
              {greeting}. I prepared today&apos;s workspace.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Start with the next steps I surfaced, then review the reasoning behind them.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  How I can help today
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {flowAISkills.map((skill) => (
                  <button
                    key={skill.title}
                    type="button"
                    onClick={skill.onClick}
                    className="group flex min-h-[92px] items-start gap-3 rounded-xl border border-border/35 bg-background/25 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/10 hover:shadow-[0_0_24px_rgba(139,92,246,0.12)]"
                  >
                    <div className="icon-tile h-9 w-9 rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <skill.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-5">{skill.title}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {skill.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border/25 bg-secondary/[0.07] px-3 py-2.5 text-left sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Today&apos;s Signals
              </p>
              {isStatsLoading ? (
                <div className="flex flex-wrap gap-3">
                  <SkeletonBlock className="h-4 w-16" />
                  <SkeletonBlock className="h-4 w-16" />
                  <SkeletonBlock className="h-4 w-20" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    <span className="text-foreground">{incompleteCount}</span> Tasks
                  </span>
                  <span>
                    <span className="text-foreground">{todayEventCount}</span> Events
                  </span>
                  <span>
                    <span className="text-foreground">€{formatCurrency(netThisMonth)}</span> Net
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={1}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              My Suggested Actions
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">I surfaced these next</h2>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/[0.025] p-2.5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => navigate("/tasks")}
                className="group flex min-h-[86px] flex-col rounded-xl border border-border/35 bg-background/25 p-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/10"
              >
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="mt-2.5 text-sm font-semibold">Finish active tasks</span>
                <span className="mt-1 text-xs leading-5 text-muted-foreground">
                  Because {incompleteCount} item{incompleteCount === 1 ? "" : "s"} still need attention.
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/calendar")}
                className="group flex min-h-[86px] flex-col rounded-xl border border-border/35 bg-background/25 p-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/10"
              >
                <Calendar className="h-4 w-4 text-primary" />
                <span className="mt-2.5 text-sm font-semibold">Review calendar</span>
                <span className="mt-1 text-xs leading-5 text-muted-foreground">
                  Because today has {todayEventCount} scheduled event{todayEventCount === 1 ? "" : "s"}.
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/learn-ai")}
                className="group flex min-h-[86px] flex-col rounded-xl border border-border/35 bg-background/25 p-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/10"
              >
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="mt-2.5 text-sm font-semibold">Continue Smart Academy</span>
                <span className="mt-1 text-xs leading-5 text-muted-foreground">
                  Because a short focused session keeps learning in motion.
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/finance")}
                className="group flex min-h-[86px] flex-col rounded-xl border border-border/35 bg-background/25 p-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/10"
              >
                <Wallet className="h-4 w-4 text-primary" />
                <span className="mt-2.5 text-sm font-semibold">Review budget</span>
                <span className="mt-1 text-xs leading-5 text-muted-foreground">
                  Because your monthly net is part of today&apos;s workspace signal.
                </span>
              </button>
            </div>
          </div>
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={2}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              AI Reasoning
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Why these matter today</h2>
          </div>

          <div className="rounded-xl border border-border/25 bg-background/15 p-3 text-left backdrop-blur-sm sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  AI Reasoning
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDailyStoryDetails((value) => !value)}
                className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                {showDailyStoryDetails ? "Show less" : "Read full briefing"}
              </button>
            </div>

            <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-foreground/90 sm:grid-cols-2">
              {dailyStoryBullets.map((item) => (
                <li key={item} className="flex gap-2 border-t border-border/30 py-2 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span className="leading-5">{item}</span>
                </li>
              ))}
            </ul>

            {showDailyStoryDetails && (
              <div className="mt-4 border-t border-border/50 pt-4 [&_.agent-briefing-card]:!bg-transparent [&_.agent-briefing-card]:!border-0 [&_.agent-briefing-card]:!p-0 [&_.agent-briefing-card]:!m-0 [&_.agent-briefing-card]:!rounded-none">
                <AgentBriefingCard />
              </div>
            )}
          </div>
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={3}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              What needs attention
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Today&apos;s focus</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
            <TodaysFocusWidget />
            <AiInsightsWidget />
          </div>
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={4}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Continue Learning
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Selected for your current momentum</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Continue from the Smart Academy path already waiting in your workspace.
            </p>
          </div>
          <SmartAcademyWidget />
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={5}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recommended Today
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Because I noticed...</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <p className="flex-1 rounded-lg border border-border/35 bg-secondary/10 px-3 py-2 text-xs leading-5 text-muted-foreground">
              <span className="font-medium text-foreground">Your task load is visible.</span>{" "}
              {incompleteCount} open item{incompleteCount === 1 ? "" : "s"} make focus selection useful today.
            </p>
            <p className="flex-1 rounded-lg border border-border/35 bg-secondary/10 px-3 py-2 text-xs leading-5 text-muted-foreground">
              <span className="font-medium text-foreground">Your calendar signal is clear.</span>{" "}
              {todayEventCount === 0
                ? "No events today leaves room for deeper work."
                : `${todayEventCount} event${todayEventCount === 1 ? "" : "s"} may shape your available time.`}
            </p>
            <p className="flex-1 rounded-lg border border-border/35 bg-secondary/10 px-3 py-2 text-xs leading-5 text-muted-foreground">
              <span className="font-medium text-foreground">New work appeared this week.</span>{" "}
              {createdThisWeek === 0
                ? "No new tasks were added, so continuing existing work is enough."
                : `${createdThisWeek} task${createdThisWeek === 1 ? "" : "s"} were created recently.`}
            </p>
          </div>
          <RecommendedTopicsWidget />
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={6}>
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-4">
          <Card className="glass-card">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="icon-tile w-7 h-7 rounded-md">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Manual Actions</p>
                  <p className="text-xs text-muted-foreground">Still available when you need a direct shortcut.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => navigate("/tasks")}
                  className="flex items-center gap-2 rounded-lg border border-border/45 bg-secondary/15 px-3 py-2.5 text-left text-foreground transition-colors hover:bg-secondary/35 hover:border-primary/30"
                >
                  <div className="icon-tile w-6 h-6 rounded-md bg-violet-500/15">
                    <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <span className="text-[11px] font-medium">New Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/journal")}
                  className="flex items-center gap-2 rounded-lg border border-border/45 bg-secondary/15 px-3 py-2.5 text-left text-foreground transition-colors hover:bg-secondary/35 hover:border-primary/30"
                >
                  <div className="icon-tile w-6 h-6 rounded-md bg-blue-500/15">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-[11px] font-medium">Journal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddHabit(true)}
                  className="flex items-center gap-2 rounded-lg border border-border/45 bg-secondary/15 px-3 py-2.5 text-left text-foreground transition-colors hover:bg-secondary/35 hover:border-primary/30"
                >
                  <div className="icon-tile w-6 h-6 rounded-md bg-orange-500/15">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <span className="text-[11px] font-medium">Add Habit</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/finance")}
                  className="flex items-center gap-2 rounded-lg border border-border/45 bg-secondary/15 px-3 py-2.5 text-left text-foreground transition-colors hover:bg-secondary/35 hover:border-primary/30"
                >
                  <div className="icon-tile w-6 h-6 rounded-md bg-emerald-500/15">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-medium">Record Expense</span>
                </button>
              </div>
            </CardContent>
          </Card>
          <FocusPlaylistCard />
          {showAddHabit && (
            <AddHabitModal onClose={() => setShowAddHabit(false)} />
          )}
        </section>
      </WorkspaceRevealSection>
            </>
          )}
        </div>

        <WorkspaceRevealSection order={2} className="lg:sticky lg:top-6">
          <FlowAIAssistantRail lowData={isLowDataWorkspace} />
        </WorkspaceRevealSection>
      </div>
    </WorkspaceReveal>
  );
}
