export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  color: string;
  icon: string;
  frequency: 'daily' | 'weekly';
  target_days: number;
  habit_type: 'ongoing' | 'goal';
  target_value?: number | null;
  target_unit?: string | null;
  achieved_at?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface HabitCompletion {
  id: string;
  user_id: string;
  habit_id: string;
  completed_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface HabitWithStats extends Habit {
  completions: HabitCompletion[];
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // 0-100
  completedToday: boolean;
}
