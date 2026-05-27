import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import {
  ChecklistTemplate,
  checklistService,
  todayStr,
} from "@/features/family-hub/familyHubService";

const DEFAULT_ITEMS: { title: string; icon: string }[] = [
  { title: "Frühstück gegessen", icon: "🍳" },
  { title: "Zähne geputzt", icon: "🦷" },
  { title: "Hausaufgaben gemacht", icon: "📚" },
  { title: "Gelesen (30 min)", icon: "📖" },
  { title: "Sport/Bewegung", icon: "🏃" },
  { title: "Zimmer aufgeräumt", icon: "🛏️" },
];

export function useChecklist(childId: string | null) {
  const { user } = useAuth();
  const today = todayStr();
  const seededRef = useRef(false);

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !childId) {
      setTemplates([]);
      setCompletedIds(new Set());
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [tmpl, comp] = await Promise.all([
        checklistService.listTemplates(childId),
        checklistService.listCompletions(childId, today),
      ]);
      setTemplates(tmpl);
      setCompletedIds(new Set(comp));
    } finally {
      setIsLoading(false);
    }
  }, [user, childId, today]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Seed default items when child first opens the checklist
  useEffect(() => {
    if (isLoading || !user || !childId || templates.length > 0 || seededRef.current) return;
    seededRef.current = true;
    void (async () => {
      for (let i = 0; i < DEFAULT_ITEMS.length; i++) {
        const item = DEFAULT_ITEMS[i];
        await checklistService.createTemplate(user.id, childId, item.title, item.icon, i);
      }
      await refresh();
    })();
  }, [isLoading, user, childId, templates.length, refresh]);

  const toggle = useCallback(
    async (templateId: string, onComplete?: () => void) => {
      if (!user || !childId) return;
      const wasDone = completedIds.has(templateId);
      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (wasDone) { next.delete(templateId); } else { next.add(templateId); }
        return next;
      });
      try {
        if (wasDone) {
          await checklistService.uncomplete(templateId, today);
        } else {
          await checklistService.complete(templateId, childId, today);
          onComplete?.();
        }
      } catch {
        setCompletedIds((prev) => {
          const next = new Set(prev);
          if (wasDone) { next.add(templateId); } else { next.delete(templateId); }
          return next;
        });
      }
    },
    [user, childId, completedIds, today]
  );

  const addTemplate = useCallback(
    async (title: string, icon: string) => {
      if (!user || !childId) return;
      const t = await checklistService.createTemplate(user.id, childId, title, icon, templates.length);
      setTemplates((prev) => [...prev, t]);
    },
    [user, childId, templates.length]
  );

  const deleteTemplate = useCallback(async (id: string) => {
    await checklistService.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    templates,
    completedIds,
    completedCount: completedIds.size,
    totalCount: templates.length,
    isLoading,
    today,
    toggle,
    addTemplate,
    deleteTemplate,
  };
}
