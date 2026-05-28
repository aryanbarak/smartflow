import { create } from 'zustand';

export type PomodoroPhase = 'focus' | 'break' | 'long-break';

interface PomodoroState {
  phase: PomodoroPhase;
  running: boolean;
  linkedTaskId: string | null;
  linkedTaskTitle: string | null;
  setLinkedTask: (id: string | null, title: string | null) => void;
  setPhase: (phase: PomodoroPhase) => void;
  setRunning: (running: boolean) => void;
}

export const usePomodoroStore = create<PomodoroState>((set) => ({
  phase: 'focus',
  running: false,
  linkedTaskId: null,
  linkedTaskTitle: null,
  setLinkedTask: (id, title) => set({ linkedTaskId: id, linkedTaskTitle: title }),
  setPhase: (phase) => set({ phase }),
  setRunning: (running) => set({ running }),
}));
