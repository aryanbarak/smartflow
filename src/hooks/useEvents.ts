import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  CalendarEvent,
  calendarService,
  migrateLocalStorageEvents,
} from "@/features/calendar/calendarService";
import { safeGet, storageKey } from "@/lib/storage";

const MIGRATED_KEY = storageKey("calendar-migrated");

export function useEvents() {
  const { user } = useAuth();
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
      const created = await calendarService.create(input);
      setEvents((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<Omit<CalendarEvent, "id" | "createdAt">>) => {
      const updated = await calendarService.update(id, updates);
      if (!updated) return null;
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    },
    [],
  );

  const removeEvent = useCallback(async (id: string) => {
    const removed = await calendarService.remove(id);
    if (removed) setEvents((prev) => prev.filter((e) => e.id !== id));
    return removed;
  }, []);

  return { events, isLoading, refresh, addEvent, updateEvent, removeEvent };
}
