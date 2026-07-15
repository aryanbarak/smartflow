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
  "complete_task",
  "ask_clarification",
  "unsupported",
];

const supportedDomains: AgentIntentDomain[] = [
  "tasks",
  "calendar",
  "learning",
  "workspace",
];

const supportedConfidence: AgentIntentConfidence[] = ["low", "medium", "high"];

const intentToolMap = {
  inspect_tasks: "tasks.list",
  inspect_calendar: "calendar.list_today",
  inspect_learning: "learning.get_progress",
  inspect_workspace: "workspace.get_context",
  complete_task: "tasks.complete",
} as const;

type KnownToolId = typeof intentToolMap[keyof typeof intentToolMap];

const domainByIntent: Partial<Record<AgentIntentType, AgentIntentDomain>> = {
  inspect_tasks: "tasks",
  inspect_calendar: "calendar",
  inspect_learning: "learning",
  inspect_workspace: "workspace",
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
  const incompleteTasks = context.tasks.filter(
    (task) => task.completed !== true && task.status !== "completed",
  );
  if (!target) return { status: "missing" as const };

  if (target.taskId) {
    const task = incompleteTasks.find((item) => item.id === target.taskId);
    return task ? { status: "matched" as const, task } : { status: "missing" as const };
  }

  const reference = normalizeTitle(target.taskReference ?? target.taskTitleHint ?? "");
  if (!reference) return { status: "missing" as const };
  const matches = incompleteTasks.filter((task) => {
    const title = normalizeTitle(task.title ?? "");
    return title === reference || title.includes(reference) || reference.includes(title);
  });
  if (matches.length === 1) return { status: "matched" as const, task: matches[0] };
  if (matches.length > 1) return { status: "ambiguous" as const };
  return { status: "missing" as const };
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
  const hasCompleteIntent =
    /\b(complete|finish|mark .* done|done|erledige|abschliessen|abschließen|markiere|کامل کن|تمام کن|انجام‌شده)\b/i.test(message);
  return hasReadIntent && hasCompleteIntent;
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

  const type = safeString(input.rawProposal.type) as AgentIntentType;
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
  if (proposedToolId && proposedToolId !== expectedToolId) {
    return createSafeProposal("unsupported", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      reason: "Invented or mismatched tool id was rejected.",
    });
  }

  const expectedDomain = domainByIntent[type];
  const proposedDomain = safeString(input.rawProposal.requestedDomain) as AgentIntentDomain;
  if (proposedDomain && !supportedDomains.includes(proposedDomain)) {
    return createSafeProposal("unsupported", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      reason: "Unsupported domain was rejected.",
    });
  }
  if (proposedDomain && expectedDomain && proposedDomain !== expectedDomain) {
    return createSafeProposal("unsupported", {
      userMessage: input.userMessage,
      language: input.language,
      now,
      reason: "Intent domain did not match the supported tool mapping.",
    });
  }

  const target = normalizeTarget(input.rawProposal.target);
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
          : "Exact incomplete task target is required before approval.",
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
