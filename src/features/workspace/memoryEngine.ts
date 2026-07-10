import type {
  WorkspaceChatSignal,
  WorkspaceDomainUsageMemory,
  WorkspaceMemory,
  WorkspaceMemoryConfidence,
  WorkspaceMemoryEngineInput,
  WorkspaceMemoryEngineResult,
  WorkspaceMemoryInsights,
  WorkspacePriorityConfidence,
  WorkspaceSignal,
  WorkspaceSignalDomain,
  WorkspaceUsageWindow,
} from "./workspaceTypes";

const MAX_RECENT_DOMAINS = 10;
const MAX_ACTION_MEMORY = 30;
const MAX_WORKSPACE_HISTORY = 14;
const MAX_DOMAIN_TIMESTAMPS = 20;

const workspaceDomains: WorkspaceSignalDomain[] = [
  "tasks",
  "calendar",
  "finance",
  "habits",
  "documents",
  "learning",
];

function cloneMemory(memory: WorkspaceMemory): WorkspaceMemory {
  return {
    ...memory,
    recentDomains: [...memory.recentDomains],
    domainUsage: Object.fromEntries(
      workspaceDomains.map((domain) => [
        domain,
        {
          ...memory.domainUsage[domain],
          recentOpenTimestamps: [
            ...(memory.domainUsage[domain]?.recentOpenTimestamps ?? []),
          ],
        },
      ]),
    ) as WorkspaceMemory["domainUsage"],
    lastOpenedItems: { ...memory.lastOpenedItems },
    preferredUsageWindows: {
      morning: { ...memory.preferredUsageWindows.morning },
      afternoon: { ...memory.preferredUsageWindows.afternoon },
      evening: { ...memory.preferredUsageWindows.evening },
      night: { ...memory.preferredUsageWindows.night },
    },
    recentSuggestedActions: [...memory.recentSuggestedActions],
    dismissedSuggestedActions: [...memory.dismissedSuggestedActions],
    completedSuggestedActions: [...memory.completedSuggestedActions],
    recentInteractions: memory.recentInteractions.map((interaction) => ({
      ...interaction,
      metadata: interaction.metadata ? { ...interaction.metadata } : undefined,
    })),
    interactionCountsByType: { ...memory.interactionCountsByType },
    interactionCountsByDomain: { ...memory.interactionCountsByDomain },
    lastConversation: memory.lastConversation
      ? { ...memory.lastConversation }
      : undefined,
    lastLearningContext: memory.lastLearningContext
      ? { ...memory.lastLearningContext }
      : undefined,
    workspaceHistory: memory.workspaceHistory.map((entry) => ({
      ...entry,
      secondaryDomains: [...entry.secondaryDomains],
    })),
  };
}

function usageWindowForDate(date: Date): WorkspaceUsageWindow {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function confidenceForHistory(memory: WorkspaceMemory): WorkspaceMemoryConfidence {
  const activeDomainCount = workspaceDomains.filter(
    (domain) => memory.domainUsage[domain].openCount >= 2,
  ).length;
  const distinctHistoryDays = new Set(
    memory.workspaceHistory.map((entry) => entry.generatedAt.slice(0, 10)),
  ).size;

  if (distinctHistoryDays >= 4 && activeDomainCount >= 3) return "high";
  if (memory.workspaceHistory.length >= 3 || activeDomainCount >= 2) return "medium";
  return "low";
}

function priorityConfidenceForSignal(signal: WorkspaceSignal): WorkspacePriorityConfidence {
  if (signal.score >= 75) return "high";
  if (signal.score >= 50) return "medium";
  return "low";
}

function orderedCurrentSignals(signals: WorkspaceSignal[]) {
  return [...signals].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.score - a.score;
  });
}

function mergeRecentDomains(
  previousDomains: WorkspaceSignalDomain[],
  currentDomains: WorkspaceSignalDomain[],
) {
  const next: WorkspaceSignalDomain[] = [];
  for (const domain of [...currentDomains, ...previousDomains]) {
    if (!next.includes(domain)) next.push(domain);
  }
  return next.slice(0, MAX_RECENT_DOMAINS);
}

function updateDomainUsage(
  entry: WorkspaceDomainUsageMemory,
  timestamp: string,
): WorkspaceDomainUsageMemory {
  return {
    openCount: entry.openCount + 1,
    lastOpenedAt: timestamp,
    recentOpenTimestamps: [...entry.recentOpenTimestamps, timestamp].slice(
      -MAX_DOMAIN_TIMESTAMPS,
    ),
  };
}

function hasRecentEquivalentHistory(
  memory: WorkspaceMemory,
  primaryDomain: WorkspaceSignalDomain,
  timestamp: string,
) {
  const lastEntry = memory.workspaceHistory[memory.workspaceHistory.length - 1];
  if (!lastEntry) return false;
  const lastTime = new Date(lastEntry.generatedAt).getTime();
  const nextTime = new Date(timestamp).getTime();
  const isSameDomain = lastEntry.primaryDomain === primaryDomain;
  const isWithinSessionWindow = nextTime - lastTime < 5 * 60_000;
  return isSameDomain && isWithinSessionWindow;
}

function latestConversation(chatSessions: WorkspaceChatSignal[]) {
  return [...chatSessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0];
}

function createInsights(memory: WorkspaceMemory, now = new Date()): WorkspaceMemoryInsights {
  const interactionDomains = workspaceDomains
    .filter((domain) => (memory.interactionCountsByDomain[domain] ?? 0) >= 2)
    .sort(
      (a, b) =>
        (memory.interactionCountsByDomain[b] ?? 0) -
        (memory.interactionCountsByDomain[a] ?? 0),
    );
  const familiarDomains = workspaceDomains
    .filter(
      (domain) =>
        memory.domainUsage[domain].openCount >= 2 ||
        interactionDomains.includes(domain),
    )
    .sort(
      (a, b) =>
        memory.domainUsage[b].openCount +
        (memory.interactionCountsByDomain[b] ?? 0) -
        (memory.domainUsage[a].openCount + (memory.interactionCountsByDomain[a] ?? 0)),
    );
  const currentWindow = usageWindowForDate(now);
  const preferredTimeDomains = workspaceDomains
    .filter((domain) => (memory.preferredUsageWindows[currentWindow][domain] ?? 0) >= 2)
    .sort(
      (a, b) =>
        (memory.preferredUsageWindows[currentWindow][b] ?? 0) -
        (memory.preferredUsageWindows[currentWindow][a] ?? 0),
    );
  const repeatedActionPatterns = workspaceDomains.filter((domain) =>
    memory.recentSuggestedActions.some(
      (action) => action.domain === domain && action.status !== "dismissed",
    ) ||
    memory.recentInteractions.filter(
      (interaction) =>
        interaction.domain === domain &&
        (interaction.type === "action_clicked" ||
          interaction.type === "skill_opened" ||
          interaction.type === "learning_continued" ||
          interaction.type === "recommendation_opened"),
    ).length >= 2,
  );
  const confidence = confidenceForHistory(memory);
  const evidence: string[] = [];

  if (memory.recentDomains.length > 0) {
    evidence.push(`Recent workspace domains: ${memory.recentDomains.slice(0, 3).join(", ")}.`);
  }
  if (familiarDomains.length > 0) {
    evidence.push(`Familiar domains: ${familiarDomains.slice(0, 3).join(", ")}.`);
  }
  if (preferredTimeDomains.length > 0) {
    evidence.push(`Repeated ${currentWindow} activity found.`);
  }
  if (memory.lastPrimaryDomain) {
    evidence.push(`Previous primary domain: ${memory.lastPrimaryDomain}.`);
  }
  if (memory.lastLearningContext) {
    evidence.push("Lightweight learning continuity is available.");
  }
  if (interactionDomains.length > 0) {
    evidence.push(`Recent interaction domains: ${interactionDomains.slice(0, 3).join(", ")}.`);
  }

  return {
    recentDomains: memory.recentDomains,
    familiarDomains,
    preferredTimeDomains,
    lastPrimaryDomain: memory.lastPrimaryDomain,
    repeatedActionPatterns,
    interactionDomains,
    learningContinuity: memory.lastLearningContext,
    confidence,
    evidence: evidence.slice(0, 8),
  };
}

export function memoryEngine(input: WorkspaceMemoryEngineInput): WorkspaceMemoryEngineResult {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const orderedSignals = orderedCurrentSignals(input.signals);
  const currentDomains = orderedSignals.map((signal) => signal.domain);
  const primarySignal = orderedSignals[0];
  const primaryDomain = primarySignal?.domain ?? input.existingMemory.lastPrimaryDomain;
  const secondaryDomains = currentDomains
    .filter((domain) => domain !== primaryDomain)
    .filter((domain, index, domains) => domains.indexOf(domain) === index)
    .slice(0, 3);
  const nextMemory = cloneMemory(input.existingMemory);
  let hasChanges = false;

  if (currentDomains.length > 0) {
    nextMemory.recentDomains = mergeRecentDomains(nextMemory.recentDomains, currentDomains);
    const currentWindow = usageWindowForDate(now);

    for (const domain of new Set(currentDomains)) {
      nextMemory.domainUsage[domain] = updateDomainUsage(
        nextMemory.domainUsage[domain],
        timestamp,
      );
      nextMemory.preferredUsageWindows[currentWindow][domain] =
        (nextMemory.preferredUsageWindows[currentWindow][domain] ?? 0) + 1;
    }

    hasChanges = true;
  }

  if (primaryDomain) {
    nextMemory.lastPrimaryDomain = primaryDomain;
    if (!hasRecentEquivalentHistory(nextMemory, primaryDomain, timestamp)) {
      nextMemory.workspaceHistory = [
        ...nextMemory.workspaceHistory,
        {
          generatedAt: timestamp,
          primaryDomain,
          secondaryDomains,
          confidence: primarySignal ? priorityConfidenceForSignal(primarySignal) : "low",
        },
      ].slice(-MAX_WORKSPACE_HISTORY);
      hasChanges = true;
    }
  }

  const conversation = latestConversation(input.chatSessions);
  if (
    conversation &&
    (nextMemory.lastConversation?.id !== conversation.id ||
      nextMemory.lastConversation?.updatedAt !== conversation.updatedAt)
  ) {
    nextMemory.lastConversation = {
      id: conversation.id,
      title: conversation.title.slice(0, 120),
      updatedAt: conversation.updatedAt,
    };
    nextMemory.lastOpenedItems.conversation = {
      id: conversation.id,
      title: conversation.title.slice(0, 120),
      openedAt: conversation.updatedAt,
    };
    hasChanges = true;
  }

  if (input.learnAiActivity && input.learnAiActivity.totalQuestions > 0) {
    const nextLearningContext = {
      mode:
        input.learnAiActivity.mostActiveMode?.mode ??
        input.learnAiActivity.lastQuestion?.mode,
      totalQuestions: input.learnAiActivity.totalQuestions,
      updatedAt: input.learnAiActivity.lastQuestion?.createdAt,
    };
    const existingLearning = nextMemory.lastLearningContext;
    if (
      existingLearning?.totalQuestions !== nextLearningContext.totalQuestions ||
      existingLearning?.updatedAt !== nextLearningContext.updatedAt ||
      existingLearning?.mode !== nextLearningContext.mode
    ) {
      nextMemory.lastLearningContext = nextLearningContext;
      hasChanges = true;
    }
  }

  nextMemory.recentSuggestedActions = nextMemory.recentSuggestedActions.slice(
    -MAX_ACTION_MEMORY,
  );
  nextMemory.dismissedSuggestedActions = nextMemory.dismissedSuggestedActions.slice(
    -MAX_ACTION_MEMORY,
  );
  nextMemory.completedSuggestedActions = nextMemory.completedSuggestedActions.slice(
    -MAX_ACTION_MEMORY,
  );

  if (hasChanges) {
    nextMemory.lastWorkspaceOpenedAt = timestamp;
    nextMemory.updatedAt = timestamp;
  }

  return {
    updatedMemory: nextMemory,
    memoryInsights: createInsights(nextMemory, now),
    hasChanges,
  };
}
