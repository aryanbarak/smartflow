import type {
  WorkspacePriorityConfidence,
  WorkspacePriorityModel,
  WorkspacePersonalizationModel,
  WorkspaceSignal,
  WorkspaceSignalDomain,
} from "./workspaceTypes";

function confidenceForScore(score: number): WorkspacePriorityConfidence {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function uniqueDomains(signals: WorkspaceSignal[]) {
  const domains: WorkspaceSignalDomain[] = [];
  for (const signal of signals) {
    if (!domains.includes(signal.domain)) domains.push(signal.domain);
  }
  return domains;
}

function severityWeight(signal: WorkspaceSignal) {
  if (signal.severity === "high") return 3;
  if (signal.severity === "medium") return 2;
  return 1;
}

function personalizedSignalScore(
  signal: WorkspaceSignal,
  personalization: WorkspacePersonalizationModel,
) {
  const personalizationBoost =
    signal.severity === "high"
      ? 0
      : (personalization.domainAffinity[signal.domain] ?? 0) * 0.25;
  return signal.score + personalizationBoost;
}

function sortSignals(
  signals: WorkspaceSignal[],
  personalization: WorkspacePersonalizationModel,
) {
  return [...signals].sort((a, b) => {
    const severityDiff = severityWeight(b) - severityWeight(a);
    if (severityDiff !== 0) return severityDiff;
    return (
      personalizedSignalScore(b, personalization) -
      personalizedSignalScore(a, personalization)
    );
  });
}

function completeSecondaryDomains(
  domains: WorkspaceSignalDomain[],
  primaryDomain: WorkspaceSignalDomain,
  personalization: WorkspacePersonalizationModel,
) {
  const orderedDomains = [...domains];
  for (const domain of personalization.preferredDomains) {
    if (!orderedDomains.includes(domain)) orderedDomains.push(domain);
  }

  return orderedDomains
    .filter((domain) => domain !== primaryDomain)
    .slice(0, 3);
}

function createMission(
  primarySignal: WorkspaceSignal,
  allSignalsLow: boolean,
): Pick<WorkspacePriorityModel, "missionTitle" | "missionSummary" | "confidence"> {
  if (primarySignal.id === "learning:onboarding") {
    return {
      missionTitle: "Set up your workspace.",
      missionSummary: "Add a few signals so I can start preparing your day honestly.",
      confidence: "medium",
    };
  }

  if (allSignalsLow) {
    return {
      missionTitle: "Keep today calm and focused.",
      missionSummary: "Use the open space for steady progress or add more workspace signals.",
      confidence: "low",
    };
  }

  if (primarySignal.domain === "tasks" && primarySignal.severity === "high") {
    return {
      missionTitle: "Clear active work first.",
      missionSummary: "Start with the task load, then review the supporting signals behind it.",
      confidence: confidenceForScore(primarySignal.score),
    };
  }

  if (primarySignal.domain === "learning" && primarySignal.severity === "high") {
    return {
      missionTitle: "Continue the learning thread.",
      missionSummary: "Use your current study momentum before switching into lighter work.",
      confidence: confidenceForScore(primarySignal.score),
    };
  }

  if (primarySignal.domain === "calendar" && primarySignal.severity === "high") {
    return {
      missionTitle: "Plan around today's schedule.",
      missionSummary: "Protect focus time around the calendar signals already in motion.",
      confidence: confidenceForScore(primarySignal.score),
    };
  }

  if (primarySignal.domain === "finance" && primarySignal.severity === "high") {
    return {
      missionTitle: "Review today's money signal.",
      missionSummary: "Check this month's finance pattern before the day moves on.",
      confidence: confidenceForScore(primarySignal.score),
    };
  }

  return {
    missionTitle: "I prepared today's workspace.",
    missionSummary: "Start with the next steps I surfaced, then review the reasoning behind them.",
    confidence: confidenceForScore(primarySignal.score),
  };
}

export function priorityEngine(
  signals: WorkspaceSignal[],
  personalization: WorkspacePersonalizationModel,
): WorkspacePriorityModel {
  const orderedSignals = sortSignals(signals, personalization);
  const onboardingSignal = orderedSignals.find(
    (signal) => signal.id === "learning:onboarding",
  );
  const primarySignal =
    onboardingSignal ??
    orderedSignals[0] ?? {
      id: "learning:calm-setup",
      domain: "learning" as const,
      label: "Calm setup",
      score: 25,
      severity: "low" as const,
      reason: "No strong workspace signal is available yet.",
      count: 0,
      generatedAt: new Date().toISOString(),
    };

  const signalOrder = onboardingSignal
    ? [onboardingSignal, ...orderedSignals.filter((signal) => signal.id !== onboardingSignal.id)]
    : orderedSignals;
  const domains = uniqueDomains(signalOrder);
  const secondaryDomains =
    onboardingSignal
      ? domains.filter((domain) => domain !== primarySignal.domain).slice(0, 3)
      : completeSecondaryDomains(domains, primarySignal.domain, personalization);
  const allSignalsLow =
    orderedSignals.length === 0 ||
    orderedSignals.every((signal) => signal.severity === "low");
  const mission = createMission(primarySignal, allSignalsLow);

  return {
    primaryDomain: primarySignal.domain,
    secondaryDomains,
    missionTitle: mission.missionTitle,
    missionSummary: mission.missionSummary,
    confidence: mission.confidence,
    reasons: signalOrder.slice(0, 4).map((signal) => signal.reason),
    orderedSignalIds: signalOrder.map((signal) => signal.id),
  };
}
