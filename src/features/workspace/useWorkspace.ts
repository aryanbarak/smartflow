import { useEffect, useMemo, useRef } from "react";
import { useEvents } from "@/hooks/useEvents";
import { useTasks } from "@/hooks/useTasks";
import { useFinance } from "@/hooks/useFinance";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useLearnAiActivity } from "@/hooks/useLearnAiActivity";
import { useHabits } from "@/features/habits/useHabits";
import { useDocuments } from "@/features/documents/useDocuments";
import { approvalEngine } from "./approvalEngine";
import { goalEngine } from "./goalEngine";
import { interactionFeedbackEngine } from "./interactionFeedbackEngine";
import { memoryEngine } from "./memoryEngine";
import { plannerEngine } from "./plannerEngine";
import { priorityEngine } from "./priorityEngine";
import { personalizationEngine } from "./personalizationEngine";
import { signalEngine } from "./signalEngine";
import { loadWorkspaceMemory, saveWorkspaceMemory } from "./workspaceMemoryStorage";
import { workspaceEngine } from "./workspaceEngine";
import type {
  Workspace,
  WorkspaceChatSignal,
  WorkspaceDataLoadingState,
  WorkspaceLearnAiSignal,
} from "./workspaceTypes";

export function useWorkspace(): Workspace {
  const workspaceMemoryRef = useRef<ReturnType<typeof loadWorkspaceMemory> | null>(null);
  if (!workspaceMemoryRef.current) {
    workspaceMemoryRef.current = loadWorkspaceMemory();
  }

  const { events, isLoading: isEventsLoading } = useEvents();
  const { tasks, isLoading: isTasksLoading } = useTasks();
  const { transactions, isLoading: isFinanceLoading } = useFinance();
  const { sessions, isLoading: isChatLoading } = useChatSessions();
  const habitsQuery = useHabits();
  const documentsState = useDocuments();
  const learnAiActivityQuery = useLearnAiActivity();

  const workspaceState = useMemo(() => {
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
    const memoryResult = memoryEngine({
      ...engineInput,
      signals,
      existingMemory: workspaceMemoryRef.current ?? loadWorkspaceMemory(),
      chatSessions,
    });
    const interactionFeedback = interactionFeedbackEngine(
      memoryResult.updatedMemory,
      engineInput.now,
    );
    const personalization = personalizationEngine(
      engineInput,
      signals,
      memoryResult.memoryInsights,
      interactionFeedback,
    );
    const priority = priorityEngine(signals, personalization, interactionFeedback);
    const goal = goalEngine({
      ...engineInput,
      signals,
      priority,
      personalization,
      memoryInsights: memoryResult.memoryInsights,
      interactionFeedback,
    });
    const plan = plannerEngine({
      ...engineInput,
      goal,
      signals,
    });
    const approval = approvalEngine({
      ...engineInput,
      plan,
    });

    return {
      workspace: workspaceEngine({
        ...engineInput,
        chatSessions,
        signals,
        personalization,
        priority,
        interactionFeedback,
        goal,
        plan,
        approval,
      }),
      memoryResult,
    };
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

  useEffect(() => {
    if (!workspaceState.memoryResult.hasChanges) return;
    if (saveWorkspaceMemory(workspaceState.memoryResult.updatedMemory)) {
      workspaceMemoryRef.current = workspaceState.memoryResult.updatedMemory;
    }
  }, [workspaceState.memoryResult]);

  return workspaceState.workspace;
}
