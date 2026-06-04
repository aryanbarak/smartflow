import { supabase } from "@/integrations/supabase/client";


// ── Types ──────────────────────────────────────────────────────────────────

export interface ChecklistTemplate {
  id: string;
  userId: string;
  childId: string;
  title: string;
  icon: string;
  orderIndex: number;
  createdAt: string;
}

export interface Homework {
  id: string;
  userId: string;
  childId: string;
  subject: string;
  title: string;
  description: string | null;
  dueDate: string;
  completed: boolean;
  completedAt: string | null;
  priority: "low" | "normal" | "high";
  createdAt: string;
}

export interface Exam {
  id: string;
  userId: string;
  childId: string;
  subject: string;
  examDate: string;
  grade: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PocketMoneyRecord {
  id: string;
  userId: string;
  childId: string;
  amount: number;
  month: string;
  paid: boolean;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface RewardPoint {
  id: string;
  userId: string;
  childId: string;
  points: number;
  reason: string;
  month: string;
  createdAt: string;
}

export type HomeworkInput = {
  subject: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: "low" | "normal" | "high";
};

export type ExamInput = {
  subject: string;
  examDate: string;
  notes?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthStr(): string {
  return new Date().toISOString().slice(0, 7);
}

// ── Checklist ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTemplate(r: any): ChecklistTemplate {
  return {
    id: r.id,
    userId: r.user_id,
    childId: r.child_id,
    title: r.title,
    icon: r.icon ?? "✅",
    orderIndex: r.order_index ?? 0,
    createdAt: r.created_at,
  };
}

export const checklistService = {
  async listTemplates(childId: string): Promise<ChecklistTemplate[]> {
    const { data, error } = await db
      .from("checklist_templates")
      .select("*")
      .eq("child_id", childId)
      .order("order_index");
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => mapTemplate(r));
  },

  async createTemplate(
    userId: string, childId: string, title: string, icon: string, orderIndex: number
  ): Promise<ChecklistTemplate> {
    const { data, error } = await db
      .from("checklist_templates")
      .insert({ user_id: userId, child_id: childId, title, icon, order_index: orderIndex })
      .select("*").single();
    if (error) throw error;
    return mapTemplate(data);
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase.from("checklist_templates").delete().eq("id", id);
    if (error) throw error;
  },

  async listCompletions(childId: string, date: string): Promise<string[]> {
    const { data, error } = await db
      .from("checklist_completions")
      .select("template_id")
      .eq("child_id", childId)
      .eq("date", date);
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => r.template_id as string);
  },

  async complete(templateId: string, childId: string, date: string): Promise<void> {
    const { error } = await db
      .from("checklist_completions")
      .upsert({ template_id: templateId, child_id: childId, date }, { onConflict: "template_id,date" });
    if (error) throw error;
  },

  async uncomplete(templateId: string, date: string): Promise<void> {
    const { error } = await db
      .from("checklist_completions")
      .delete()
      .eq("template_id", templateId)
      .eq("date", date);
    if (error) throw error;
  },
};

// ── Homework ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHomework(r: any): Homework {
  return {
    id: r.id,
    userId: r.user_id,
    childId: r.child_id,
    subject: r.subject,
    title: r.title,
    description: r.description,
    dueDate: r.due_date,
    completed: r.completed,
    completedAt: r.completed_at,
    priority: r.priority as "low" | "normal" | "high",
    createdAt: r.created_at,
  };
}

export const homeworkService = {
  async list(userId: string, childId: string): Promise<Homework[]> {
    const { data, error } = await db
      .from("child_homework")
      .select("*")
      .eq("user_id", userId)
      .eq("child_id", childId)
      .order("due_date");
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => mapHomework(r));
  },

  async create(userId: string, childId: string, input: HomeworkInput): Promise<Homework> {
    const { data, error } = await db
      .from("child_homework")
      .insert({
        user_id: userId,
        child_id: childId,
        subject: input.subject,
        title: input.title,
        description: input.description ?? null,
        due_date: input.dueDate,
        priority: input.priority,
      })
      .select("*").single();
    if (error) throw error;
    return mapHomework(data);
  },

  async toggle(id: string, completed: boolean): Promise<void> {
    const { error } = await db
      .from("child_homework")
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("child_homework").delete().eq("id", id);
    if (error) throw error;
  },
};

// ── Exams ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExam(r: any): Exam {
  return {
    id: r.id,
    userId: r.user_id,
    childId: r.child_id,
    subject: r.subject,
    examDate: r.exam_date,
    grade: r.grade,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export const examsService = {
  async list(userId: string, childId: string): Promise<Exam[]> {
    const { data, error } = await db
      .from("child_exams")
      .select("*")
      .eq("user_id", userId)
      .eq("child_id", childId)
      .order("exam_date");
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => mapExam(r));
  },

  async create(userId: string, childId: string, input: ExamInput): Promise<Exam> {
    const { data, error } = await db
      .from("child_exams")
      .insert({
        user_id: userId,
        child_id: childId,
        subject: input.subject,
        exam_date: input.examDate,
        notes: input.notes ?? null,
      })
      .select("*").single();
    if (error) throw error;
    return mapExam(data);
  },

  async setGrade(id: string, grade: string): Promise<void> {
    const { error } = await supabase.from("child_exams").update({ grade }).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("child_exams").delete().eq("id", id);
    if (error) throw error;
  },
};

// ── Pocket Money ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPocketMoney(r: any): PocketMoneyRecord {
  return {
    id: r.id,
    userId: r.user_id,
    childId: r.child_id,
    amount: r.amount,
    month: r.month,
    paid: r.paid,
    paidAt: r.paid_at,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export const pocketMoneyService = {
  async list(userId: string, childId: string): Promise<PocketMoneyRecord[]> {
    const { data, error } = await db
      .from("pocket_money")
      .select("*")
      .eq("user_id", userId)
      .eq("child_id", childId)
      .order("month", { ascending: false })
      .limit(12);
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => mapPocketMoney(r));
  },

  async upsertMonth(userId: string, childId: string, month: string, amount: number): Promise<void> {
    const { error } = await db
      .from("pocket_money")
      .upsert({ user_id: userId, child_id: childId, month, amount }, { onConflict: "user_id,child_id,month" });
    if (error) throw error;
  },

  async markPaid(id: string, paid: boolean): Promise<void> {
    const { error } = await db
      .from("pocket_money")
      .update({ paid, paid_at: paid ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) throw error;
  },
};

// ── Reward Points ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRewardPoint(r: any): RewardPoint {
  return {
    id: r.id,
    userId: r.user_id,
    childId: r.child_id,
    points: r.points,
    reason: r.reason,
    month: r.month,
    createdAt: r.created_at,
  };
}

export const rewardPointsService = {
  async list(userId: string, childId: string, month?: string): Promise<RewardPoint[]> {
    let q = db
      .from("reward_points")
      .select("*")
      .eq("user_id", userId)
      .eq("child_id", childId)
      .order("created_at", { ascending: false });
    if (month) q = q.eq("month", month);
    const { data, error } = await q;
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => mapRewardPoint(r));
  },

  async add(userId: string, childId: string, points: number, reason: string, month: string): Promise<RewardPoint> {
    const { data, error } = await db
      .from("reward_points")
      .insert({ user_id: userId, child_id: childId, points, reason, month })
      .select("*").single();
    if (error) throw error;
    return mapRewardPoint(data);
  },
};
