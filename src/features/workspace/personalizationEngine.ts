import type {
  WorkspaceDomainAffinity,
  WorkspaceInteractionFeedback,
  WorkspaceMemoryInsights,
  WorkspacePersonalizationConfidence,
  WorkspacePersonalizationModel,
  WorkspaceSignal,
  WorkspaceSignalDomain,
  WorkspaceSignalEngineInput,
} from "./workspaceTypes";

const workspaceDomains: WorkspaceSignalDomain[] = [
  "tasks",
  "calendar",
  "learning",
  "habits",
  "finance",
  "documents",
];

function createEmptyAffinity(): WorkspaceDomainAffinity {
  return {
    tasks: 0,
    calendar: 0,
    learning: 0,
    habits: 0,
    finance: 0,
    documents: 0,
  };
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getUnknownDate(value: unknown): Date | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const dateValue =
    record.updatedAt ??
    record.updated_at ??
    record.createdAt ??
    record.created_at ??
    record.date ??
    record.dateTimeStart;

  if (typeof dateValue !== "string") return null;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / 86_400_000;
}

function countRecentUnknown(items: unknown[], now: Date, windowDays = 14) {
  return items.filter((item) => {
    const date = getUnknownDate(item);
    return date ? daysBetween(now, date) <= windowDays : false;
  }).length;
}

function confidenceForEvidence(totalSignals: number): WorkspacePersonalizationConfidence {
  if (totalSignals >= 20) return "high";
  if (totalSignals >= 8) return "medium";
  return "low";
}

function sortedDomainsByScore(scores: WorkspaceDomainAffinity) {
  return [...workspaceDomains].sort((a, b) => scores[b] - scores[a]);
}

function memoryInfluenceForConfidence(confidence: WorkspaceMemoryInsights["confidence"]) {
  if (confidence === "high") return 0.18;
  if (confidence === "medium") return 0.1;
  return 0.04;
}

export function personalizationEngine(
  input: WorkspaceSignalEngineInput,
  signals: WorkspaceSignal[],
  memoryInsights?: WorkspaceMemoryInsights,
  interactionFeedback?: WorkspaceInteractionFeedback,
): WorkspacePersonalizationModel {
  const now = input.now ?? new Date();
  const generatedAt = now.toISOString();
  const affinity = createEmptyAffinity();
  const evidence: string[] = [];
  const recentCounts = createEmptyAffinity();

  const addAffinity = (
    domain: WorkspaceSignalDomain,
    score: number,
    evidenceLine?: string,
  ) => {
    affinity[domain] = clampScore(affinity[domain] + score);
    if (evidenceLine) evidence.push(evidenceLine);
  };

  const openTasks = input.tasks.filter((task) => !task.completed);
  const olderOpenTasks = openTasks.filter(
    (task) => daysBetween(now, new Date(task.createdAt)) >= 7,
  );
  const recentTasks = input.tasks.filter(
    (task) => daysBetween(now, new Date(task.createdAt)) <= 14,
  ).length;
  recentCounts.tasks = recentTasks;
  addAffinity("tasks", input.tasks.length * 2);
  if (recentTasks > 0) {
    addAffinity("tasks", Math.min(18, recentTasks * 3), "Recent task activity increased task affinity.");
  }
  if (olderOpenTasks.length >= 2) {
    addAffinity(
      "tasks",
      Math.min(24, olderOpenTasks.length * 4),
      "Repeated older open tasks increased task affinity.",
    );
  }

  const recentEvents = input.events.filter(
    (event) => daysBetween(now, new Date(event.dateTimeStart)) <= 14,
  ).length;
  recentCounts.calendar = recentEvents;
  addAffinity("calendar", input.events.length * 2);
  if (recentEvents > 0) {
    addAffinity("calendar", Math.min(18, recentEvents * 3), "Recent calendar activity increased calendar affinity.");
  }

  const recentTransactions = input.transactions.filter(
    (transaction) => daysBetween(now, new Date(transaction.date)) <= 30,
  ).length;
  recentCounts.finance = recentTransactions;
  addAffinity("finance", input.transactions.length * 2);
  if (recentTransactions >= 3) {
    addAffinity(
      "finance",
      Math.min(28, recentTransactions * 4),
      "Frequent finance activity increased finance affinity.",
    );
  }

  const recentHabits = countRecentUnknown(input.habits, now, 14);
  recentCounts.habits = recentHabits;
  addAffinity("habits", input.habits.length * 2);
  if (recentHabits > 0) {
    addAffinity("habits", Math.min(18, recentHabits * 3), "Recent habit activity increased habit affinity.");
  }

  const recentDocuments = countRecentUnknown(input.documents, now, 30);
  recentCounts.documents = recentDocuments;
  addAffinity("documents", input.documents.length * 2);
  if (recentDocuments > 0) {
    addAffinity(
      "documents",
      Math.min(24, recentDocuments * 4),
      "Recent document activity increased document affinity.",
    );
  }

  const learningCount = input.learnAiActivity?.totalQuestions ?? 0;
  const recentLearning =
    input.learnAiActivity?.lastQuestion &&
    daysBetween(now, new Date(input.learnAiActivity.lastQuestion.createdAt)) <= 30
      ? 1
      : 0;
  recentCounts.learning = recentLearning;
  addAffinity("learning", learningCount * 2);
  if (learningCount > 0) {
    addAffinity(
      "learning",
      Math.min(28, 12 + learningCount),
      "Active learning history increased learning affinity.",
    );
  }
  if (input.learnAiActivity?.lastQuestion) {
    addAffinity(
      "learning",
      10,
      "Unfinished learning context increased learning affinity.",
    );
  }

  for (const signal of signals) {
    if (signal.severity === "high") {
      addAffinity(signal.domain, 8);
    } else if (signal.severity === "medium") {
      addAffinity(signal.domain, 4);
    }
  }

  const isOnboarding = signals.some((signal) => signal.id === "learning:onboarding");
  if (memoryInsights && !isOnboarding) {
    const memoryWeight = memoryInfluenceForConfidence(memoryInsights.confidence);
    const addMemoryAffinity = (
      domains: WorkspaceSignalDomain[],
      score: number,
      evidenceLine: string,
    ) => {
      if (domains.length === 0) return;
      for (const domain of domains) {
        addAffinity(domain, score * memoryWeight);
      }
      evidence.push(evidenceLine);
    };

    addMemoryAffinity(
      memoryInsights.recentDomains.slice(0, 3),
      18,
      "Recent memory added weak preference evidence.",
    );
    addMemoryAffinity(
      memoryInsights.familiarDomains.slice(0, 3),
      14,
      "Repeated memory added weak familiarity evidence.",
    );
    addMemoryAffinity(
      memoryInsights.preferredTimeDomains.slice(0, 2),
      10,
      "Time-of-day memory added weak preference evidence.",
    );
    addMemoryAffinity(
      memoryInsights.interactionDomains.slice(0, 3),
      12,
      "Recent interactions added weak behavior evidence.",
    );
    if (memoryInsights.learningContinuity) {
      addAffinity(
        "learning",
        12 * memoryWeight,
        "Learning memory added weak continuity evidence.",
      );
    }
    if (memoryInsights.recentReflectedDomains.length > 0) {
      for (const domain of memoryInsights.recentReflectedDomains.slice(0, 3)) {
        if (domain === "workspace") continue;
        const engagement = memoryInsights.reflectionEngagementByDomain[domain] ?? 0;
        addAffinity(domain, Math.min(6, engagement * 2));
      }
      evidence.push("Read-only reflection added weak continuity evidence.");
    }
  }

  if (interactionFeedback && !isOnboarding) {
    const feedbackWeight =
      interactionFeedback.confidence === "high"
        ? 0.18
        : interactionFeedback.confidence === "medium"
          ? 0.1
          : 0.04;

    for (const domain of interactionFeedback.recentInteractionDomains.slice(0, 3)) {
      addAffinity(
        domain,
        interactionFeedback.domainEngagement[domain] * feedbackWeight,
      );
    }

    for (const domain of interactionFeedback.avoidedDomains.slice(0, 2)) {
      affinity[domain] = clampScore(affinity[domain] - 6 * feedbackWeight);
    }

    if (interactionFeedback.repeatedInteractionPatterns.length > 0) {
      evidence.push("Interaction feedback added weak repeated behavior evidence.");
    }
    if (interactionFeedback.avoidedDomains.length > 0) {
      evidence.push("Explicit dismissals reduced weak interaction preference.");
    }
  }

  const totalSignals =
    input.tasks.length +
    input.events.length +
    input.transactions.length +
    input.habits.length +
    input.documents.length +
    learningCount;
  const recentDomains = sortedDomainsByScore(recentCounts).filter(
    (domain) => recentCounts[domain] > 0,
  );
  const preferredDomains = sortedDomainsByScore(affinity).filter(
    (domain) => affinity[domain] >= 12,
  );

  if (totalSignals < 5) {
    evidence.push("Sparse data keeps personalization confidence low.");
  }

  return {
    domainAffinity: affinity,
    recentDomains,
    preferredDomains,
    confidence: confidenceForEvidence(totalSignals),
    evidence: evidence.slice(0, 8),
    generatedAt,
  };
}
