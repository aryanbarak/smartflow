import type {
  WorkspaceSignal,
  WorkspaceSignalEngineInput,
  WorkspaceSignalSeverity,
} from "./workspaceTypes";

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameCalendarDay(a: Date, b: Date) {
  return toDateOnly(a) === toDateOnly(b);
}

function severityForScore(score: number): WorkspaceSignalSeverity {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function createSignal(
  signal: Omit<WorkspaceSignal, "generatedAt" | "severity"> & {
    severity?: WorkspaceSignalSeverity;
  },
  generatedAt: string,
): WorkspaceSignal {
  return {
    ...signal,
    severity: signal.severity ?? severityForScore(signal.score),
    generatedAt,
  };
}

export function signalEngine(input: WorkspaceSignalEngineInput): WorkspaceSignal[] {
  const now = input.now ?? new Date();
  const generatedAt = now.toISOString();
  const todayKey = toDateOnly(now);
  const currentMonth = todayKey.slice(0, 7);
  const signals: WorkspaceSignal[] = [];

  const openTasks = input.tasks.filter((task) => !task.completed);
  if (openTasks.length >= 5) {
    signals.push(
      createSignal(
        {
          id: "tasks:many-open",
          domain: "tasks",
          label: "Many open tasks",
          score: Math.min(100, 70 + openTasks.length * 3),
          severity: "high",
          reason: `${openTasks.length} open tasks need prioritization.`,
          count: openTasks.length,
          createdAt: openTasks[0]?.createdAt,
        },
        generatedAt,
      ),
    );
  } else if (openTasks.length > 0) {
    signals.push(
      createSignal(
        {
          id: "tasks:open",
          domain: "tasks",
          label: "Open tasks",
          score: 45 + openTasks.length * 4,
          reason: `${openTasks.length} open task${openTasks.length === 1 ? "" : "s"} can shape today's focus.`,
          count: openTasks.length,
          createdAt: openTasks[0]?.createdAt,
        },
        generatedAt,
      ),
    );
  }

  const eventsToday = input.events.filter((event) =>
    isSameCalendarDay(new Date(event.dateTimeStart), now),
  );
  if (eventsToday.length > 0) {
    signals.push(
      createSignal(
        {
          id: "calendar:events-today",
          domain: "calendar",
          label: "Events today",
          score: Math.min(90, 55 + eventsToday.length * 10),
          reason: `${eventsToday.length} calendar event${eventsToday.length === 1 ? "" : "s"} may affect available focus time.`,
          count: eventsToday.length,
          createdAt: eventsToday[0]?.dateTimeStart,
        },
        generatedAt,
      ),
    );
  } else if (!input.loading.events) {
    signals.push(
      createSignal(
        {
          id: "calendar:focus-opportunity",
          domain: "calendar",
          label: "Focus opportunity",
          score: 42,
          severity: "low",
          reason: "No events today leaves room for deeper work.",
          count: 0,
        },
        generatedAt,
      ),
    );
  }

  const monthlyTransactions = input.transactions.filter((transaction) =>
    transaction.date.startsWith(currentMonth),
  );
  if (monthlyTransactions.length > 0) {
    signals.push(
      createSignal(
        {
          id: "finance:monthly-activity",
          domain: "finance",
          label: "Monthly finance activity",
          score: Math.min(72, 40 + monthlyTransactions.length * 6),
          reason: `${monthlyTransactions.length} finance transaction${monthlyTransactions.length === 1 ? "" : "s"} contributes to this month's signal.`,
          count: monthlyTransactions.length,
          createdAt: monthlyTransactions[0]?.date,
        },
        generatedAt,
      ),
    );
  }

  const learningCount = input.learnAiActivity?.totalQuestions ?? 0;
  if (learningCount > 0) {
    signals.push(
      createSignal(
        {
          id: "learning:active-history",
          domain: "learning",
          label: "Active learning history",
          score: Math.min(86, 48 + learningCount * 2),
          reason: `${learningCount} learning interaction${learningCount === 1 ? "" : "s"} can guide recommendations.`,
          count: learningCount,
          createdAt: input.learnAiActivity?.lastQuestion?.createdAt,
        },
        generatedAt,
      ),
    );
  }

  const totalDataSignals =
    input.tasks.length + input.events.length + input.transactions.length;
  const coreDataIsLoading =
    (input.loading.events && input.events.length === 0) ||
    (input.loading.tasks && input.tasks.length === 0) ||
    (input.loading.finance && input.transactions.length === 0);
  if (!coreDataIsLoading && totalDataSignals < 5) {
    signals.push(
      createSignal(
        {
          id: "learning:onboarding",
          domain: "learning",
          label: "Onboarding needed",
          score: 65,
          severity: "medium",
          reason: "Flow AI needs a few more workspace signals before it can prepare the day honestly.",
          count: totalDataSignals,
        },
        generatedAt,
      ),
    );
  }

  return signals.sort((a, b) => b.score - a.score);
}
