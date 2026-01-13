import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, CheckSquare, Wallet, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTasks } from "@/hooks/useTasks";
import { useEvents } from "@/hooks/useEvents";
import { useFinance } from "@/hooks/useFinance";
import { useFamily } from "@/hooks/useFamily";
import type {
  Child,
  ChildEvent,
  ChildScheduleItem,
} from "@/features/family/familyService";
import { isBeforeDay, isSameDay, toDateOnly } from "@/lib/date";

const categories = ["Food", "Transport", "Rent", "Health", "Other"];
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
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const { tasks, addTask } = useTasks();
  const { events, addEvent } = useEvents();
  const { transactions, addTransaction } = useFinance();
  const {
    children: familyChildren,
    isLoading: isFamilyLoading,
    error: familyError,
  } = useFamily();

  const [taskOpen, setTaskOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventTime, setEventTime] = useState("09:00");
  const [eventNotes, setEventNotes] = useState("");
  const [eventError, setEventError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [financeError, setFinanceError] = useState<string | null>(null);

  const today = new Date();
  const todayKey = toDateOnly(today);
  const currentMonth = todayKey.slice(0, 7);

  const taskSummary = useMemo(() => {
    const dueToday = tasks.filter(
      (task) => task.dueDate && !task.completed && isSameDay(parseDateOnly(task.dueDate), today),
    ).length;
    const overdue = tasks.filter(
      (task) => task.dueDate && !task.completed && isBeforeDay(parseDateOnly(task.dueDate), today),
    ).length;
    return { dueToday, overdue };
  }, [tasks, today]);

  const nextEvent = useMemo(() => {
    const upcoming = events
      .filter((event) => new Date(event.dateTimeStart) >= today)
      .sort((a, b) => new Date(a.dateTimeStart).getTime() - new Date(b.dateTimeStart).getTime());
    return upcoming[0];
  }, [events, today]);

  const financeSummary = useMemo(() => {
    const todaySpend = transactions
      .filter((tx) => tx.type === "expense" && tx.date === todayKey)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const monthSpend = transactions
      .filter((tx) => tx.type === "expense" && tx.date.startsWith(currentMonth))
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { todaySpend, monthSpend };
  }, [transactions, todayKey, currentMonth]);

  const familySummary = useMemo(() => {
    const todayWeekday = getTodayWeekdayName();
    const todayIso = getTodayIsoDate();

    return (familyChildren ?? []).map((child: Child) => {
      const scheduleItems = child.schedule ?? [];
      const eventsList = (child.events ?? []).filter(
        (event: ChildEvent) => !!event.date && !!event.title
      );

      const todaySchedule =
        scheduleItems.find(
          (item: ChildScheduleItem) =>
            item.day === todayWeekday && item.activity?.trim()
        ) ?? null;

      const upcomingEvents = eventsList
        .filter((event) => event.date >= todayIso)
        .sort((a, b) => a.date.localeCompare(b.date));

      const nextEvent = upcomingEvents[0] ?? null;

      return {
        child,
        todaySchedule,
        nextEvent,
      };
    });
  }, [familyChildren]);

  const handleAddTask = () => {
    if (!taskTitle.trim()) {
      setTaskError("Task title is required.");
      return;
    }
    addTask({ title: taskTitle.trim(), notes: taskNotes, dueDate: taskDue || undefined });
    setTaskTitle("");
    setTaskNotes("");
    setTaskDue("");
    setTaskError(null);
    setTaskOpen(false);
  };

  const handleAddEvent = () => {
    if (!eventTitle.trim()) {
      setEventError("Event title is required.");
      return;
    }
    addEvent({
      title: eventTitle.trim(),
      dateTimeStart: new Date(`${eventDate}T${eventTime}:00`).toISOString(),
      notes: eventNotes,
    });
    setEventTitle("");
    setEventNotes("");
    setEventError(null);
    setEventOpen(false);
  };

  const handleAddExpense = () => {
    const numericAmount = Number(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setFinanceError("Amount must be a positive number.");
      return;
    }
    addTransaction({ type: "expense", amount: numericAmount, category, date, notes });
    setAmount("");
    setNotes("");
    setFinanceError(null);
    setFinanceOpen(false);
  };

  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">{todayLabel}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-3 mb-8">
        <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-glow">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Add Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {taskError && (
                <Alert variant="destructive">
                  <AlertDescription>{taskError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={taskNotes} onChange={(event) => setTaskNotes(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={taskDue} onChange={(event) => setTaskDue(event.target.value)} />
              </div>
              <Button className="w-full" onClick={handleAddTask}>
                Save Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={eventOpen} onOpenChange={setEventOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="gap-2">
              <Calendar className="w-4 h-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Add Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {eventError && (
                <Alert variant="destructive">
                  <AlertDescription>{eventError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={eventNotes} onChange={(event) => setEventNotes(event.target.value)} />
              </div>
              <Button className="w-full" onClick={handleAddEvent}>
                Save Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={financeOpen} onOpenChange={setFinanceOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="gap-2">
              <Wallet className="w-4 h-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {financeError && (
                <Alert variant="destructive">
                  <AlertDescription>{financeError}</AlertDescription>
                </Alert>
              )}
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
                <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
              <Button className="w-full" onClick={handleAddExpense}>
                Save Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              Tasks Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{taskSummary.dueToday}</p>
            <p className="text-sm text-muted-foreground">Due today</p>
            <p className="text-sm text-muted-foreground">{taskSummary.overdue} overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Next Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nextEvent ? (
              <>
                <p className="text-sm font-medium">{nextEvent.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(nextEvent.dateTimeStart).toLocaleString()}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Finance Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">${formatCurrency(financeSummary.todaySpend)}</p>
            <p className="text-sm text-muted-foreground">Spent today</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              ${formatCurrency(financeSummary.monthSpend)} this month
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-2">
          <CardHeader className="pb-2 flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Family – Today & upcoming
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isFamilyLoading && (
              <p className="text-xs text-muted-foreground">Loading family data…</p>
            )}

            {familyError && !isFamilyLoading && (
              <p className="text-xs text-destructive">
                Could not load family data.
              </p>
            )}

            {!isFamilyLoading && !familyError && (familySummary.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No kids added yet. You can create child profiles in the Family section.
              </p>
            ) : (
              <ul className="space-y-2">
                {familySummary.map(({ child, todaySchedule, nextEvent }) => (
                  <li
                    key={child.id}
                    className="flex flex-col gap-1 rounded-lg bg-secondary/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{child.name}</span>
                      {typeof child.age === "number" && (
                        <span className="text-[11px] text-muted-foreground">
                          Age {child.age}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      <span className="font-semibold">Today: </span>
                      {todaySchedule ? (
                        <span>{todaySchedule.activity}</span>
                      ) : (
                        <span>No specific activities</span>
                      )}
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      <span className="font-semibold">Next event: </span>
                      {nextEvent ? (
                        <span>
                          {nextEvent.title} · {nextEvent.date}
                          {nextEvent.calendarEventId && (
                            <span className="ml-1 uppercase tracking-wide text-[10px]">
                              (in calendar)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>No upcoming events</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
