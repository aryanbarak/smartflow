// src/hooks/useFinance.ts

import { useCallback, useEffect, useState } from "react";
import {
  Transaction,
  TransactionType,
  financeService,
} from "@/features/finance/financeService";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";

type NewTransaction = Omit<Transaction, "id" | "createdAt" | "updatedAt">;

export function useFinance() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!user) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await financeService.listTransactions(user.id);
      setTransactions(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load finance data.";
      console.error("[useFinance] load error", err);
      setError(message);
      toast({
        variant: "destructive",
        title: "Failed to load finance data",
        description: message,
      });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addTransaction = useCallback(
    async (input: NewTransaction) => {
      if (!user) return null;
      try {
        const created = await financeService.createTransaction(user.id, input);
        setTransactions((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        console.error("[useFinance] add error", err);
        toast({
          variant: "destructive",
          title: "Failed to add transaction",
        });
        throw err;
      }
    },
    [user, toast],
  );

  const updateTransaction = useCallback(
    async (
      id: string,
      updates: {
        type: TransactionType;
        amount: number;
        category: string;
        date: string;
        notes?: string;
      },
    ) => {
      if (!user) return null;
      try {
        const updated = await financeService.updateTransaction(
          user.id,
          id,
          updates,
        );
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? updated : tx)),
        );
        return updated;
      } catch (err) {
        console.error("[useFinance] update error", err);
        toast({
          variant: "destructive",
          title: "Failed to update transaction",
        });
        throw err;
      }
    },
    [user, toast],
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      if (!user) return false;
      try {
        const ok = await financeService.deleteTransaction(user.id, id);
        if (ok) {
          setTransactions((prev) => prev.filter((tx) => tx.id !== id));
        }
        return ok;
      } catch (err) {
        console.error("[useFinance] delete error", err);
        toast({
          variant: "destructive",
          title: "Failed to delete transaction",
        });
        throw err;
      }
    },
    [user, toast],
  );

  return {
    transactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    isLoading,
    error,
    refresh,
  };
}
