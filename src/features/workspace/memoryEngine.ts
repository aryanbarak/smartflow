import type {
  WorkspaceChatSignal,
  WorkspaceDomainUsageMemory,
  WorkspaceMemory,
  WorkspaceMemoryConfidence,
  WorkspaceMemoryEngineInput,
  WorkspaceMemoryEngineResult,
  WorkspaceMemoryInsights,
  WorkspaceReflectionEvidence,
  WorkspaceReflectionEvidenceDomain,
  WorkspacePriorityConfidence,
  WorkspaceSignal,
  WorkspaceSignalDomain,
  WorkspaceUsageWindow,
} from "./workspaceTypes";

const MAX_RECENT_DOMAINS = 10;
const MAX_ACTION_MEMORY = 30;
const MAX_WORKSPACE_HISTORY = 14;
const MAX_DOMAIN_TIMESTAMPS = 20;
const REFLECTION_RECENT_DAYS = 30;

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
    recentReflectionEvidence: memory.recentReflectionEvidence.map((item) => ({ ...item })),
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

function daysBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / 86_400_000;
}

function reflectionWeight(item: WorkspaceReflectionEvidence, now: Date) {
  const reflectedAt = new Date(item.reflectedAt);
  if (Number.isNaN(reflectedAt.getTime())) return 0;
  const age = daysBetween(now, reflectedAt);
  if (age > REFLECTION_RECENT_DAYS) return 0;
  const freshness = age <= 7 ? 1 : 0.35;
  const usefulness =
    item.usefulness === "high" ? 1 : item.usefulness === "medium" ? 0.65 : 0.35;
  const progress = item.goalProgress === "supported" ? 1 : 0.6;
  const outcome = item.outcome === "successful" ? 1 : 0.45;
  const domainWeight = item.domain === "workspace" ? 0.25 : 1;
  return freshness * usefulness * progress * outcome * domainWeight;
}

function reflectionInsights(
  evidence: WorkspaceReflectionEvidence[],
  now: Date,
) {
  const engagement: Partial<Record<WorkspaceReflectionEvidenceDomain, number>> = {};

  for (const item of evidence) {
    const weight = reflectionWeight(item, now);
    if (weight <= 0) continue;
    engagement[item.domain] = (engagement[item.domain] ?? 0) + weight;
  }

  const recentReflectedDomains = Object.entries(engagement)
    .sort(([, a], [, b]) => b - a)
    .map(([domain]) => domain as WorkspaceReflectionEvidenceDomain);
  const totalWeight = Object.values(engagement).reduce((sum, value) => sum + value, 0);

  return {
    recentReflectedDomains,
    reflectionEngagementByDomain: engagement,
    reflectionContinuityConfidence:
      totalWeight >= 4 ? "medium" : totalWeight >= 1.5 ? "low" : "low",
  } satisfies Pick<
    WorkspaceMemoryInsights,
    "recentReflectedDomains" | "reflectionEngagementByDomain" | "reflectionContinuityConfidence"
  >;
}

function createInsights(memory: WorkspaceMemory, now = new Date()): WorkspaceMemoryInsights {
  const reflections = reflectionInsights(memory.recentReflectionEvidence, now);
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
  if (reflections.recentReflectedDomains.length > 0) {
    evidence.push(
      `Recent read-only reflection evidence: ${reflections.recentReflectedDomains.slice(0, 3).join(", ")}.`,
    );
  }

  return {
    recentDomains: memory.recentDomains,
    familiarDomains,
    preferredTimeDomains,
    lastPrimaryDomain: memory.lastPrimaryDomain,
    repeatedActionPatterns,
    interactionDomains,
    recentReflectedDomains: reflections.recentReflectedDomains,
    reflectionEngagementByDomain: reflections.reflectionEngagementByDomain,
    reflectionContinuityConfidence: reflections.reflectionContinuityConfidence,
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
