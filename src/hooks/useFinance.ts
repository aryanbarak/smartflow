// src/hooks/useFinance.ts

import { useCallback, useEffect, useState } from "react";
import {
  Transaction,
  TransactionType,
  financeService,
} from "@/features/finance/financeService";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";

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
      const message = getErrorMessage(err) || "Failed to load finance data.";
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
      const now = new Date().toISOString();
      const tempId = `__temp_${now}`;
      const tempItem: Transaction = { id: tempId, ...input, createdAt: now, updatedAt: now };
      setTransactions((prev) => [tempItem, ...prev]);
      try {
        const created = await financeService.createTransaction(user.id, input);
        setTransactions((prev) => prev.map((tx) => (tx.id === tempId ? created : tx)));
        return created;
      } catch (err) {
        setTransactions((prev) => prev.filter((tx) => tx.id !== tempId));
        const message = getErrorMessage(err);
        console.error("[useFinance] add error", err);
        toast({
          variant: "destructive",
          title: "Failed to add transaction",
          description: message,
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
      const snapshot = transactions;
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx)),
      );
      try {
        const updated = await financeService.updateTransaction(user.id, id, updates);
        setTransactions((prev) => prev.map((tx) => (tx.id === id ? updated : tx)));
        return updated;
      } catch (err) {
        setTransactions(snapshot);
        const message = getErrorMessage(err);
        console.error("[useFinance] update error", err);
        toast({
          variant: "destructive",
          title: "Failed to update transaction",
          description: message,
        });
        throw err;
      }
    },
    [user, transactions, toast],
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      if (!user) return false;
      const snapshot = transactions;
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      try {
        const ok = await financeService.deleteTransaction(user.id, id);
        if (!ok) setTransactions(snapshot);
        return ok;
      } catch (err) {
        setTransactions(snapshot);
        const message = getErrorMessage(err);
        console.error("[useFinance] delete error", err);
        toast({
          variant: "destructive",
          title: "Failed to delete transaction",
          description: message,
        });
        throw err;
      }
    },
    [user, transactions, toast],
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
