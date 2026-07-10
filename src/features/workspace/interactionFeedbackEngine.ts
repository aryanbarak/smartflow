import type {
  WorkspaceActionEngagement,
  WorkspaceDomainAffinity,
  WorkspaceInteractionFeedback,
  WorkspaceMemory,
  WorkspaceRepeatedInteractionPattern,
  WorkspaceSignalDomain,
} from "./workspaceTypes";
import type {
  WorkspaceInteractionEvent,
  WorkspaceInteractionSource,
  WorkspaceInteractionType,
} from "./workspaceInteractionTypes";

const workspaceDomains: WorkspaceSignalDomain[] = [
  "tasks",
  "calendar",
  "learning",
  "habits",
  "finance",
  "documents",
];

const MAX_DOMAIN_SCORE = 35;
const MAX_ACTION_SCORE = 100;
const MAX_SOURCE_SCORE = 25;

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

function clamp(score: number, min = 0, max = MAX_DOMAIN_SCORE) {
  return Math.max(min, Math.min(max, Math.round(score)));
}

function daysBetween(now: Date, iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return Infinity;
  return Math.max(0, (now.getTime() - date.getTime()) / 86_400_000);
}

function recencyWeight(event: WorkspaceInteractionEvent, now: Date) {
  const ageDays = daysBetween(now, event.occurredAt);
  if (ageDays <= 1) return 1;
  if (ageDays <= 7) return 0.55;
  if (ageDays <= 30) return 0.22;
  return 0;
}

function baseWeightForType(type: WorkspaceInteractionType) {
  if (type === "action_completed") return 2.4;
  if (type === "learning_continued") return 1.4;
  if (type === "skill_opened") return 1.25;
  if (type === "action_clicked" || type === "recommendation_opened") return 1;
  if (type === "chat_opened" || type === "conversation_opened") return 0.9;
  if (type === "view_all_clicked") return 0.45;
  if (type === "action_dismissed") return -1.6;
  return 0;
}

function isEngagementEvent(type: WorkspaceInteractionType) {
  return type !== "action_dismissed";
}

function confidenceForInteractionCount(count: number) {
  if (count >= 12) return "high";
  if (count >= 5) return "medium";
  return "low";
}

function sortDomainsByScore(scores: WorkspaceDomainAffinity) {
  return [...workspaceDomains].sort((a, b) => scores[b] - scores[a]);
}

function addSourceScore(
  sources: Partial<Record<WorkspaceInteractionSource, number>>,
  source: WorkspaceInteractionSource,
  score: number,
) {
  sources[source] = clamp((sources[source] ?? 0) + score, 0, MAX_SOURCE_SCORE);
}

function createActionKey(event: WorkspaceInteractionEvent) {
  return `${event.domain}:${event.targetId}`;
}

export function interactionFeedbackEngine(
  memory: WorkspaceMemory,
  now = new Date(),
): WorkspaceInteractionFeedback {
  const domainRaw = createEmptyAffinity();
  const domainCounts = createEmptyAffinity();
  const dismissalCounts = createEmptyAffinity();
  const patternCounts = new Map<string, WorkspaceRepeatedInteractionPattern>();
  const actionMap = new Map<string, WorkspaceActionEngagement>();
  const preferredSources: Partial<Record<WorkspaceInteractionSource, number>> = {};
  const evidence: string[] = [];

  const eligibleInteractions = memory.recentInteractions.filter(
    (event) => recencyWeight(event, now) > 0,
  );

  for (const event of eligibleInteractions) {
    const decay = recencyWeight(event, now);
    const weighted = baseWeightForType(event.type) * decay;

    domainCounts[event.domain] += 1;
    if (event.type === "action_dismissed") {
      dismissalCounts[event.domain] += 1;
    } else {
      domainRaw[event.domain] += weighted;
    }

    addSourceScore(preferredSources, event.source, Math.max(0, weighted * 4));

    const actionKey = createActionKey(event);
    const existingAction = actionMap.get(actionKey) ?? {
      targetId: event.targetId,
      domain: event.domain,
      clicks: 0,
      completions: 0,
      dismissals: 0,
      lastInteractionAt: event.occurredAt,
      score: 0,
    };

    if (event.type === "action_completed") existingAction.completions += 1;
    if (event.type === "action_dismissed") existingAction.dismissals += 1;
    if (
      event.type === "action_clicked" ||
      event.type === "skill_opened" ||
      event.type === "learning_continued" ||
      event.type === "recommendation_opened" ||
      event.type === "chat_opened" ||
      event.type === "conversation_opened"
    ) {
      existingAction.clicks += 1;
    }

    if (
      new Date(event.occurredAt).getTime() >
      new Date(existingAction.lastInteractionAt ?? 0).getTime()
    ) {
      existingAction.lastInteractionAt = event.occurredAt;
    }
    existingAction.score += weighted * 12;
    actionMap.set(actionKey, existingAction);

    if (isEngagementEvent(event.type)) {
      const patternKey = `${event.domain}:${event.type}`;
      const pattern = patternCounts.get(patternKey) ?? {
        domain: event.domain,
        type: event.type,
        count: 0,
        score: 0,
      };
      pattern.count += 1;
      pattern.score += weighted * 8;
      patternCounts.set(patternKey, pattern);
    }
  }

  const domainEngagement = createEmptyAffinity();
  for (const domain of workspaceDomains) {
    const repeatedMultiplier = domainCounts[domain] <= 1 ? 0.25 : 1;
    domainEngagement[domain] = clamp(domainRaw[domain] * 7 * repeatedMultiplier);
  }

  const avoidedDomains = workspaceDomains.filter(
    (domain) => dismissalCounts[domain] >= 2,
  );
  for (const domain of avoidedDomains) {
    domainEngagement[domain] = clamp(domainEngagement[domain] - 8);
  }

  const repeatedInteractionPatterns = Array.from(patternCounts.values())
    .filter((pattern) => pattern.count >= 2)
    .map((pattern) => ({
      ...pattern,
      score: clamp(pattern.score, 0, MAX_ACTION_SCORE),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const actionEngagement = Array.from(actionMap.values())
    .map((action) => ({
      ...action,
      score: clamp(action.score, -MAX_ACTION_SCORE, MAX_ACTION_SCORE),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const recentInteractionDomains = sortDomainsByScore(domainEngagement).filter(
    (domain) => domainEngagement[domain] > 0,
  );

  if (eligibleInteractions.length > 0) {
    evidence.push(`${eligibleInteractions.length} recent workspace interaction${eligibleInteractions.length === 1 ? "" : "s"} found.`);
  }
  if (repeatedInteractionPatterns.length > 0) {
    evidence.push("Repeated interaction patterns are available as weak evidence.");
  }
  if (avoidedDomains.length > 0) {
    evidence.push(`Explicit dismissals reduced weak preference for ${avoidedDomains.slice(0, 3).join(", ")}.`);
  }

  return {
    domainEngagement,
    actionEngagement,
    repeatedInteractionPatterns,
    avoidedDomains,
    recentInteractionDomains,
    preferredSources,
    confidence: confidenceForInteractionCount(eligibleInteractions.length),
    evidence: evidence.slice(0, 8),
    generatedAt: now.toISOString(),
  };
}
