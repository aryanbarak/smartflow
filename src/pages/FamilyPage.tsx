// src/pages/FamilyPage.tsx

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, FileText, Edit2, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatePanel } from "@/components/common/StatePanel";
import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonListItem,
  SkeletonSection,
} from "@/components/common/Skeletons";
import { Checkbox } from "@/components/ui/checkbox";
import { useFamily } from "@/hooks/useFamily";
import {
  Child,
  ChildScheduleItem,
  ChildEvent,
} from "@/features/family/familyService";
import { ShoppingList } from "@/features/shopping/ShoppingList";
import {
  createCalendarEventFromFamily,
  deleteCalendarEventById,
} from "@/features/calendar/calendarService";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const defaultColors = ["bg-pink-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500"];
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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

export default function FamilyPage() {
  const { children, isLoading, error, addChild, updateChild, removeChild } =
    useFamily();

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state for Add Child (v1: ÙÙ‚Ø· Ù¾Ø±ÙˆÙØ§ÛŒÙ„ Ø³Ø§Ø¯Ù‡)
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [color, setColor] = useState<string>(defaultColors[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<Record<string, string>>({});
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const hasChildren = children.length > 0;

  const selectedChild: Child | null = useMemo(() => {
    if (!hasChildren) return null;
    if (selectedChildId) {
      return children.find((c) => c.id === selectedChildId) ?? children[0];
    }
    return children[0];
  }, [children, hasChildren, selectedChildId]);

  const todaySummary = useMemo(() => {
    if (!selectedChild) {
      return {
        todaySchedule: null as ChildScheduleItem | null,
        todayEvents: [] as ChildEvent[],
        upcomingEvents: [] as ChildEvent[],
      };
    }

    const todayWeekday = getTodayWeekdayName();
    const todayIso = getTodayIsoDate();

    const todaySchedule =
      (selectedChild.schedule ?? []).find(
        (item) => item.day === todayWeekday && item.activity?.trim()
      ) ?? null;

    const allEvents = (selectedChild.events ?? []).filter(
      (event) => !!event.date && !!event.title
    );

    const todayEvents = allEvents.filter((event) => event.date === todayIso);

    const upcomingEvents = allEvents
      .filter((event) => event.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);

    return { todaySchedule, todayEvents, upcomingEvents };
  }, [selectedChild]);

  // When list changes, ensure selectedChildId always valid
  useEffect(() => {
    if (!hasChildren) {
      setSelectedChildId(null);
      return;
    }
    if (!selectedChildId || !children.some((c) => c.id === selectedChildId)) {
      setSelectedChildId(children[0].id);
    }
  }, [children, hasChildren, selectedChildId]);

  useEffect(() => {
    if (!selectedChild) {
      setScheduleDraft({});
      return;
    }
    const draft: Record<string, string> = {};
    DAYS_OF_WEEK.forEach((day) => {
      draft[day] = "";
    });
    (selectedChild.schedule ?? []).forEach((item) => {
      if (item.day && typeof item.activity === "string") {
        draft[item.day] = item.activity;
      }
    });
    setScheduleDraft(draft);
  }, [selectedChild]);

  const handleOpenNew = () => {
    setName("");
    setAge("");
    setColor(defaultColors[0]);
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleSaveNew = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }

    const numericAge = age ? Number(age) : undefined;
    if (age && (Number.isNaN(numericAge) || numericAge <= 0)) {
      setFormError("Age must be a positive number.");
      return;
    }

    const initials = getInitials(trimmedName);

    const created = await addChild({
      name: trimmedName,
      age: numericAge,
      color,
      initials,
      schedule: [], // v1: Ø®Ø§Ù„ÛŒØ› Ø¨Ø¹Ø¯Ø§Ù‹ ÙÛŒÚ†Ø±Ù‡Ø§ÛŒ ÙˆÛŒØ±Ø§ÛŒØ´ Ø±Ø§ Ø§Ø¶Ø§ÙÙ‡ Ù…ÛŒâ€ŒÚ©Ù†ÛŒÙ…
      notes: [],
      events: [],
    });

    if (created) {
      setIsDialogOpen(false);
      setSelectedChildId(created.id);
    }
  };

  const handleDeleteChild = async (child: Child) => {
    await removeChild(child.id);
  };

  const handleAddNote = async () => {
    if (!selectedChild) return;
    const trimmed = newNote.trim();
    if (!trimmed) return;
    try {
      setIsSavingNote(true);
      const updatedNotes = [...(selectedChild.notes ?? []), trimmed];
      await updateChild(selectedChild.id, { notes: updatedNotes });
      setNewNote("");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (index: number) => {
    if (!selectedChild) return;
    const currentNotes = selectedChild.notes ?? [];
    const updatedNotes = currentNotes.filter((_, i) => i !== index);
    await updateChild(selectedChild.id, { notes: updatedNotes });
  };

  const handleAddEvent = async () => {
    if (!selectedChild) return;
    const title = newEventTitle.trim();
    const date = newEventDate.trim();
    if (!title || !date) return;
    setIsSavingEvent(true);
    setIsSyncingCalendar(false);

    let calendarEventId: string | null | undefined = null;

    try {
      if (addToCalendar) {
        setIsSyncingCalendar(true);
        const result = await createCalendarEventFromFamily({
          title,
          date,
          childName: selectedChild.name,
        });
        calendarEventId = result.id;
        setIsSyncingCalendar(false);
      }

      const currentEvents = selectedChild.events ?? [];
      const newEvent: ChildEvent = {
        title,
        date,
        calendarEventId: calendarEventId ?? undefined,
      };
      const updatedEvents = [...currentEvents, newEvent];
      await updateChild(selectedChild.id, { events: updatedEvents });
      setNewEventTitle("");
      setNewEventDate("");
    } finally {
      setIsSavingEvent(false);
      setIsSyncingCalendar(false);
    }
  };

  const handleDeleteEvent = async (index: number) => {
    if (!selectedChild) return;
    const currentEvents = selectedChild.events ?? [];
    const eventToDelete = currentEvents[index];
    const updatedEvents = currentEvents.filter((_, i) => i !== index);
    await updateChild(selectedChild.id, { events: updatedEvents });
    if (eventToDelete?.calendarEventId) {
      try {
        await deleteCalendarEventById(eventToDelete.calendarEventId);
      } catch (error) {
        console.error("Failed to delete linked calendar event", error);
      }
    }
  };

  const handleScheduleChange = (day: string, value: string) => {
    setScheduleDraft((prev) => ({
      ...prev,
      [day]: value,
    }));
  };

  const handleSaveSchedule = async () => {
    if (!selectedChild) return;
    const items: ChildScheduleItem[] = [];
    DAYS_OF_WEEK.forEach((day) => {
      const activity = (scheduleDraft[day] ?? "").trim();
      if (activity) {
        items.push({ day, activity });
      }
    });
    try {
      setIsSavingSchedule(true);
      await updateChild(selectedChild.id, { schedule: items });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const isInitialLoading = isLoading && !children.length;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Error banner */}
      {error && (
        <div className="mb-4">
          <StatePanel
            variant="error"
            title="Family failed to load"
            description={error || "Failed to load family data."}
          />
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 gap-3 flex-wrap"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold mb-1">Family</h1>
          <p className="text-muted-foreground">
            Manage your kids&apos; activities and notes
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-glow" onClick={handleOpenNew}>
              <Plus className="w-4 h-4" />
              Add Child
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Child</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Emma Barakzai"
                />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  min={0}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="8"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {defaultColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 border-transparent",
                        c,
                        color === c && "ring-2 ring-offset-2 ring-primary"
                      )}
                    />
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleSaveNew}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Main content */}
      {isInitialLoading ? (
        <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                <SkeletonBlock className="h-4 w-20" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonListItem key={idx} />
              ))}
            </CardContent>
          </Card>
          <div className="space-y-4">
            <SkeletonCard />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  <SkeletonBlock className="h-4 w-40" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SkeletonSection rows={2} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : !hasChildren ? (
        <StatePanel
          variant="empty"
          title="No family members yet"
          description="Add your children to track schedules, notes, and important events in one place."
          actionLabel="Add first child"
          onAction={handleOpenNew}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
          {/* Left: children list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Kids</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {children.map((child) => {
                const isSelected = selectedChild?.id === child.id;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedChildId(child.id)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/60"
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback
                        className={cn("text-xs text-white", child.color)}
                      >
                        {child.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{child.name}</p>
                      {child.age != null && (
                        <p className="text-xs text-muted-foreground">
                          Age {child.age}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteChild(child);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Right: selected child details */}
          {selectedChild && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback
                        className={cn("text-sm text-white", selectedChild.color)}
                      >
                        {selectedChild.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedChild.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedChild.age != null && (
                          <Badge variant="outline">Age {selectedChild.age}</Badge>
                        )}
                        <Badge variant="secondary">Child profile</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    disabled
                    title="Edit profile (coming soon)"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
              </Card>

              <Tabs defaultValue="schedule">
                <TabsList className="mb-3">
                  <TabsTrigger value="schedule" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="events" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="shopping" className="flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    Shopping
                  </TabsTrigger>
                </TabsList>

                <Card className="mt-4 mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Today & upcoming for {selectedChild.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Today&apos;s schedule
                      </div>
                      {todaySummary.todaySchedule ? (
                        <div className="mt-1">
                          <span className="font-medium">
                            {todaySummary.todaySchedule.day}:{" "}
                          </span>
                          <span>{todaySummary.todaySchedule.activity}</span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          No specific activities planned for today.
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Today&apos;s events
                      </div>
                      {todaySummary.todayEvents.length === 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          No events scheduled for today.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {todaySummary.todayEvents.map((event, idx) => (
                            <li key={idx} className="flex items-center justify-between">
                              <span>{event.title}</span>
                              {event.calendarEventId && (
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  In calendar
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Upcoming
                      </div>
                      {todaySummary.upcomingEvents.length === 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          No upcoming events in the next days.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {todaySummary.upcomingEvents.map((event, idx) => (
                            <li key={idx} className="flex items-center justify-between">
                              <div className="flex flex-col">
                                <span>{event.title}</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {event.date}
                                </span>
                              </div>
                              {event.calendarEventId && (
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  In calendar
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule */}
                <TabsContent value="schedule">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Weekly schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(selectedChild.schedule ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No schedule added yet. Use the form below to add weekly activities for this child.
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Update the weekly activities for this child and save your changes.
                        </p>
                      )}

                      <div className="space-y-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <div
                            key={day}
                            className="grid gap-2 sm:grid-cols-[120px,1fr] items-center"
                          >
                            <Label className="text-xs sm:text-sm text-muted-foreground">
                              {day}
                            </Label>
                            <Input
                              placeholder="No activities"
                              value={scheduleDraft[day] ?? ""}
                              onChange={(e) => handleScheduleChange(day, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleSaveSchedule()}
                          disabled={isSavingSchedule}
                        >
                          {isSavingSchedule ? "Saving..." : "Save schedule"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notes */}
                <TabsContent value="notes">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!selectedChild.notes || selectedChild.notes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No notes yet. Use the box below to add your first note.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {(selectedChild.notes ?? []).map((note: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start justify-between gap-2 rounded-lg bg-secondary px-3 py-2"
                            >
                              <span className="flex-1 whitespace-pre-wrap">{note}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => void handleDeleteNote(idx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Add a quick note
                        </Label>
                        <Textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Homework, health notes, behavior, appointments..."
                          rows={3}
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleAddNote()}
                            disabled={isSavingNote || !newNote.trim()}
                          >
                            {isSavingNote ? "Saving..." : "Save note"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Events */}
                <TabsContent value="events">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Important events
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!selectedChild.events || selectedChild.events.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No events added yet. Use the form below to add birthdays,
                          doctor appointments, or school events.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {(selectedChild.events ?? []).map(
                            (event: ChildEvent, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {event.title}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {event.date}
                                  </span>
                                  {event.calendarEventId && (
                                    <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                                      Linked to calendar
                                    </span>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => void handleDeleteEvent(idx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Add event
                        </Label>
                        <div className="grid gap-2 sm:grid-cols-[2fr,1fr]">
                          <Input
                            placeholder="Doctor appointment, Birthday..."
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                          />
                          <Input
                            type="date"
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-xs text-muted-foreground">
                            Also add this event to Calendar
                          </Label>
                          <Checkbox
                            checked={addToCalendar}
                            onCheckedChange={(checked) => setAddToCalendar(!!checked)}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleAddEvent()}
                            disabled={
                              isSavingEvent ||
                              isSyncingCalendar ||
                              !newEventTitle.trim() ||
                              !newEventDate.trim()
                            }
                          >
                            {isSavingEvent || isSyncingCalendar ? "Saving..." : "Save event"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                {/* Shopping */}
                <TabsContent value="shopping">
                  <Card>
                    <CardContent className="pt-5">
                      <ShoppingList />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




