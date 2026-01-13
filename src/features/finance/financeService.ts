// src/features/finance/financeService.ts

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  /**
   * Local date in YYYY-MM-DD format (Supabase column: date)
   */
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

type FinanceRow = Database["public"]["Tables"]["finance_transactions"]["Row"];

function mapRowToTransaction(row: FinanceRow): Transaction {
  return {
    id: row.id,
    type: row.type as TransactionType,
    amount: typeof row.amount === "number" ? row.amount : Number(row.amount),
    category: row.category,
    date: row.date as string, // "YYYY-MM-DD"
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const financeService = {
  async listTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from("finance_transactions")
      .select(
        "id,user_id,type,amount,category,date,notes,created_at,updated_at",
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => mapRowToTransaction(row as FinanceRow));
  },

  async createTransaction(
    userId: string,
    input: {
      type: TransactionType;
      amount: number;
      category: string;
      date: string;
      notes?: string;
    },
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from("finance_transactions")
      .insert({
        user_id: userId,
        type: input.type,
        amount: input.amount,
        category: input.category,
        date: input.date, // YYYY-MM-DD
        notes: input.notes?.trim() || null,
      })
      .select(
        "id,user_id,type,amount,category,date,notes,created_at,updated_at",
      )
      .single();

    if (error) throw error;
    if (!data) throw new Error("Insert returned no data");
    return mapRowToTransaction(data as FinanceRow);
  },

  async updateTransaction(
    userId: string,
    id: string,
    updates: {
      type: TransactionType;
      amount: number;
      category: string;
      date: string;
      notes?: string;
    },
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from("finance_transactions")
      .update({
        type: updates.type,
        amount: updates.amount,
        category: updates.category,
        date: updates.date,
        notes: updates.notes?.trim() ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select(
        "id,user_id,type,amount,category,date,notes,created_at,updated_at",
      )
      .single();

    if (error) throw error;
    if (!data) throw new Error("Update returned no data");
    return mapRowToTransaction(data as FinanceRow);
  },

  async deleteTransaction(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from("finance_transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  },
};
