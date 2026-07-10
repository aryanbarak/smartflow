import {
  loadWorkspaceMemory,
  saveWorkspaceMemory,
} from "./workspaceMemoryStorage";
import type {
  WorkspaceInteractionEvent,
  WorkspaceInteractionInput,
  WorkspaceInteractionMetadata,
  WorkspaceInteractionSource,
  WorkspaceInteractionType,
} from "./workspaceInteractionTypes";
import { WORKSPACE_INTERACTION_SCHEMA_VERSION } from "./workspaceInteractionTypes";
import type {
  WorkspaceMemory,
  WorkspaceSignalDomain,
  WorkspaceSuggestedActionMemoryStatus,
} from "./workspaceTypes";

const MAX_RECENT_INTERACTIONS = 50;
const MAX_ACTION_MEMORY = 30;
const MAX_COUNTER_VALUE = 1_000_000;

const validTypes: WorkspaceInteractionType[] = [
  "action_clicked",
  "skill_opened",
  "learning_continued",
  "recommendation_opened",
  "chat_opened",
  "conversation_opened",
  "view_all_clicked",
  "action_dismissed",
  "action_completed",
];

const validDomains: WorkspaceSignalDomain[] = [
  "tasks",
  "calendar",
  "finance",
  "habits",
  "documents",
  "learning",
];

const validSources: WorkspaceInteractionSource[] = [
  "hero",
  "suggested_actions",
  "right_rail_learning",
  "right_rail_recommendations",
  "recent_conversation",
  "flow_ai",
  "manual_actions",
];

export interface WorkspaceInteractionTrackerOptions {
  now?: Date;
  storage?: Storage;
}

function isWorkspaceInteractionType(value: unknown): value is WorkspaceInteractionType {
  return typeof value === "string" && validTypes.includes(value as WorkspaceInteractionType);
}

function isWorkspaceSignalDomain(value: unknown): value is WorkspaceSignalDomain {
  return typeof value === "string" && validDomains.includes(value as WorkspaceSignalDomain);
}

function isWorkspaceInteractionSource(value: unknown): value is WorkspaceInteractionSource {
  return typeof value === "string" && validSources.includes(value as WorkspaceInteractionSource);
}

function sanitizeText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 120) : fallback;
}

function sanitizeMetadata(
  metadata: WorkspaceInteractionInput["metadata"],
): WorkspaceInteractionMetadata | undefined {
  if (!metadata) return undefined;
  const safeMetadata: WorkspaceInteractionMetadata = {};

  for (const [key, value] of Object.entries(metadata).slice(0, 10)) {
    const safeKey = sanitizeText(key, "");
    if (!safeKey) continue;

    if (typeof value === "string") {
      const trimmed = value.trim();
      safeMetadata[safeKey] = trimmed.startsWith("http")
        ? trimmed.split("?")[0].split("#")[0].slice(0, 160)
        : trimmed.slice(0, 160);
    } else if (typeof value === "number" && Number.isFinite(value)) {
      safeMetadata[safeKey] = value;
    } else if (typeof value === "boolean" || value === null) {
      safeMetadata[safeKey] = value;
    }
  }

  return Object.keys(safeMetadata).length > 0 ? safeMetadata : undefined;
}

function createInteractionId(now: Date) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return `workspace:${now.getTime()}:${random}`;
}

function createInteractionEvent(
  input: WorkspaceInteractionInput,
  now: Date,
): WorkspaceInteractionEvent | null {
  if (!isWorkspaceInteractionType(input.type)) return null;
  if (!isWorkspaceSignalDomain(input.domain)) return null;
  if (!isWorkspaceInteractionSource(input.source)) return null;

  const targetTitle = sanitizeText(input.targetTitle, "");
  if (!targetTitle) return null;

  return {
    id: createInteractionId(now),
    type: input.type,
    domain: input.domain,
    targetId: sanitizeText(input.targetId, targetTitle),
    targetTitle,
    source: input.source,
    occurredAt: now.toISOString(),
    metadata: sanitizeMetadata(input.metadata),
    schemaVersion: WORKSPACE_INTERACTION_SCHEMA_VERSION,
  };
}

function incrementCounter<T extends string>(
  counters: Partial<Record<T, number>>,
  key: T,
) {
  return {
    ...counters,
    [key]: Math.min(MAX_COUNTER_VALUE, (counters[key] ?? 0) + 1),
  };
}

function statusForInteractionType(
  type: WorkspaceInteractionType,
): WorkspaceSuggestedActionMemoryStatus | null {
  if (type === "action_clicked") return "clicked";
  if (type === "action_completed") return "completed";
  if (type === "action_dismissed") return "dismissed";
  return null;
}

function updateActionMemory(memory: WorkspaceMemory, event: WorkspaceInteractionEvent) {
  const status = statusForInteractionType(event.type);
  if (!status) return memory;

  const actionMemory = {
    id: event.targetId,
    domain: event.domain,
    title: event.targetTitle,
    presentedAt: event.occurredAt,
    status,
  };

  const nextMemory = { ...memory };
  if (status === "dismissed") {
    nextMemory.dismissedSuggestedActions = [
      ...memory.dismissedSuggestedActions,
      actionMemory,
    ].slice(-MAX_ACTION_MEMORY);
  } else if (status === "completed") {
    nextMemory.completedSuggestedActions = [
      ...memory.completedSuggestedActions,
      actionMemory,
    ].slice(-MAX_ACTION_MEMORY);
  }

  nextMemory.recentSuggestedActions = [
    ...memory.recentSuggestedActions,
    actionMemory,
  ].slice(-MAX_ACTION_MEMORY);
  return nextMemory;
}

function applyInteractionToMemory(
  memory: WorkspaceMemory,
  event: WorkspaceInteractionEvent,
): WorkspaceMemory {
  const withActionMemory = updateActionMemory(memory, event);

  return {
    ...withActionMemory,
    updatedAt: event.occurredAt,
    recentInteractions: [
      ...withActionMemory.recentInteractions,
      event,
    ].slice(-MAX_RECENT_INTERACTIONS),
    interactionCountsByType: incrementCounter(
      withActionMemory.interactionCountsByType,
      event.type,
    ),
    interactionCountsByDomain: incrementCounter(
      withActionMemory.interactionCountsByDomain,
      event.domain,
    ),
    lastInteractionAt: event.occurredAt,
  };
}

export function trackWorkspaceInteraction(
  input: WorkspaceInteractionInput,
  options: WorkspaceInteractionTrackerOptions = {},
) {
  try {
    const now = options.now ?? new Date();
    const event = createInteractionEvent(input, now);
    if (!event) return null;

    const memory = loadWorkspaceMemory(options.storage);
    const nextMemory = applyInteractionToMemory(memory, event);
    const saved = saveWorkspaceMemory(nextMemory, options.storage);
    return saved ? event : null;
  } catch {
    return null;
  }
}
