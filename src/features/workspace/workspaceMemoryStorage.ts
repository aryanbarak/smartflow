import type {
  WorkspaceDomainUsageMemory,
  WorkspaceMemory,
  WorkspaceReflectionEvidence,
  WorkspaceReflectionEvidenceDomain,
  WorkspaceSignalDomain,
  WorkspaceSuggestedActionMemory,
  WorkspaceUsageWindow,
  WorkspaceUsageWindowMemory,
} from "./workspaceTypes";
import {
  WORKSPACE_INTERACTION_SCHEMA_VERSION,
  type WorkspaceInteractionEvent,
  type WorkspaceInteractionType,
  type WorkspaceInteractionSource,
} from "./workspaceInteractionTypes";

export const WORKSPACE_MEMORY_VERSION = 1;
export const WORKSPACE_MEMORY_STORAGE_KEY = "smartflow.workspace.memory.v1";

const workspaceDomains: WorkspaceSignalDomain[] = [
  "tasks",
  "calendar",
  "finance",
  "habits",
  "documents",
  "learning",
];

const reflectionDomains: WorkspaceReflectionEvidenceDomain[] = [
  ...workspaceDomains,
  "workspace",
];

const MAX_REFLECTION_EVIDENCE = 30;

const usageWindows: WorkspaceUsageWindow[] = [
  "morning",
  "afternoon",
  "evening",
  "night",
];

const interactionTypes: WorkspaceInteractionType[] = [
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

const interactionSources: WorkspaceInteractionSource[] = [
  "hero",
  "suggested_actions",
  "right_rail_learning",
  "right_rail_recommendations",
  "recent_conversation",
  "flow_ai",
  "manual_actions",
];

function createDomainUsage(): Record<WorkspaceSignalDomain, WorkspaceDomainUsageMemory> {
  return {
    tasks: { openCount: 0, recentOpenTimestamps: [] },
    calendar: { openCount: 0, recentOpenTimestamps: [] },
    finance: { openCount: 0, recentOpenTimestamps: [] },
    habits: { openCount: 0, recentOpenTimestamps: [] },
    documents: { openCount: 0, recentOpenTimestamps: [] },
    learning: { openCount: 0, recentOpenTimestamps: [] },
  };
}

function createUsageWindows(): WorkspaceUsageWindowMemory {
  return {
    morning: {},
    afternoon: {},
    evening: {},
    night: {},
  };
}

function getStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isWorkspaceDomain(value: unknown): value is WorkspaceSignalDomain {
  return typeof value === "string" && workspaceDomains.includes(value as WorkspaceSignalDomain);
}

function isReflectionDomain(value: unknown): value is WorkspaceReflectionEvidenceDomain {
  return typeof value === "string" && reflectionDomains.includes(value as WorkspaceReflectionEvidenceDomain);
}

function isInteractionType(value: unknown): value is WorkspaceInteractionType {
  return typeof value === "string" && interactionTypes.includes(value as WorkspaceInteractionType);
}

function isInteractionSource(value: unknown): value is WorkspaceInteractionSource {
  return typeof value === "string" && interactionSources.includes(value as WorkspaceInteractionSource);
}

function asIsoString(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function sanitizeText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 120) : undefined;
}

function sanitizeCountMap<T extends string>(
  value: unknown,
  allowedKeys: readonly T[],
): Partial<Record<T, number>> {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const result: Partial<Record<T, number>> = {};
  for (const key of allowedKeys) {
    const count = record[key];
    if (typeof count === "number" && Number.isFinite(count) && count > 0) {
      result[key] = Math.min(1_000_000, Math.floor(count));
    }
  }
  return result;
}

function sanitizeMetadata(value: unknown): WorkspaceInteractionEvent["metadata"] {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const metadata: WorkspaceInteractionEvent["metadata"] = {};
  for (const [key, rawValue] of Object.entries(record).slice(0, 10)) {
    const safeKey = sanitizeText(key);
    if (!safeKey) continue;
    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();
      metadata[safeKey] = trimmed.startsWith("http")
        ? trimmed.split("?")[0].split("#")[0].slice(0, 160)
        : trimmed.slice(0, 160);
    } else if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      metadata[safeKey] = rawValue;
    } else if (typeof rawValue === "boolean" || rawValue === null) {
      metadata[safeKey] = rawValue;
    }
  }
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function sanitizeInteractions(items: unknown): WorkspaceInteractionEvent[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const targetTitle = sanitizeText(item.targetTitle);
      return {
        id: sanitizeText(item.id) ?? "",
        type: isInteractionType(item.type) ? item.type : "action_clicked",
        domain: isWorkspaceDomain(item.domain) ? item.domain : "learning",
        targetId: sanitizeText(item.targetId) ?? targetTitle ?? "workspace-target",
        targetTitle: targetTitle ?? "Workspace target",
        source: isInteractionSource(item.source) ? item.source : "manual_actions",
        occurredAt: asIsoString(item.occurredAt, new Date(0).toISOString()),
        metadata: sanitizeMetadata(item.metadata),
        schemaVersion: WORKSPACE_INTERACTION_SCHEMA_VERSION,
      };
    })
    .filter((item) => item.id && item.targetTitle)
    .slice(-50);
}

function sanitizeActionMemory(items: unknown): WorkspaceSuggestedActionMemory[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      id: sanitizeText(item.id) ?? "",
      domain: isWorkspaceDomain(item.domain) ? item.domain : "learning",
      title: sanitizeText(item.title) ?? "Workspace action",
      presentedAt: asIsoString(item.presentedAt, new Date(0).toISOString()),
      status:
        item.status === "clicked" ||
        item.status === "completed" ||
        item.status === "dismissed" ||
        item.status === "shown"
          ? item.status
          : "shown",
    }))
    .filter((item) => item.id)
    .slice(0, 30);
}

function sanitizeReflectionEvidence(items: unknown): WorkspaceReflectionEvidence[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();

  return items
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const requestId = sanitizeText(item.requestId) ?? "";
      const stepId = sanitizeText(item.stepId) ?? "";
      const toolId = sanitizeText(item.toolId) ?? "";
      const dedupeKey = `${requestId}:${stepId}:${toolId}`;
      const reflectedAt = asIsoString(item.reflectedAt, new Date(0).toISOString());
      const retainedAt = asIsoString(item.retainedAt, reflectedAt);

      return {
        id: sanitizeText(item.id) ?? `reflection:${dedupeKey}`,
        requestId,
        stepId,
        toolId,
        domain: isReflectionDomain(item.domain) ? item.domain : "workspace",
        outcome: item.outcome === "empty" ? "empty" : "successful",
        usefulness:
          item.usefulness === "high" ||
          item.usefulness === "medium" ||
          item.usefulness === "low"
            ? item.usefulness
            : "low",
        goalProgress: item.goalProgress === "supported" ? "supported" : "informed",
        reflectedAt,
        retainedAt,
        schemaVersion: 1 as const,
      };
    })
    .filter((item) => item.requestId && item.stepId && item.toolId)
    .filter((item) => {
      const key = `${item.requestId}:${item.stepId}:${item.toolId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(-MAX_REFLECTION_EVIDENCE);
}

export function createDefaultWorkspaceMemory(now = new Date()): WorkspaceMemory {
  const timestamp = now.toISOString();
  return {
    version: WORKSPACE_MEMORY_VERSION,
    createdAt: timestamp,
    updatedAt: timestamp,
    recentDomains: [],
    domainUsage: createDomainUsage(),
    lastOpenedItems: {},
    preferredUsageWindows: createUsageWindows(),
    recentSuggestedActions: [],
    dismissedSuggestedActions: [],
    completedSuggestedActions: [],
    recentInteractions: [],
    interactionCountsByType: {},
    interactionCountsByDomain: {},
    recentReflectionEvidence: [],
    workspaceHistory: [],
  };
}

export function migrateWorkspaceMemory(value: unknown): WorkspaceMemory {
  const fallback = createDefaultWorkspaceMemory();
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  if (record.version !== WORKSPACE_MEMORY_VERSION) return fallback;

  const createdAt = asIsoString(record.createdAt, fallback.createdAt);
  const updatedAt = asIsoString(record.updatedAt, createdAt);
  const domainUsage = createDomainUsage();

  if (record.domainUsage && typeof record.domainUsage === "object") {
    const usageRecord = record.domainUsage as Record<string, unknown>;
    for (const domain of workspaceDomains) {
      const entry = usageRecord[domain];
      if (!entry || typeof entry !== "object") continue;
      const usage = entry as Record<string, unknown>;
      const timestamps = Array.isArray(usage.recentOpenTimestamps)
        ? usage.recentOpenTimestamps
            .filter((timestamp): timestamp is string => typeof timestamp === "string")
            .map((timestamp) => asIsoString(timestamp, updatedAt))
            .slice(-20)
        : [];
      domainUsage[domain] = {
        openCount:
          typeof usage.openCount === "number" && Number.isFinite(usage.openCount)
            ? Math.max(0, Math.floor(usage.openCount))
            : 0,
        lastOpenedAt:
          typeof usage.lastOpenedAt === "string"
            ? asIsoString(usage.lastOpenedAt, updatedAt)
            : undefined,
        recentOpenTimestamps: timestamps,
      };
    }
  }

  const preferredUsageWindows = createUsageWindows();
  if (record.preferredUsageWindows && typeof record.preferredUsageWindows === "object") {
    const windows = record.preferredUsageWindows as Record<string, unknown>;
    for (const windowName of usageWindows) {
      const windowValue = windows[windowName];
      if (!windowValue || typeof windowValue !== "object") continue;
      const counts = windowValue as Record<string, unknown>;
      for (const domain of workspaceDomains) {
        const count = counts[domain];
        if (typeof count === "number" && Number.isFinite(count) && count > 0) {
          preferredUsageWindows[windowName][domain] = Math.floor(count);
        }
      }
    }
  }

  const recentDomains = Array.isArray(record.recentDomains)
    ? record.recentDomains.filter(isWorkspaceDomain).slice(0, 10)
    : [];

  const workspaceHistory = Array.isArray(record.workspaceHistory)
    ? record.workspaceHistory
        .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
        .map((entry) => ({
          generatedAt: asIsoString(entry.generatedAt, updatedAt),
          primaryDomain: isWorkspaceDomain(entry.primaryDomain)
            ? entry.primaryDomain
            : "learning",
          secondaryDomains: Array.isArray(entry.secondaryDomains)
            ? entry.secondaryDomains.filter(isWorkspaceDomain).slice(0, 3)
            : [],
          confidence:
            entry.confidence === "high" ||
            entry.confidence === "medium" ||
            entry.confidence === "low"
              ? entry.confidence
              : "low",
        }))
        .slice(-14)
    : [];

  const lastConversation =
    record.lastConversation && typeof record.lastConversation === "object"
      ? {
          id: sanitizeText((record.lastConversation as Record<string, unknown>).id) ?? "",
          title:
            sanitizeText((record.lastConversation as Record<string, unknown>).title) ??
            "Recent conversation",
          updatedAt: asIsoString(
            (record.lastConversation as Record<string, unknown>).updatedAt,
            updatedAt,
          ),
        }
      : undefined;

  const lastLearningContext =
    record.lastLearningContext && typeof record.lastLearningContext === "object"
      ? {
          mode: sanitizeText((record.lastLearningContext as Record<string, unknown>).mode),
          totalQuestions:
            typeof (record.lastLearningContext as Record<string, unknown>).totalQuestions ===
            "number"
              ? Math.max(
                  0,
                  Math.floor(
                    (record.lastLearningContext as Record<string, number>).totalQuestions,
                  ),
                )
              : 0,
          updatedAt:
            typeof (record.lastLearningContext as Record<string, unknown>).updatedAt ===
            "string"
              ? asIsoString(
                  (record.lastLearningContext as Record<string, unknown>).updatedAt,
                  updatedAt,
                )
              : undefined,
        }
      : undefined;

  return {
    version: WORKSPACE_MEMORY_VERSION,
    createdAt,
    updatedAt,
    lastWorkspaceOpenedAt:
      typeof record.lastWorkspaceOpenedAt === "string"
        ? asIsoString(record.lastWorkspaceOpenedAt, updatedAt)
        : undefined,
    lastPrimaryDomain: isWorkspaceDomain(record.lastPrimaryDomain)
      ? record.lastPrimaryDomain
      : undefined,
    recentDomains,
    domainUsage,
    lastOpenedItems: {},
    preferredUsageWindows,
    recentSuggestedActions: sanitizeActionMemory(record.recentSuggestedActions),
    dismissedSuggestedActions: sanitizeActionMemory(record.dismissedSuggestedActions),
    completedSuggestedActions: sanitizeActionMemory(record.completedSuggestedActions),
    recentInteractions: sanitizeInteractions(record.recentInteractions),
    interactionCountsByType: sanitizeCountMap(
      record.interactionCountsByType,
      interactionTypes,
    ),
    interactionCountsByDomain: sanitizeCountMap(
      record.interactionCountsByDomain,
      workspaceDomains,
    ),
    lastInteractionAt:
      typeof record.lastInteractionAt === "string"
        ? asIsoString(record.lastInteractionAt, updatedAt)
        : undefined,
    lastConversation: lastConversation?.id ? lastConversation : undefined,
    lastLearningContext,
    recentReflectionEvidence: sanitizeReflectionEvidence(record.recentReflectionEvidence),
    workspaceHistory,
  };
}

export function loadWorkspaceMemory(storage?: Storage): WorkspaceMemory {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return createDefaultWorkspaceMemory();

  try {
    const raw = targetStorage.getItem(WORKSPACE_MEMORY_STORAGE_KEY);
    if (!raw) return createDefaultWorkspaceMemory();
    return migrateWorkspaceMemory(JSON.parse(raw));
  } catch {
    return createDefaultWorkspaceMemory();
  }
}

export function saveWorkspaceMemory(memory: WorkspaceMemory, storage?: Storage) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return false;

  try {
    targetStorage.setItem(
      WORKSPACE_MEMORY_STORAGE_KEY,
      JSON.stringify(migrateWorkspaceMemory(memory)),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearWorkspaceMemory(storage?: Storage) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return false;

  try {
    targetStorage.removeItem(WORKSPACE_MEMORY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
