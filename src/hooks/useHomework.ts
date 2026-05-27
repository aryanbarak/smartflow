import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import {
  Homework,
  HomeworkInput,
  homeworkService,
} from "@/features/family-hub/familyHubService";

export function useHomework(childId: string | null) {
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !childId) {
      setHomework([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await homeworkService.list(user.id, childId);
      setHomework(data);
    } finally {
      setIsLoading(false);
    }
  }, [user, childId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const add = useCallback(
    async (input: HomeworkInput) => {
      if (!user || !childId) return;
      const created = await homeworkService.create(user.id, childId, input);
      setHomework((prev) => [...prev, created].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
    },
    [user, childId]
  );

  const toggle = useCallback(async (id: string, completed: boolean) => {
    await homeworkService.toggle(id, completed);
    setHomework((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, completed, completedAt: completed ? new Date().toISOString() : null } : h
      )
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    await homeworkService.remove(id);
    setHomework((prev) => prev.filter((h) => h.id !== id));
  }, []);

  return { homework, isLoading, refresh, add, toggle, remove };
}
