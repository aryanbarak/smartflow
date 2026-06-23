// src/features/family/familyService.ts

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FamilyChildRow = Database["public"]["Tables"]["family_children"]["Row"];
type FamilyChildInsert = Database["public"]["Tables"]["family_children"]["Insert"];
type FamilyChildUpdate = Database["public"]["Tables"]["family_children"]["Update"];

export interface ChildScheduleItem {
  day: string;
  activity: string;
}

export interface ChildEvent {
  title: string;
  date: string; // e.g. "2025-12-31" or "Dec 31"
  calendarEventId?: string | null;
}

export type MemberRole = "child" | "teen" | "adult" | "parent";

export interface Child {
  id: string;
  name: string;
  age?: number;
  color: string;
  initials: string;
  role: MemberRole;
  school?: string;
  grade?: string;
  schedule: ChildScheduleItem[];
  notes: string[];
  events: ChildEvent[];
  createdAt: string;
  updatedAt: string;
}

export type ChildCreateInput = {
  name: string;
  age?: number;
  color: string;
  initials: string;
  role?: MemberRole;
  schedule?: ChildScheduleItem[];
  notes?: string[];
  events?: ChildEvent[];
};

export type ChildUpdateInput = Partial<ChildCreateInput>;

export function ageToRole(age?: number): MemberRole {
  if (age === undefined) return "child";
  if (age >= 18) return "adult";
  if (age >= 12) return "teen";
  return "child";
}

function mapRowToChild(row: FamilyChildRow): Child {
  const age = row.age ?? undefined;
  const storedRole = row.role as MemberRole | undefined;
  return {
    id: row.id,
    name: row.name,
    age,
    color: row.color,
    initials: row.initials,
    role: storedRole ?? ageToRole(age),
    school: (row as Record<string, unknown>).school as string | undefined,
    grade: (row as Record<string, unknown>).grade as string | undefined,
    schedule: (row.schedule ?? []) as ChildScheduleItem[],
    notes: (row.notes ?? []) as string[],
    events: (row.events ?? []) as ChildEvent[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const familyService = {
  async list(userId: string): Promise<Child[]> {
    const { data, error } = await supabase
      .from("family_children")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapRowToChild);
  },

  async create(userId: string, input: ChildCreateInput): Promise<Child> {
    const payload = {
      user_id: userId,
      name: input.name,
      age: input.age ?? null,
      color: input.color,
      initials: input.initials,
      role: input.role ?? ageToRole(input.age),
      schedule: input.schedule ?? [],
      notes: input.notes ?? [],
      events: input.events ?? [],
    } as FamilyChildInsert;

    const { data, error } = await supabase
      .from("family_children")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return mapRowToChild(data);
  },

  async update(
    userId: string,
    id: string,
    patch: ChildUpdateInput
  ): Promise<Child> {
    const payload = {
      name: patch.name,
      age: patch.age ?? null,
      color: patch.color,
      initials: patch.initials,
      role: patch.role,
      schedule: patch.schedule,
      notes: patch.notes,
      events: patch.events,
    } as FamilyChildUpdate;

    const { data, error } = await supabase
      .from("family_children")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return mapRowToChild(data);
  },

  async remove(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from("family_children")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  },
};
