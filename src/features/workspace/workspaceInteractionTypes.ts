import type { WorkspaceSignalDomain } from "./workspaceTypes";

export const WORKSPACE_INTERACTION_SCHEMA_VERSION = 1;

export type WorkspaceInteractionType =
  | "action_clicked"
  | "skill_opened"
  | "learning_continued"
  | "recommendation_opened"
  | "chat_opened"
  | "conversation_opened"
  | "view_all_clicked"
  | "action_dismissed"
  | "action_completed";

export type WorkspaceInteractionSource =
  | "hero"
  | "suggested_actions"
  | "right_rail_learning"
  | "right_rail_recommendations"
  | "recent_conversation"
  | "flow_ai"
  | "manual_actions";

export type WorkspaceInteractionMetadata = Record<
  string,
  string | number | boolean | null
>;

export interface WorkspaceInteractionEvent {
  id: string;
  type: WorkspaceInteractionType;
  domain: WorkspaceSignalDomain;
  targetId: string;
  targetTitle: string;
  source: WorkspaceInteractionSource;
  occurredAt: string;
  metadata?: WorkspaceInteractionMetadata;
  schemaVersion: typeof WORKSPACE_INTERACTION_SCHEMA_VERSION;
}

export interface WorkspaceInteractionInput {
  type: WorkspaceInteractionType;
  domain: WorkspaceSignalDomain;
  targetId?: string;
  targetTitle: string;
  source: WorkspaceInteractionSource;
  metadata?: WorkspaceInteractionMetadata;
}
