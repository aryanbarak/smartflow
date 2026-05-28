import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationState {
  taskReminders: boolean;
  taskReminderTime: string;
  habitReminder: boolean;
  habitReminderTime: string;
  calendarReminders: boolean;
  calendarReminderMinutes: number;
  dailySummary: boolean;
  dailySummaryTime: string;
  setTaskReminders: (v: boolean) => void;
  setTaskReminderTime: (t: string) => void;
  setHabitReminder: (v: boolean) => void;
  setHabitReminderTime: (t: string) => void;
  setCalendarReminders: (v: boolean) => void;
  setCalendarReminderMinutes: (m: number) => void;
  setDailySummary: (v: boolean) => void;
  setDailySummaryTime: (t: string) => void;
}

export const useNotificationPrefs = create<NotificationState>()(
  persist(
    set => ({
      taskReminders: true,
      taskReminderTime: '09:00',
      habitReminder: true,
      habitReminderTime: '08:00',
      calendarReminders: true,
      calendarReminderMinutes: 15,
      dailySummary: false,
      dailySummaryTime: '07:00',
      setTaskReminders: taskReminders => set({ taskReminders }),
      setTaskReminderTime: taskReminderTime => set({ taskReminderTime }),
      setHabitReminder: habitReminder => set({ habitReminder }),
      setHabitReminderTime: habitReminderTime => set({ habitReminderTime }),
      setCalendarReminders: calendarReminders => set({ calendarReminders }),
      setCalendarReminderMinutes: calendarReminderMinutes => set({ calendarReminderMinutes }),
      setDailySummary: dailySummary => set({ dailySummary }),
      setDailySummaryTime: dailySummaryTime => set({ dailySummaryTime }),
    }),
    { name: 'dailyflow:notification-prefs' },
  ),
);
