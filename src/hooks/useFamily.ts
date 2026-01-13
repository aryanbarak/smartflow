// src/hooks/useFamily.ts

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import {
  Child,
  ChildCreateInput,
  ChildUpdateInput,
  familyService,
} from "@/features/family/familyService";

export function useFamily() {
  const { user } = useAuth();
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
    } catch (err: any) {
      setError(err?.message ?? "Failed to load family data.");
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
      const created = await familyService.create(user.id, input);
      setChildren((prev) => [...prev, created]);
      return created;
    },
    [user]
  );

  const updateChild = useCallback(
    async (id: string, patch: ChildUpdateInput): Promise<Child | null> => {
      if (!user) {
        setError("You must be logged in to update a child.");
        return null;
      }
      const updated = await familyService.update(user.id, id, patch);
      setChildren((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      return updated;
    },
    [user]
  );

  const removeChild = useCallback(
    async (id: string): Promise<void> => {
      if (!user) {
        setError("You must be logged in to delete a child.");
        return;
      }
      await familyService.remove(user.id, id);
      setChildren((prev) => prev.filter((c) => c.id !== id));
    },
    [user]
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
