import type {
  WorkspaceGoal,
  WorkspaceGoalEngineInput,
  WorkspacePriorityConfidence,
  WorkspaceSignal,
  WorkspaceSignalDomain,
} from "./workspaceTypes";

const MAX_SUPPORTING_DOMAINS = 2;
const MAX_DAILY_GOAL_EFFORT_MINUTES = 90;

function confidenceScore(confidence: WorkspacePriorityConfidence) {
  if (confidence === "high") return 2;
  if (confidence === "medium") return 1;
  return 0;
}

function signalConfidenceScore(signal?: WorkspaceSignal) {
  if (!signal) return 0;
  if (signal.severity === "high" || signal.score >= 75) return 2;
  if (signal.severity === "medium" || signal.score >= 50) return 1;
  return 0;
}

function clampEffort(minutes: number) {
  return Math.max(15, Math.min(MAX_DAILY_GOAL_EFFORT_MINUTES, minutes));
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function primarySignalFor(input: WorkspaceGoalEngineInput) {
  return input.signals.find(
    (signal) => signal.domain === input.priority.primaryDomain,
  );
}

function isOnboarding(input: WorkspaceGoalEngineInput) {
  return input.signals.some((signal) => signal.id === "learning:onboarding");
}

function allSignalsWeak(input: WorkspaceGoalEngineInput) {
  return (
    input.signals.length === 0 ||
    input.signals.every((signal) => signal.severity === "low")
  );
}

function supportingDomainsFor(input: WorkspaceGoalEngineInput) {
  const currentSignalDomains = new Set(input.signals.map((signal) => signal.domain));
  return input.priority.secondaryDomains
    .filter((domain) => domain !== input.priority.primaryDomain)
    .filter((domain) => currentSignalDomains.has(domain))
    .slice(0, MAX_SUPPORTING_DOMAINS);
}

function effortFor(primaryDomain: WorkspaceSignalDomain, signal?: WorkspaceSignal) {
  if (signal?.severity === "high") return clampEffort(75);
  if (signal?.severity === "medium") return clampEffort(45);
  if (primaryDomain === "learning") return clampEffort(30);
  return clampEffort(25);
}

function confidenceFor(input: WorkspaceGoalEngineInput, signal?: WorkspaceSignal) {
  if (isOnboarding(input)) return "medium";

  const supportCount = supportingDomainsFor(input).length;
  const score =
    confidenceScore(input.priority.confidence) +
    signalConfidenceScore(signal) +
    confidenceScore(input.memoryInsights.confidence) +
    confidenceScore(input.personalization.confidence) +
    confidenceScore(input.interactionFeedback.confidence) * 0.5 +
    (supportCount > 0 ? 0.5 : 0);

  if (score >= 6 && signal?.severity === "high") return "high";
  if (score >= 3) return "medium";
  return "low";
}

function domainGoalCopy(
  primaryDomain: WorkspaceSignalDomain,
  signal?: WorkspaceSignal,
): Pick<WorkspaceGoal, "title" | "summary" | "successCriteria"> {
  if (primaryDomain === "tasks" && signal?.severity === "high") {
    return {
      title: "Clear your most important active work.",
      summary: "Focus first on the active work that is creating the strongest signal today.",
      successCriteria: [
        "Complete up to 2-3 important or overdue tasks.",
        "Review the remaining active task list.",
      ],
    };
  }

  if (primaryDomain === "calendar") {
    return {
      title: "Prepare the day around your scheduled commitments.",
      summary: "Use the calendar signal to protect focus time around what is already scheduled.",
      successCriteria: [
        "Review today's events.",
        "Reserve one realistic focus block.",
        "Identify any obvious conflicts.",
      ],
    };
  }

  if (primaryDomain === "learning") {
    return {
      title: "Continue your current learning path.",
      summary: "Use the available learning signal for one focused study block before switching context.",
      successCriteria: [
        "Resume the latest unfinished learning thread.",
        "Complete one focused study block.",
      ],
    };
  }

  if (primaryDomain === "finance") {
    return {
      title: "Review the most relevant financial signals.",
      summary: "Check the current money signal without assuming a problem exists.",
      successCriteria: [
        "Review recent finance activity.",
        "Identify one item that may need attention.",
      ],
    };
  }

  if (primaryDomain === "habits") {
    return {
      title: "Protect today's core routines.",
      summary: "Keep the day steady by anchoring it around the most useful routine signal.",
      successCriteria: [
        "Complete the highest-value habit available today.",
        "Recover one missed routine if it is relevant.",
      ],
    };
  }

  if (primaryDomain === "documents") {
    return {
      title: "Process the most relevant recent document.",
      summary: "Use document context to extract one clear next action without reading document bodies.",
      successCriteria: [
        "Open or review the latest relevant document.",
        "Extract or complete one next action.",
      ],
    };
  }

  return {
    title: "Create one useful block of focused progress.",
    summary: "Use the open space for one meaningful block of work without over-planning.",
    successCriteria: [
      "Select one meaningful task or focus area.",
      "Complete one uninterrupted focus block.",
    ],
  };
}

function calmFocusGoalCopy(): Pick<WorkspaceGoal, "title" | "summary" | "successCriteria"> {
  return {
    title: "Create one useful block of focused progress.",
    summary: "Use the open space for one meaningful block of work without over-planning.",
    successCriteria: [
      "Select one meaningful task or focus area.",
      "Complete one uninterrupted focus block.",
    ],
  };
}

function constraintsFor(input: WorkspaceGoalEngineInput, signal?: WorkspaceSignal) {
  const constraints = [
    "No autonomous execution.",
    "User approval required before future action execution.",
  ];

  if (isOnboarding(input)) {
    constraints.unshift("Onboarding mode.");
  }
  if (signal?.severity === "high") {
    constraints.unshift("Urgent work first.");
  }
  if (
    input.priority.primaryDomain === "calendar" ||
    input.priority.secondaryDomains.includes("calendar")
  ) {
    constraints.push("Do not conflict with calendar commitments.");
  }
  constraints.push(`Maximum effort ${MAX_DAILY_GOAL_EFFORT_MINUTES} minutes.`);

  return constraints;
}

export function goalEngine(input: WorkspaceGoalEngineInput): WorkspaceGoal {
  const now = input.now ?? new Date();
  const generatedAt = now.toISOString();
  const onboarding = isOnboarding(input);
  const signal = primarySignalFor(input);
  const primaryDomain = onboarding ? "learning" : input.priority.primaryDomain;
  const supportingDomains = onboarding ? [] : supportingDomainsFor(input);
  const copy = onboarding
    ? {
        title: "Set up your SmartFlow workspace.",
        summary: "Add a few real signals so I can start preparing your day honestly.",
        successCriteria: [
          "Add your first task or calendar signal.",
          "Start one learning activity or add useful context.",
          "Avoid pretending personalization exists before enough data is available.",
        ],
      }
    : allSignalsWeak(input)
      ? calmFocusGoalCopy()
    : domainGoalCopy(primaryDomain, signal);
  const sourcePriorityDomains = [
    primaryDomain,
    ...supportingDomains,
  ].filter((domain, index, domains) => domains.indexOf(domain) === index);

  return {
    id: `goal:${slug(primaryDomain)}:${slug(generatedAt.slice(0, 10))}`,
    title: copy.title,
    summary: copy.summary,
    primaryDomain,
    supportingDomains,
    successCriteria: copy.successCriteria,
    estimatedEffortMinutes: onboarding ? 30 : effortFor(primaryDomain, signal),
    confidence: confidenceFor(input, signal),
    reasons: input.priority.reasons.slice(0, 4),
    constraints: constraintsFor(input, signal),
    generatedAt,
    sourceSignalIds: input.priority.orderedSignalIds.slice(0, 5),
    sourcePriorityDomains,
    status: "proposed",
  };
}
