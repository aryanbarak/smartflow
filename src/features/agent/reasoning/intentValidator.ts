import type { SupportedAiResponseLanguage } from "@/features/ai/responseLanguage";
import {
  AGENT_INTENT_SCHEMA_VERSION,
  type AgentIntentConfidence,
  type AgentIntentDomain,
  type AgentIntentProposal,
  type AgentIntentType,
  type AgentReasoningSafeContext,
  type AgentReasoningValidationResult,
} from "./reasoningTypes";

const supportedIntentTypes: AgentIntentType[] = [
  "inspect_tasks",
  "inspect_calendar",
  "inspect_learning",
  "inspect_workspace",
  "inspect_github_repositories",
  "complete_task",
  "ask_clarification",
  "unsupported",
];

const supportedDomains: AgentIntentDomain[] = [
  "tasks",
  "calendar",
  "learning",
  "workspace",
  "github",
];

const supportedConfidence: AgentIntentConfidence[] = ["low", "medium", "high"];

const intentToolMap = {
  inspect_tasks: "tasks.list",
  inspect_calendar: "calendar.list_today",
  inspect_learning: "learning.get_progress",
  inspect_workspace: "workspace.get_context",
  inspect_github_repositories: "github.repositories.list",
  complete_task: "tasks.complete",
} as const;

type KnownToolId = typeof intentToolMap[keyof typeof intentToolMap];

const domainByIntent: Partial<Record<AgentIntentType, AgentIntentDomain>> = {
  inspect_tasks: "tasks",
  inspect_calendar: "calendar",
  inspect_learning: "learning",
  inspect_workspace: "workspace",
  inspect_github_repositories: "github",
  complete_task: "tasks",
};

function textFor(language: SupportedAiResponseLanguage, key: "clarify" | "unsupported" | "low") {
  const copy = {
    en: {
      clarify: "Which exact item should I use?",
      unsupported: "I can't safely do that yet.",
      low: "Can you clarify what you want me to inspect or prepare?",
    },
    de: {
      clarify: "Welches genaue Element soll ich verwenden?",
      unsupported: "Das kann ich noch nicht sicher ausführen.",
      low: "Kannst du genauer sagen, was ich prüfen oder vorbereiten soll?",
    },
    fa: {
      clarify: "دقیقاً کدام مورد را باید استفاده کنم؟",
      unsupported: "فعلاً نمی‌توانم این کار را به‌صورت امن انجام بدهم.",
      low: "می‌توانید دقیق‌تر بگویید چه چیزی را بررسی یا آماده کنم؟",
    },
  } as const;
  return copy[language][key];
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 240) : "";
}

function safeReasons(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 4);
}

function createSafeProposal(
  type: "ask_clarification" | "unsupported",
  input: {
    userMessage: string;
    language: SupportedAiResponseLanguage;
    now: Date;
    question?: string;
    reason: string;
  },
): AgentReasoningValidationResult {
  const proposal: AgentIntentProposal = {
    id: `intent:${type}:${input.now.toISOString()}`,
    type,
    confidence: "medium",
    userMessage: input.userMessage,
    requestedDomain: undefined,
    requiresTool: false,
    requiresApproval: false,
    clarificationQuestion:
      input.question ?? textFor(input.language, type === "unsupported" ? "unsupported" : "clarify"),
    reasons: [input.reason],
    language: input.language,
    generatedAt: input.now.toISOString(),
    schemaVersion: AGENT_INTENT_SCHEMA_VERSION,
  };
  return { proposal, validationReasons: [input.reason] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasRejectedFields(value: Record<string, unknown>) {
  return (
    "userId" in value ||
    "user_id" in value ||
    "actions" in value ||
    "extraActions" in value ||
    "toolIds" in value ||
    "code" in value
  );
}

function normalizeTarget(value: unknown) {
  if (!isRecord(value)) return undefined;
  return {
    taskId: safeString(value.taskId) || undefined,
    taskReference: safeString(value.taskReference) || undefined,
    taskTitleHint: safeString(value.taskTitleHint) || undefined,
  };
}

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function findTaskTarget(
  context: AgentReasoningSafeContext,
  target: ReturnType<typeof normalizeTarget>,
) {
  const tasks = context.tasks;
  if (!target) return { status: "missing" as const };

  if (target.taskId) {
    const task = tasks.find((item) => item.id === target.taskId);
    return task ? { status: "matched" as const, task } : { status: "missing" as const };
  }

  const reference = normalizeTitle(target.taskReference ?? target.taskTitleHint ?? "");
  if (!reference) return { status: "missing" as const };
  const matches = tasks.filter((task) => {
    const title = normalizeTitle(task.title ?? "");
    return title === reference || title.includes(reference) || reference.includes(title);
  });
  if (matches.length === 1) return { status: "matched" as const, task: matches[0] };
  if (matches.length > 1) return { status: "ambiguous" as const };
  return { status: "missing" as const };
}

function requestLooksLikeTaskCompletion(message: string) {
  if (
    /\b(abschlie\u00dfen|erledigt)\b/i.test(message) ||
    /(\u06a9\u0627\u0645\u0644\s+\u06a9\u0646|\u062a\u06a9\u0645\u06cc\u0644\s+\u06a9\u0646|\u062a\u0645\u0627\u0645\s+\u06a9\u0646|\u0627\u0646\u062c\u0627\u0645[\u200c\s-]?\u0634\u062f\u0647|\u0639\u0644\u0627\u0645\u062a\s+\u0628\u0632\u0646)/i.test(message)
  ) {
    return true;
  }
  return /\b(complete|finish|mark .* done|mark .* complete|done|erledige|abschliessen|abschließen|markiere|کامل کن|تمام کن|انجام‌شده)\b/i.test(message);
}

function requestReferencesSelectedTask(message: string) {
  if (
    /\bausgew[a\u00e4]hlte[nr]?\s+aufgabe\b/i.test(message) ||
    /(\u0648\u0638\u06cc\u0641\u0647|\u06a9\u0627\u0631)\s+\u0627\u0646\u062a\u062e\u0627\u0628[\u200c\s-]?\u0634\u062f\u0647/i.test(message)
  ) {
    return true;
  }
  return /\b(selected|this|that|the)\s+task\b/i.test(message);
}

function deriveTaskCompletionTarget(
  context: AgentReasoningSafeContext,
  target: ReturnType<typeof normalizeTarget>,
  message: string,
): ReturnType<typeof normalizeTarget> {
  if (target?.taskId || target?.taskReference || target?.taskTitleHint) return target;
  if (!requestReferencesSelectedTask(message)) return target;
  if (context.tasks.length !== 1) return target;

  const [task] = context.tasks;
  if (!task?.id) return target;
  return {
    taskId: task.id,
    taskTitleHint: task.title,
  };
}

function requestLooksUnsupported(message: string) {
  return (
    /\b(create|update|delete|send|pay|share|invite|add|remove|move|reschedule)\b/i.test(message) ||
    /\b(erstelle|loesche|lösche|verschiebe|sende|bezahle|teile|entferne|hinzufuegen|hinzufügen)\b/i.test(message) ||
    /(بساز|ایجاد کن|حذف کن|منتقل کن|بفرست|ارسال کن|دعوت کن|اضافه کن|پاک کن)/i.test(message)
  );
}

function requestLooksMixed(message: string, type: AgentIntentType) {
  if (type === "complete_task") return false;
  const hasReadIntent =
    /\b(check|show|inspect|list|summarize|continue|what|which|zeig|zeige|pruefe|prüfe|fasse|setze|نشان بده|بررسی کن|خلاصه کن|ادامه بده)\b/i.test(message);
  const hasCompleteIntent = requestLooksLikeTaskCompletion(message);
  return hasReadIntent && hasCompleteIntent;
}

function messageHasAny(message: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(message));
}

function getStrongReadDomainEvidence(message: string): AgentIntentDomain | "conflicting" | null {
  const taskEvidence = messageHasAny(message, [
    /\b(task|tasks|open tasks|unfinished|to-?do|todos|focus on)\b/i,
    /\b(aufgabe|aufgaben|offen|offene|offenen|unerledigt|nicht erledigt|fokus|konzentrieren)\b/i,
    /(\u0648\u0638\u06cc\u0641\u0647|\u0648\u0638\u0627\u06cc\u0641|\u06a9\u0627\u0631\u0647\u0627|\u06a9\u0627\u0631\u0647\u0627\u06cc|\u062a\u0645\u0631\u06a9\u0632|\u062a\u0645\u0627\u0645 \u0646\u0634\u062f\u0647|\u0627\u0646\u062c\u0627\u0645 \u0646\u0634\u062f\u0647)/i,
  ]);
  const calendarEvidence = messageHasAny(message, [
    /\b(calendar|appointment|appointments|event|events|meeting|meetings|schedule)\b/i,
    /\b(kalender|termin|termine|besprechung|besprechungen|meeting|meetings)\b/i,
    /(\u062a\u0642\u0648\u06cc\u0645|\u0642\u0631\u0627\u0631|\u0642\u0631\u0627\u0631\u0647\u0627|\u062c\u0644\u0633\u0647|\u062c\u0644\u0633\u0627\u062a)/i,
  ]);
  const learningEvidence = messageHasAny(message, [
    /\b(learn|learning|lesson|lessons|study|studying)\b/i,
    /\b(lernen|lerne|lernfortschritt|n\u00e4chstes lernen|naechstes lernen)\b/i,
    /(\u06cc\u0627\u062f\u06af\u06cc\u0631\u06cc|\u062f\u0631\u0633|\u0622\u0645\u0648\u0632\u0634|\u06cc\u0627\u062f \u0628\u06af\u06cc\u0631)/i,
  ]);
  const workspaceEvidence = messageHasAny(message, [
    /\b(workspace|current plan|summarize my workspace)\b/i,
    /\b(workspace|aktueller plan|arbeitsbereich)\b/i,
    /(\u0628\u0631\u0646\u0627\u0645\u0647 \u0641\u0639\u0644\u06cc|workspace)/i,
  ]);
  const githubEvidence = messageHasAny(message, [
    /\b(github repositories|github repos|connected repositories|connected repos|github repository)\b/i,
    /\b(github-repositories|verbundene repositories|github-repos)\b/i,
    /((\u06af\u06cc\u062a[\u200c\s-]?\u0647\u0627\u0628|github).*(\u0645\u062e\u0632\u0646|\u0645\u062e\u0632\u0646[\u200c\s-]?\u0647\u0627)|(\u0645\u062e\u0632\u0646|\u0645\u062e\u0632\u0646[\u200c\s-]?\u0647\u0627).*(\u06af\u06cc\u062a[\u200c\s-]?\u0647\u0627\u0628|github))/i,
  ]);

  const matches = [
    taskEvidence ? "tasks" : null,
    calendarEvidence ? "calendar" : null,
    learningEvidence ? "learning" : null,
    workspaceEvidence ? "workspace" : null,
    githubEvidence ? "github" : null,
  ].filter((domain): domain is AgentIntentDomain => domain !== null);

  const uniqueMatches = Array.from(new Set(matches));
  if (uniqueMatches.length === 0) return null;
  if (uniqueMatches.length > 1) return "conflicting";
  return uniqueMatches[0];
}

function normalizeReadIntentFromEvidence(
  type: AgentIntentType,
  domainEvidence: AgentIntentDomain | "conflicting" | null,
): AgentIntentType {
  if (!domainEvidence || domainEvidence === "conflicting" || type === "complete_task" || type === "unsupported") {
    return type;
  }
  if (
    type === "ask_clarification" ||
    type === "inspect_tasks" ||
    type === "inspect_calendar" ||
    type === "inspect_learning" ||
    type === "inspect_workspace" ||
    type === "inspect_github_repositories"
  ) {
    if (domainEvidence === "tasks") return "inspect_tasks";
    if (domainEvidence === "calendar") return "inspect_calendar";
    if (domainEvidence === "learning") return "inspect_learning";
    if (domainEvidence === "workspace") return "inspect_workspace";
    if (domainEvidence === "github") return "inspect_github_repositories";
  }
  return type;
}

export function validateAgentIntentProposal(input: {
  rawProposal: unknown;
  userMessage: string;
  safeContext: AgentReasoningSafeContext;
  language: SupportedAiResponseLanguage;
  now?: Date;
}): AgentReasoningValidationResult {
  const now = input.now ?? new Date();
  if (!isRecord(input.rawProposal)) {
    return createSafeProposal("ask_clarification", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      question: textFor(input.language, "low"),
      reason: "LLM output was not a valid object.",
    });
  }

  if (hasRejectedFields(input.rawProposal)) {
    return createSafeProposal("unsupported", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      reason: "LLM output contained unsupported security-relevant fields.",
    });
  }

  const initialType = safeString(input.rawProposal.type) as AgentIntentType;
  const initialTypeSupported = supportedIntentTypes.includes(initialType);
  const domainEvidence = getStrongReadDomainEvidence(input.userMessage);
  const completionRequested = requestLooksLikeTaskCompletion(input.userMessage);
  const mixedReadWriteRequest = requestLooksMixed(input.userMessage, "inspect_tasks");
  // An unrecognized type is treated the same as a total parse failure (fallbackRawProposal
  // also starts from "ask_clarification"): fall through to deterministic evidence-based
  // normalization instead of rejecting immediately. The rescued type still comes only from
  // regex evidence over the user's own message, never from whatever the LLM proposed.
  const normalizationSourceType = initialTypeSupported ? initialType : "ask_clarification";
  const type = completionRequested &&
    !mixedReadWriteRequest &&
    (normalizationSourceType === "ask_clarification" || normalizationSourceType === "inspect_tasks" || normalizationSourceType === "complete_task")
    ? "complete_task"
    : normalizeReadIntentFromEvidence(normalizationSourceType, domainEvidence);
  const normalizedByEvidence = type !== initialType;
  if (!initialTypeSupported && type === "ask_clarification") {
    return createSafeProposal("unsupported", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      reason: "Unknown intent type was rejected.",
    });
  }
  if (!supportedIntentTypes.includes(type)) {
    return createSafeProposal("unsupported", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      reason: "Unknown intent type was rejected.",
    });
  }

  const confidence = safeString(input.rawProposal.confidence) as AgentIntentConfidence;
  if (!supportedConfidence.includes(confidence) || confidence === "low") {
    return createSafeProposal("ask_clarification", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      question: textFor(input.language, "low"),
      reason: "Low or invalid confidence requires clarification.",
    });
  }

  if (type === "unsupported" || requestLooksUnsupported(input.userMessage)) {
    return createSafeProposal("unsupported", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      question: safeString(input.rawProposal.clarificationQuestion) || textFor(input.language, "unsupported"),
      reason: "Unsupported action was rejected.",
    });
  }

  if (domainEvidence === "conflicting") {
    return createSafeProposal("ask_clarification", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      question: textFor(input.language, "clarify"),
      reason: "Conflicting strong domain evidence requires clarification.",
    });
  }

  if (type === "ask_clarification") {
    return createSafeProposal("ask_clarification", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      question: safeString(input.rawProposal.clarificationQuestion) || textFor(input.language, "clarify"),
      reason: "Clarification requested.",
    });
  }

  if (requestLooksMixed(input.userMessage, type)) {
    return createSafeProposal("ask_clarification", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      question: textFor(input.language, "clarify"),
      reason: "Mixed read/write request requires clarification before any action.",
    });
  }

  const expectedToolId = intentToolMap[type as keyof typeof intentToolMap];
  const proposedToolId = safeString(input.rawProposal.toolId);
  if (proposedToolId && proposedToolId !== expectedToolId && !normalizedByEvidence) {
    return createSafeProposal("unsupported", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      reason: "Invented or mismatched tool id was rejected.",
    });
  }

  const expectedDomain = domainByIntent[type];
  const proposedDomain = safeString(input.rawProposal.requestedDomain) as AgentIntentDomain;
  if (proposedDomain && !supportedDomains.includes(proposedDomain) && !normalizedByEvidence) {
    return createSafeProposal("unsupported", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      reason: "Unsupported domain was rejected.",
    });
  }
  if (proposedDomain && expectedDomain && proposedDomain !== expectedDomain && !normalizedByEvidence) {
    return createSafeProposal("unsupported", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      reason: "Intent domain did not match the supported tool mapping.",
    });
  }

  const target = type === "complete_task"
    ? deriveTaskCompletionTarget(input.safeContext, normalizeTarget(input.rawProposal.target), input.userMessage)
    : normalizeTarget(input.rawProposal.target);
  if (type === "complete_task") {
    const match = findTaskTarget(input.safeContext, target);
    if (match.status !== "matched" || !match.task.id) {
      return createSafeProposal("ask_clarification", {
        userMessage: input.userMessage,
        language: input.language,
        now,
        question: textFor(input.language, "clarify"),
        reason: match.status === "ambiguous"
          ? "Multiple matching tasks require clarification."
          : "Exact task target is required before approval.",
      });
    }
    target!.taskId = match.task.id;
    target!.taskTitleHint = match.task.title;
  }

  const proposal: AgentIntentProposal = {
    id: safeString(input.rawProposal.id) || `intent:${type}:${now.toISOString()}`,
    type,
    confidence,
    userMessage: input.userMessage,
    target,
    requestedDomain: expectedDomain,
    toolId: expectedToolId,
    requiresTool: true,
    requiresApproval: type === "complete_task",
    clarificationQuestion: undefined,
    reasons: safeReasons(input.rawProposal.reasons).length > 0
      ? safeReasons(input.rawProposal.reasons)
      : [`Validated ${type} intent.`],
    language: input.language,
    generatedAt: now.toISOString(),
    schemaVersion: AGENT_INTENT_SCHEMA_VERSION,
  };

  return {
    proposal,
    toolId: expectedToolId as KnownToolId,
    validationReasons: ["Intent proposal validated deterministically."],
  };
}
