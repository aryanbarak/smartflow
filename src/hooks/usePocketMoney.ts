import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import {
  PocketMoneyRecord,
  pocketMoneyService,
  monthStr,
} from "@/features/family-hub/familyHubService";

export function usePocketMoney(childId: string | null) {
  const { user } = useAuth();
  const [records, setRecords] = useState<PocketMoneyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !childId) {
      setRecords([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await pocketMoneyService.list(user.id, childId);
      setRecords(data);
    } finally {
      setIsLoading(false);
    }
  }, [user, childId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const setMonth = useCallback(
    async (amount: number, month?: string) => {
      if (!user || !childId) return;
      const m = month ?? monthStr();
      await pocketMoneyService.upsertMonth(user.id, childId, m, amount);
      await refresh();
    },
    [user, childId, refresh]
  );

  const markPaid = useCallback(async (id: string, paid: boolean) => {
    await pocketMoneyService.markPaid(id, paid);
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, paid, paidAt: paid ? new Date().toISOString() : null } : r
      )
    );
  }, []);

  const currentMonth = monthStr();
  const thisMonthRecord = records.find((r) => r.month === currentMonth) ?? null;

  return { records, isLoading, thisMonthRecord, currentMonth, setMonth, markPaid };
}
