import { createId } from "@/lib/id";
import { safeGet, safeSet, storageKey } from "@/lib/storage";

export interface CalendarEvent {
  id: string;
  title: string;
  dateTimeStart: string;
  dateTimeEnd?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const EVENTS_KEY = storageKey("events");

function readAll(): CalendarEvent[] {
  return safeGet<CalendarEvent[]>(EVENTS_KEY, []);
}

function writeAll(events: CalendarEvent[]) {
  safeSet(EVENTS_KEY, events);
}

export const calendarService = {
  getAll() {
    return readAll();
  },
  getRange(start?: Date, end?: Date) {
    const events = readAll();
    if (!start || !end) return events;
    const startMs = start.getTime();
    const endMs = end.getTime();
    return events.filter((event) => {
      const startTime = new Date(event.dateTimeStart).getTime();
      return startTime >= startMs && startTime <= endMs;
    });
  },
  create(input: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    const event: CalendarEvent = {
      id: createId(),
      title: input.title.trim(),
      dateTimeStart: input.dateTimeStart,
      dateTimeEnd: input.dateTimeEnd || undefined,
      location: input.location?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    const events = [event, ...readAll()];
    writeAll(events);
    return event;
  },
  update(id: string, updates: Partial<Omit<CalendarEvent, "id" | "createdAt">>) {
    const events = readAll();
    const index = events.findIndex((event) => event.id === id);
    if (index === -1) return null;
    const updated: CalendarEvent = {
      ...events[index],
      ...updates,
      title: updates.title ? updates.title.trim() : events[index].title,
      location: updates.location !== undefined ? updates.location.trim() || undefined : events[index].location,
      notes: updates.notes !== undefined ? updates.notes.trim() || undefined : events[index].notes,
      updatedAt: new Date().toISOString(),
    };
    events[index] = updated;
    writeAll(events);
    return updated;
  },
  remove(id: string) {
    const events = readAll();
    const next = events.filter((event) => event.id !== id);
    if (next.length === events.length) return false;
    writeAll(next);
    return true;
  },
};

function parseLocalDate(date: string) {
  const [yearStr, monthStr, dayStr] = date.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) {
    throw new Error("Invalid date");
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export async function createCalendarEventFromFamily(input: {
  title: string;
  date: string;
  childName: string;
}): Promise<{ id: string }> {
  const dateTimeStart = parseLocalDate(input.date).toISOString();
  const event = calendarService.create({
    title: `${input.childName} - ${input.title}`,
    dateTimeStart,
  });
  return { id: event.id };
}

export async function deleteCalendarEventById(id: string): Promise<void> {
  calendarService.remove(id);
}
