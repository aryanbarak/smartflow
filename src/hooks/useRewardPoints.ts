import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import {
  RewardPoint,
  rewardPointsService,
  monthStr,
} from "@/features/family-hub/familyHubService";

export function useRewardPoints(childId: string | null) {
  const { user } = useAuth();
  const [points, setPoints] = useState<RewardPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !childId) {
      setPoints([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await rewardPointsService.list(user.id, childId);
      setPoints(data);
    } finally {
      setIsLoading(false);
    }
  }, [user, childId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const addPoints = useCallback(
    async (pts: number, reason: string) => {
      if (!user || !childId) return;
      const month = monthStr();
      const created = await rewardPointsService.add(user.id, childId, pts, reason, month);
      setPoints((prev) => [created, ...prev]);
    },
    [user, childId]
  );

  const currentMonth = monthStr();

  const totalThisMonth = useMemo(
    () => points.filter((p) => p.month === currentMonth).reduce((sum, p) => sum + p.points, 0),
    [points, currentMonth]
  );

  const thisMonthPoints = useMemo(
    () => points.filter((p) => p.month === currentMonth),
    [points, currentMonth]
  );

  return { points, thisMonthPoints, totalThisMonth, isLoading, addPoints };
}
