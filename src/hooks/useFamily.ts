// src/hooks/useFamily.ts

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Child,
  ChildCreateInput,
  ChildUpdateInput,
  ageToRole,
  familyService,
} from "@/features/family/familyService";

export function useFamily() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setChildren([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      const data = await familyService.list(user.id);
      setChildren(data);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load family data.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addChild = useCallback(
    async (input: ChildCreateInput): Promise<Child | null> => {
      if (!user) {
        setError("You must be logged in to add a child.");
        return null;
      }
      const now = new Date().toISOString();
      const tempId = `__temp_${now}`;
      const tempChild: Child = {
        id: tempId,
        name: input.name,
        age: input.age,
        color: input.color,
        initials: input.initials,
        role: input.role ?? ageToRole(input.age),
        schedule: input.schedule ?? [],
        notes: input.notes ?? [],
        events: input.events ?? [],
        createdAt: now,
        updatedAt: now,
      };
      setChildren((prev) => [...prev, tempChild]);
      try {
        const created = await familyService.create(user.id, input);
        setChildren((prev) => prev.map((c) => (c.id === tempId ? created : c)));
        return created;
      } catch (err) {
        setChildren((prev) => prev.filter((c) => c.id !== tempId));
        const message = err instanceof Error ? err.message : "Failed to add member.";
        setError(message);
        toast({ variant: "destructive", title: "Failed to add member", description: message });
        return null;
      }
    },
    [user, toast],
  );

  const updateChild = useCallback(
    async (id: string, patch: ChildUpdateInput): Promise<Child | null> => {
      if (!user) {
        setError("You must be logged in to update a child.");
        return null;
      }
      const snapshot = children;
      setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      try {
        const updated = await familyService.update(user.id, id, patch);
        setChildren((prev) => prev.map((c) => (c.id === id ? updated : c)));
        return updated;
      } catch (err) {
        setChildren(snapshot);
        const message = err instanceof Error ? err.message : "Failed to update member.";
        setError(message);
        toast({ variant: "destructive", title: "Failed to update member", description: message });
        return null;
      }
    },
    [user, children, toast],
  );

  const removeChild = useCallback(
    async (id: string): Promise<void> => {
      if (!user) {
        setError("You must be logged in to delete a child.");
        return;
      }
      const snapshot = children;
      setChildren((prev) => prev.filter((c) => c.id !== id));
      try {
        await familyService.remove(user.id, id);
      } catch (err) {
        setChildren(snapshot);
        const message = err instanceof Error ? err.message : "Failed to remove member.";
        setError(message);
        toast({ variant: "destructive", title: "Failed to remove member", description: message });
      }
    },
    [user, children, toast],
  );

  return {
    children,
    isLoading,
    error,
    refresh,
    addChild,
    updateChild,
    removeChild,
  };
}
