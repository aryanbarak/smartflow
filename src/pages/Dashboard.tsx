import { useEffect, useMemo } from "react";
import { AgentBriefingCard } from "@/components/AgentBriefingCard";
import "@/components/AgentBriefingCard.css";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { Calendar, CheckSquare, Users, Wallet, Sparkles, RefreshCw } from "lucide-react";
import { useBriefing } from "@/features/briefing/useBriefing";
import { MoodWidget } from "@/features/mood/MoodWidget";
import { MoodCorrelationWidget } from "@/features/habits/components/MoodCorrelationWidget";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatePanel } from "@/components/common/StatePanel";
import {
  SkeletonBlock,
  SkeletonListItem,
  SkeletonSection,
} from "@/components/common/Skeletons";
import { useEvents } from "@/hooks/useEvents";
import { useTasks } from "@/hooks/useTasks";
import { useFinance } from "@/hooks/useFinance";
import { useFamily } from "@/hooks/useFamily";
import { useLearnAI } from "@/hooks/useLearnAI";
import { formatDateLabel, isBeforeDay, isSameDay, toDateOnly } from "@/lib/date";
import type { Child, ChildEvent, ChildScheduleItem } from "@/features/family/familyService";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayWeekdayName(): string {
  const today = new Date();
  const jsDay = today.getDay();
  const index = (jsDay + 6) % 7;
  return DAYS_OF_WEEK[index];
}

function getTodayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { events, isLoading: isEventsLoading } = useEvents();
  const { tasks, isLoading: isTasksLoading, error: tasksError } = useTasks();
  const {
    transactions,
    isLoading: isFinanceLoading,
    error: financeError,
  } = useFinance();
  const {
    children: familyChildren,
    isLoading: isFamilyLoading,
    error: familyError,
  } = useFamily();
  const {
    messages,
    isLoading: isLearnLoading,
    error: learnError,
    mode: learnMode,
    language: learnLanguage,
  } = useLearnAI();

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateOnly(today), [today]);
  const todayEvents = useMemo(() => {
    const seen = new Set<string>();
    return events
      .filter((event) => isSameDay(new Date(event.dateTimeStart), today))
      .filter((event) => {
        const key = `${event.title}|${event.dateTimeStart}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.dateTimeStart).getTime() -
          new Date(b.dateTimeStart).getTime()
      )
      .slice(0, 5);
  }, [events, today]);

  const incompleteCount = useMemo(
    () => tasks.filter((task) => !task.completed).length,
    [tasks]
  );

  const dueSoonTasks = useMemo(() => {
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + 7);
    return tasks
      .filter((task) => !task.completed && task.dueDate)
      .map((task) => ({
        task,
        due: parseDateOnly(task.dueDate!),
      }))
      .filter(({ due }) => !isBeforeDay(due, today) && due <= windowEnd)
      .sort((a, b) => a.due.getTime() - b.due.getTime())
      .slice(0, 5);
  }, [tasks, today]);

  const currentMonth = todayKey.slice(0, 7);
  const financeSummary = useMemo(() => {
    const monthTx = transactions.filter((tx) =>
      tx.date.startsWith(currentMonth)
    );
    const income = monthTx
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = monthTx
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);
    return {
      income,
      expense,
      net: income - expense,
      hasAny: monthTx.length > 0,
    };
  }, [transactions, currentMonth]);

  const familySummary = useMemo(() => {
    const todayWeekday = getTodayWeekdayName();
    const todayIso = getTodayIsoDate();
    return (familyChildren ?? []).slice(0, 3).map((child: Child) => {
      const scheduleItems = child.schedule ?? [];
      const eventsList = (child.events ?? []).filter(
        (event: ChildEvent) => !!event.date && !!event.title
      );
      const todaySchedule =
        scheduleItems.find(
          (item: ChildScheduleItem) =>
            item.day === todayWeekday && item.activity?.trim()
        ) ?? null;
      const nextEvent =
        eventsList
          .filter((event) => event.date >= todayIso)
          .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
      return { child, todaySchedule, nextEvent };
    });
  }, [familyChildren]);

  const lastUserQuestion = useMemo(() => {
    const users = messages.filter((msg) => msg.role === "user");
    return users[users.length - 1] ?? null;
  }, [messages]);

  const todayLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const isCalendarInitialLoading = isEventsLoading && events.length === 0;
  const isTasksInitialLoading = isTasksLoading && tasks.length === 0;
  const isFinanceInitialLoading =
    isFinanceLoading && transactions.length === 0;
  const isFamilyInitialLoading =
    isFamilyLoading && (familyChildren ?? []).length === 0;
  const isLearnInitialLoading = isLearnLoading && messages.length === 0;

  const { briefing: weeklyBriefing, isLoading: briefingLoading, generate: generateBriefing, loadFromCache } = useBriefing();
  useEffect(() => { loadFromCache(); }, [loadFromCache]);

  useSetPageTitle("Dashboard", todayLabel);

  return (
    <div className="px-6 pt-6 pb-6 lg:px-8 lg:pb-8 max-w-6xl mx-auto">
      <AgentBriefingCard />

      <Card className="mb-6 border-0 text-white hero-surface" style={{ border: "1px solid rgba(56,189,248,0.15)" }}>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold font-display leading-tight">
                {getGreeting()}.
              </h2>
              <p className="text-sm text-white/75 max-w-xl">
                Keep tasks, events, and money in one calm space. Focus on what
                matters most today.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
              <div className="rounded-xl bg-white/12 border border-white/15 px-4 py-3">
                <p className="text-xs text-white/70">Open tasks</p>
                <p className="text-lg font-semibold">{incompleteCount}</p>
              </div>
              <div className="rounded-xl bg-white/12 border border-white/15 px-4 py-3">
                <p className="text-xs text-white/70">Events today</p>
                <p className="text-lg font-semibold">{todayEvents.length}</p>
              </div>
              <div className="rounded-xl bg-white/12 border border-white/15 px-4 py-3 sm:col-auto col-span-2">
                <p className="text-xs text-white/70">Net this month</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(financeSummary.net)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card card-accent">
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80 sm:hidden">
              Overview
            </p>
            <CardTitle className="text-base sm:text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isCalendarInitialLoading ? (
              <SkeletonSection rows={2} />
            ) : todayEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No events today.</p>
            ) : (
              <ul className="space-y-2">
                {todayEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2"
                  >
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.dateTimeStart).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card card-accent">
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80 sm:hidden">
              Overview
            </p>
            <CardTitle className="text-base sm:text-sm font-semibold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {tasksError && !isTasksInitialLoading ? (
              <StatePanel
                variant="error"
                title="Tasks unavailable"
                description={tasksError}
              />
            ) : isTasksInitialLoading ? (
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonListItem />
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {incompleteCount} open task(s)
                </p>
                {dueSoonTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No tasks due.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {dueSoonTasks.map(({ task, due }) => (
                      <li
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2"
                      >
                        <span className="text-sm font-medium truncate">
                          {task.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isSameDay(due, today)
                            ? "Today"
                            : formatDateLabel(task.dueDate!)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card card-accent">
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80 sm:hidden">
              Overview
            </p>
            <CardTitle className="text-base sm:text-sm font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Finance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {financeError && !isFinanceInitialLoading ? (
              <StatePanel
                variant="error"
                title="Finance unavailable"
                description={financeError}
              />
            ) : isFinanceInitialLoading ? (
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-6 w-32" />
              </div>
            ) : !financeSummary.hasAny ? (
              <p className="text-xs text-muted-foreground">
                No transactions yet.
              </p>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Income</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(financeSummary.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Expenses</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(financeSummary.expense)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Net</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(financeSummary.net)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card card-accent lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Family
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {familyError && !isFamilyInitialLoading ? (
              <StatePanel
                variant="error"
                title="Family unavailable"
                description={familyError}
              />
            ) : isFamilyInitialLoading ? (
              <SkeletonSection rows={2} />
            ) : familySummary.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No kids added yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {familySummary.map(({ child, todaySchedule, nextEvent }) => (
                  <li
                    key={child.id}
                    className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{child.name}</span>
                      {typeof child.age === "number" && (
                        <span className="text-xs text-muted-foreground">
                          Age {child.age}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Today: </span>
                      {todaySchedule?.activity ?? "No specific activities"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Next event: </span>
                      {nextEvent
                        ? `${nextEvent.title} · ${nextEvent.date}`
                        : "No upcoming events"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card card-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Learn with AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {learnError && !isLearnInitialLoading ? (
              <StatePanel
                variant="error"
                title="Learn AI unavailable"
                description={learnError}
              />
            ) : isLearnInitialLoading ? (
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-4 w-24" />
              </div>
            ) : lastUserQuestion ? (
              <>
                <p className="text-sm font-medium line-clamp-2">
                  {lastUserQuestion.content}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{learnMode}</Badge>
                  <Badge variant="outline">{learnLanguage.toUpperCase()}</Badge>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ask your first question.
              </p>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="border-0 text-white hover:text-white hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #38BDF8, #818CF8)" }}
              onClick={() => navigate("/learn-ai")}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
        <div className="md:col-span-2 lg:col-span-3">
          <MoodWidget />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <MoodCorrelationWidget />
        </div>

        {/* Weekly Briefing widget */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Weekly Briefing
              </CardTitle>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void generateBriefing(true)}
                  disabled={briefingLoading}
                  className="text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${briefingLoading ? 'animate-spin' : ''}`} />
                  {briefingLoading ? 'Generating…' : 'Refresh'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/briefing')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View full →
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {briefingLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <div className="w-4 h-4 rounded-full border border-cyan-500 border-t-transparent animate-spin" />
                Analyzing your week…
              </div>
            )}
            {weeklyBriefing && !briefingLoading && (
              <div className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {weeklyBriefing.replace(/#{1,3} .+?\n/g, '').replace(/\*\*/g, '').slice(0, 280)}…
                <button
                  type="button"
                  onClick={() => navigate('/briefing')}
                  className="text-cyan-400 hover:text-cyan-300 ml-1 transition-colors"
                >
                  read more
                </button>
              </div>
            )}
            {!weeklyBriefing && !briefingLoading && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">No briefing yet.</p>
                <button
                  type="button"
                  onClick={() => void generateBriefing()}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Generate →
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
