import type {
  WorkspaceDecisionIntelligenceInput,
  WorkspaceDecisionProfile,
  WorkspaceDomainAffinity,
  WorkspaceInteractionFeedback,
  WorkspaceReflectionEvidence,
  WorkspaceReflectionEvidenceDomain,
  WorkspaceSignal,
  WorkspaceSignalDomain,
} from "./workspaceTypes";

const DECISION_PROFILE_VERSION = 1;
const MIN_REPEATED_EVIDENCE = 2;
const MAX_PROFILE_DOMAINS = 4;

const workspaceDomains: WorkspaceSignalDomain[] = [
  "tasks",
  "calendar",
  "learning",
  "habits",
  "finance",
  "documents",
];

function emptyAffinity(): WorkspaceDomainAffinity {
  return {
    tasks: 0,
    calendar: 0,
    learning: 0,
    habits: 0,
    finance: 0,
    documents: 0,
  };
}

function isWorkspaceDomain(
  domain: WorkspaceReflectionEvidenceDomain,
): domain is WorkspaceSignalDomain {
  return domain !== "workspace";
}

function daysBetween(now: Date, iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return Infinity;
  return Math.max(0, (now.getTime() - date.getTime()) / 86_400_000);
}

function recencyWeight(now: Date, iso: string) {
  const ageDays = daysBetween(now, iso);
  if (ageDays <= 7) return 1;
  if (ageDays <= 30) return 0.55;
  if (ageDays <= 90) return 0.2;
  return 0;
}

function usefulnessWeight(evidence: WorkspaceReflectionEvidence) {
  if (evidence.usefulness === "high") return 1;
  if (evidence.usefulness === "medium") return 0.65;
  return 0.35;
}

function progressWeight(evidence: WorkspaceReflectionEvidence) {
  return evidence.goalProgress === "supported" ? 1 : 0.6;
}

function isValidReflectionEvidence(evidence: WorkspaceReflectionEvidence, now: Date) {
  return (
    evidence.schemaVersion === DECISION_PROFILE_VERSION &&
    evidence.requestId.trim().length > 0 &&
    evidence.stepId.trim().length > 0 &&
    evidence.toolId.trim().length > 0 &&
    evidence.domain !== "workspace" &&
    recencyWeight(now, evidence.reflectedAt) > 0
  );
}

function reflectionScore(evidence: WorkspaceReflectionEvidence, now: Date) {
  return (
    recencyWeight(now, evidence.reflectedAt) *
    usefulnessWeight(evidence) *
    progressWeight(evidence)
  );
}

function sortDomains(scores: WorkspaceDomainAffinity) {
  return [...workspaceDomains].sort((a, b) => {
    const scoreDiff = scores[b] - scores[a];
    if (scoreDiff !== 0) return scoreDiff;
    return workspaceDomains.indexOf(a) - workspaceDomains.indexOf(b);
  });
}

function hasUrgentCurrentSignal(signals: WorkspaceSignal[], domain: WorkspaceSignalDomain) {
  return signals.some(
    (signal) => signal.domain === domain && signal.severity === "high",
  );
}

function repeatedDomains(
  scores: WorkspaceDomainAffinity,
  counts: WorkspaceDomainAffinity,
  minScore: number,
) {
  return sortDomains(scores)
    .filter((domain) => counts[domain] >= MIN_REPEATED_EVIDENCE)
    .filter((domain) => scores[domain] >= minScore)
    .slice(0, MAX_PROFILE_DOMAINS);
}

function interactionDecisionScores(feedback: WorkspaceInteractionFeedback) {
  const preferred = emptyAffinity();
  const avoided = emptyAffinity();

  if (feedback.confidence !== "low") {
    for (const domain of feedback.recentInteractionDomains.slice(0, MAX_PROFILE_DOMAINS)) {
      preferred[domain] += Math.min(1, feedback.domainEngagement[domain] / 35);
    }
  }

  for (const domain of feedback.avoidedDomains.slice(0, MAX_PROFILE_DOMAINS)) {
    avoided[domain] += feedback.confidence === "high" ? 1 : 0.5;
  }

  return { preferred, avoided };
}

function confidenceForEvidence(totalWeight: number, repeatedDomainCount: number) {
  if (totalWeight >= 6 && repeatedDomainCount >= 3) return "high";
  if (totalWeight >= 2.5 && repeatedDomainCount >= 1) return "medium";
  return "low";
}

export function decisionIntelligenceEngine(
  input: WorkspaceDecisionIntelligenceInput,
): WorkspaceDecisionProfile {
  const now = input.now ?? new Date();
  const successScores = emptyAffinity();
  const emptyScores = emptyAffinity();
  const successCounts = emptyAffinity();
  const emptyCounts = emptyAffinity();
  const recentSuccessScores = emptyAffinity();
  const recentEmptyScores = emptyAffinity();
  const evidence = input.reflectionEvidence ?? input.memory.recentReflectionEvidence;

  for (const item of evidence) {
    if (!isValidReflectionEvidence(item, now)) continue;
    if (!isWorkspaceDomain(item.domain)) continue;

    const score = reflectionScore(item, now);
    if (score <= 0) continue;

    if (item.outcome === "successful") {
      successScores[item.domain] += score;
      successCounts[item.domain] += 1;
      if (daysBetween(now, item.reflectedAt) <= 30) {
        recentSuccessScores[item.domain] += score;
      }
    } else if (item.outcome === "empty") {
      emptyScores[item.domain] += score;
      emptyCounts[item.domain] += 1;
      if (daysBetween(now, item.reflectedAt) <= 30) {
        recentEmptyScores[item.domain] += score;
      }
    }
  }

  const interactionScores = interactionDecisionScores(input.interactionFeedback);
  for (const domain of workspaceDomains) {
    successScores[domain] += interactionScores.preferred[domain];
    emptyScores[domain] += interactionScores.avoided[domain];
  }

  const repeatedSuccessDomains = repeatedDomains(successScores, successCounts, 0.8);
  const repeatedEmptyDomains = repeatedDomains(emptyScores, emptyCounts, 0.55);
  const avoidedDomains = sortDomains(emptyScores)
    .filter((domain) => emptyCounts[domain] >= MIN_REPEATED_EVIDENCE)
    .filter((domain) => emptyScores[domain] > successScores[domain])
    .filter((domain) => !hasUrgentCurrentSignal(input.signals, domain))
    .slice(0, MAX_PROFILE_DOMAINS);
  const preferredDomains = repeatedSuccessDomains
    .filter((domain) => !avoidedDomains.includes(domain))
    .filter((domain) => successScores[domain] > emptyScores[domain])
    .slice(0, MAX_PROFILE_DOMAINS);
  const reliableDomains = repeatedSuccessDomains
    .filter((domain) => successScores[domain] >= emptyScores[domain] + 0.5)
    .slice(0, MAX_PROFILE_DOMAINS);
  const recentSuccessDomains = sortDomains(recentSuccessScores)
    .filter((domain) => successCounts[domain] >= MIN_REPEATED_EVIDENCE)
    .filter((domain) => recentSuccessScores[domain] > 0)
    .slice(0, MAX_PROFILE_DOMAINS);
  const recentEmptyDomains = sortDomains(recentEmptyScores)
    .filter((domain) => emptyCounts[domain] >= MIN_REPEATED_EVIDENCE)
    .filter((domain) => recentEmptyScores[domain] > 0)
    .filter((domain) => !hasUrgentCurrentSignal(input.signals, domain))
    .slice(0, MAX_PROFILE_DOMAINS);
  const totalWeight =
    Object.values(successScores).reduce((sum, value) => sum + value, 0) +
    Object.values(emptyScores).reduce((sum, value) => sum + value, 0);
  const repeatedDomainCount = new Set([
    ...preferredDomains,
    ...avoidedDomains,
    ...reliableDomains,
  ]).size;
  const lowData = totalWeight < 2 || repeatedDomainCount === 0;

  return {
    version: DECISION_PROFILE_VERSION,
    preferredDomains: lowData ? [] : preferredDomains,
    avoidedDomains: lowData ? [] : avoidedDomains,
    reliableDomains: lowData ? [] : reliableDomains,
    recentSuccessDomains: lowData ? [] : recentSuccessDomains,
    recentEmptyDomains: lowData ? [] : recentEmptyDomains,
    decisionConfidence: lowData
      ? "low"
      : confidenceForEvidence(totalWeight, repeatedDomainCount),
    lowData,
  };
}
