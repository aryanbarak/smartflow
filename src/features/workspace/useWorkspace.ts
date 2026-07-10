import { useMemo } from "react";
import { useEvents } from "@/hooks/useEvents";
import { useTasks } from "@/hooks/useTasks";
import { useFinance } from "@/hooks/useFinance";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useLearnAiActivity } from "@/hooks/useLearnAiActivity";
import { useHabits } from "@/features/habits/useHabits";
import { useDocuments } from "@/features/documents/useDocuments";
import { priorityEngine } from "./priorityEngine";
import { personalizationEngine } from "./personalizationEngine";
import { signalEngine } from "./signalEngine";
import { workspaceEngine } from "./workspaceEngine";
import type {
  Workspace,
  WorkspaceChatSignal,
  WorkspaceDataLoadingState,
  WorkspaceLearnAiSignal,
} from "./workspaceTypes";

export function useWorkspace(): Workspace {
  const { events, isLoading: isEventsLoading } = useEvents();
  const { tasks, isLoading: isTasksLoading } = useTasks();
  const { transactions, isLoading: isFinanceLoading } = useFinance();
  const { sessions, isLoading: isChatLoading } = useChatSessions();
  const habitsQuery = useHabits();
  const documentsState = useDocuments();
  const learnAiActivityQuery = useLearnAiActivity();

  return useMemo(() => {
    const loading: WorkspaceDataLoadingState = {
      tasks: isTasksLoading,
      events: isEventsLoading,
      finance: isFinanceLoading,
      habits: habitsQuery.isLoading,
      documents: documentsState.isLoading,
      learnAi: learnAiActivityQuery.isLoading,
      chat: isChatLoading,
    };

    const learnAiActivity: WorkspaceLearnAiSignal | null =
      learnAiActivityQuery.data
        ? {
            totalQuestions: learnAiActivityQuery.data.totalQuestions,
            lastQuestion: learnAiActivityQuery.data.lastQuestion,
            mostActiveMode: learnAiActivityQuery.data.mostActiveMode,
          }
        : null;

    const chatSessions: WorkspaceChatSignal[] = sessions.map((session) => ({
      id: session.id,
      title: session.title,
      updatedAt: session.updated_at,
    }));

    const engineInput = {
      tasks,
      events,
      transactions,
      habits: habitsQuery.data ?? [],
      documents: documentsState.documents,
      learnAiActivity,
      loading,
    };

    const signals = signalEngine(engineInput);
    const personalization = personalizationEngine(engineInput, signals);
    const priority = priorityEngine(signals, personalization);

    return workspaceEngine({
      ...engineInput,
      chatSessions,
      signals,
      personalization,
      priority,
    });
  }, [
    documentsState.documents,
    documentsState.isLoading,
    events,
    habitsQuery.data,
    habitsQuery.isLoading,
    isChatLoading,
    isEventsLoading,
    isFinanceLoading,
    isTasksLoading,
    learnAiActivityQuery.data,
    learnAiActivityQuery.isLoading,
    sessions,
    tasks,
    transactions,
  ]);
}
