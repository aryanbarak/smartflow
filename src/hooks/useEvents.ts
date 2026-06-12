import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarEvent,
  calendarService,
  migrateLocalStorageEvents,
} from "@/features/calendar/calendarService";
import { safeGet, storageKey } from "@/lib/storage";

const MIGRATED_KEY = storageKey("calendar-migrated");

export function useEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await calendarService.getAll();
      setEvents(loaded);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const alreadyMigrated = safeGet<boolean>(MIGRATED_KEY, false);
    if (alreadyMigrated) {
      void refresh();
    } else {
      migrateLocalStorageEvents(user.id)
        .then(() => {
          // Mark migrated only on success; on failure localStorage is untouched
          // and the migration will retry next session.
          try { localStorage.setItem(MIGRATED_KEY, "true"); } catch { /* ignore */ }
        })
        .catch(console.error)
        .finally(() => void refresh());
    }
  }, [user, refresh]);

  const addEvent = useCallback(
    async (input: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const tempId = `__temp_${now}`;
      const tempEvent: CalendarEvent = { id: tempId, ...input, createdAt: now, updatedAt: now };
      setEvents((prev) => [tempEvent, ...prev]);
      try {
        const created = await calendarService.create(input);
        setEvents((prev) => prev.map((e) => (e.id === tempId ? created : e)));
        return created;
      } catch (err) {
        setEvents((prev) => prev.filter((e) => e.id !== tempId));
        console.error("Failed to create event", err);
        toast({ variant: "destructive", title: "Failed to create event" });
        return null;
      }
    },
    [toast],
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<Omit<CalendarEvent, "id" | "createdAt">>) => {
      const snapshot = events;
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      try {
        const updated = await calendarService.update(id, updates);
        if (!updated) {
          setEvents(snapshot);
          return null;
        }
        setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
        return updated;
      } catch (err) {
        setEvents(snapshot);
        console.error("Failed to update event", err);
        toast({ variant: "destructive", title: "Failed to update event" });
        return null;
      }
    },
    [events, toast],
  );

  const removeEvent = useCallback(
    async (id: string) => {
      const snapshot = events;
      setEvents((prev) => prev.filter((e) => e.id !== id));
      try {
        const removed = await calendarService.remove(id);
        if (!removed) setEvents(snapshot);
        return removed;
      } catch (err) {
        setEvents(snapshot);
        console.error("Failed to remove event", err);
        toast({ variant: "destructive", title: "Failed to remove event" });
        return false;
      }
    },
    [events, toast],
  );

  return { events, isLoading, refresh, addEvent, updateEvent, removeEvent };
}
