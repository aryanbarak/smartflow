import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import {
  Exam,
  ExamInput,
  examsService,
} from "@/features/family-hub/familyHubService";

export function useExams(childId: string | null) {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !childId) {
      setExams([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await examsService.list(user.id, childId);
      setExams(data);
    } finally {
      setIsLoading(false);
    }
  }, [user, childId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const add = useCallback(
    async (input: ExamInput) => {
      if (!user || !childId) return;
      const created = await examsService.create(user.id, childId, input);
      setExams((prev) => [...prev, created].sort((a, b) => a.examDate.localeCompare(b.examDate)));
    },
    [user, childId]
  );

  const setGrade = useCallback(async (id: string, grade: string, onAward?: () => void) => {
    await examsService.setGrade(id, grade);
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, grade } : e)));
    onAward?.();
  }, []);

  const remove = useCallback(async (id: string) => {
    await examsService.remove(id);
    setExams((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { exams, isLoading, refresh, add, setGrade, remove };
}
