import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, CheckSquare, Users, Wallet, Sparkles } from "lucide-react";
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
  const todayEvents = useMemo(
    () =>
      events
        .filter((event) => isSameDay(new Date(event.dateTimeStart), today))
        .sort(
          (a, b) =>
            new Date(a.dateTimeStart).getTime() -
            new Date(b.dateTimeStart).getTime()
        )
        .slice(0, 5),
    [events, today]
  );

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

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl lg:text-3xl font-semibold mb-1">
          Dashboard
        </h1>
        <p className="text-muted-foreground">{todayLabel}</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
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

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
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
              variant="secondary"
              onClick={() => navigate("/learn-ai")}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
