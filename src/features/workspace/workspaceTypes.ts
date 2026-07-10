import type {
  WorkspaceInteractionEvent,
  WorkspaceInteractionSource,
  WorkspaceInteractionType,
} from "./workspaceInteractionTypes";

export type WorkspaceIconKey =
  | "book"
  | "briefcase"
  | "calendar"
  | "check"
  | "file"
  | "flame"
  | "message"
  | "sparkles"
  | "wallet";

export type WorkspaceRoute =
  | "/briefing/weekly"
  | "/calendar"
  | "/chat"
  | "/documents"
  | "/finance"
  | "/learn-ai"
  | "/tasks";

export interface WorkspaceNavigationTarget {
  route: WorkspaceRoute;
  initialPrompt?: string;
}

export interface WorkspaceAction {
  title: string;
  description: string;
  icon: WorkspaceIconKey;
  target: WorkspaceNavigationTarget;
  signalDomain?: WorkspaceSignalDomain;
}

export interface WorkspaceSkill extends WorkspaceAction {}

export interface WorkspaceSetupAction {
  label: string;
  description: string;
  icon: WorkspaceIconKey;
  target: WorkspaceNavigationTarget;
}

export interface WorkspaceTaskSignal {
  id?: string;
  title?: string;
  completed: boolean;
  createdAt: string;
}

export interface WorkspaceEventSignal {
  id?: string;
  title: string;
  dateTimeStart: string;
}

export interface WorkspaceFinanceSignal {
  id?: string;
  type: "income" | "expense";
  amount: number;
  date: string;
}

export interface WorkspaceChatSignal {
  id: string;
  title: string;
  updatedAt: string;
}

export interface WorkspaceLearnAiSignal {
  totalQuestions: number;
  lastQuestion: { content: string; mode: string; createdAt: string } | null;
  mostActiveMode: { mode: string; count: number } | null;
}

export type WorkspaceSignalDomain =
  | "tasks"
  | "calendar"
  | "finance"
  | "habits"
  | "documents"
  | "learning";

export type WorkspaceSignalSeverity = "low" | "medium" | "high";
export type WorkspacePriorityConfidence = "low" | "medium" | "high";
export type WorkspacePersonalizationConfidence = "low" | "medium" | "high";
export type WorkspaceMemoryConfidence = "low" | "medium" | "high";
export type WorkspaceUsageWindow = "morning" | "afternoon" | "evening" | "night";
export type WorkspaceSuggestedActionMemoryStatus =
  | "shown"
  | "clicked"
  | "completed"
  | "dismissed";

export type WorkspaceDomainAffinity = Record<WorkspaceSignalDomain, number>;
export type WorkspaceUsageWindowMemory = Record<
  WorkspaceUsageWindow,
  Partial<Record<WorkspaceSignalDomain, number>>
>;

export interface WorkspaceSignal {
  id: string;
  domain: WorkspaceSignalDomain;
  label: string;
  score: number;
  severity: WorkspaceSignalSeverity;
  reason: string;
  count: number;
  createdAt?: string;
  generatedAt: string;
}

export interface WorkspacePriorityModel {
  primaryDomain: WorkspaceSignalDomain;
  secondaryDomains: WorkspaceSignalDomain[];
  missionTitle: string;
  missionSummary: string;
  confidence: WorkspacePriorityConfidence;
  reasons: string[];
  orderedSignalIds: string[];
}

export interface WorkspacePersonalizationModel {
  domainAffinity: WorkspaceDomainAffinity;
  recentDomains: WorkspaceSignalDomain[];
  preferredDomains: WorkspaceSignalDomain[];
  confidence: WorkspacePersonalizationConfidence;
  evidence: string[];
  generatedAt: string;
}

export interface WorkspaceActionEngagement {
  targetId: string;
  domain: WorkspaceSignalDomain;
  clicks: number;
  completions: number;
  dismissals: number;
  lastInteractionAt?: string;
  score: number;
}

export interface WorkspaceRepeatedInteractionPattern {
  domain: WorkspaceSignalDomain;
  type: WorkspaceInteractionType;
  count: number;
  score: number;
}

export interface WorkspaceInteractionFeedback {
  domainEngagement: WorkspaceDomainAffinity;
  actionEngagement: WorkspaceActionEngagement[];
  repeatedInteractionPatterns: WorkspaceRepeatedInteractionPattern[];
  avoidedDomains: WorkspaceSignalDomain[];
  recentInteractionDomains: WorkspaceSignalDomain[];
  preferredSources: Partial<Record<WorkspaceInteractionSource, number>>;
  confidence: WorkspacePersonalizationConfidence;
  evidence: string[];
  generatedAt: string;
}

export interface WorkspaceDomainUsageMemory {
  openCount: number;
  lastOpenedAt?: string;
  recentOpenTimestamps: string[];
}

export interface WorkspaceLastOpenedItemMemory {
  id?: string;
  title?: string;
  progress?: number;
  openedAt: string;
}

export interface WorkspaceLastOpenedItemsMemory {
  task?: WorkspaceLastOpenedItemMemory;
  document?: WorkspaceLastOpenedItemMemory;
  lesson?: WorkspaceLastOpenedItemMemory;
  conversation?: WorkspaceLastOpenedItemMemory;
}

export interface WorkspaceSuggestedActionMemory {
  id: string;
  domain: WorkspaceSignalDomain;
  title: string;
  presentedAt: string;
  status: WorkspaceSuggestedActionMemoryStatus;
}

export interface WorkspaceConversationMemory {
  id: string;
  title: string;
  updatedAt: string;
}

export interface WorkspaceLearningContextMemory {
  mode?: string;
  totalQuestions: number;
  progress?: number;
  updatedAt?: string;
}

export interface WorkspaceHistoryEntry {
  generatedAt: string;
  primaryDomain: WorkspaceSignalDomain;
  secondaryDomains: WorkspaceSignalDomain[];
  confidence: WorkspacePriorityConfidence;
}

export interface WorkspaceMemory {
  version: 1;
  createdAt: string;
  updatedAt: string;
  lastWorkspaceOpenedAt?: string;
  lastPrimaryDomain?: WorkspaceSignalDomain;
  recentDomains: WorkspaceSignalDomain[];
  domainUsage: Record<WorkspaceSignalDomain, WorkspaceDomainUsageMemory>;
  lastOpenedItems: WorkspaceLastOpenedItemsMemory;
  preferredUsageWindows: WorkspaceUsageWindowMemory;
  recentSuggestedActions: WorkspaceSuggestedActionMemory[];
  dismissedSuggestedActions: WorkspaceSuggestedActionMemory[];
  completedSuggestedActions: WorkspaceSuggestedActionMemory[];
  recentInteractions: WorkspaceInteractionEvent[];
  interactionCountsByType: Partial<Record<WorkspaceInteractionType, number>>;
  interactionCountsByDomain: Partial<Record<WorkspaceSignalDomain, number>>;
  lastInteractionAt?: string;
  lastConversation?: WorkspaceConversationMemory;
  lastLearningContext?: WorkspaceLearningContextMemory;
  workspaceHistory: WorkspaceHistoryEntry[];
}

export interface WorkspaceMemoryInsights {
  recentDomains: WorkspaceSignalDomain[];
  familiarDomains: WorkspaceSignalDomain[];
  preferredTimeDomains: WorkspaceSignalDomain[];
  lastPrimaryDomain?: WorkspaceSignalDomain;
  repeatedActionPatterns: WorkspaceSignalDomain[];
  interactionDomains: WorkspaceSignalDomain[];
  learningContinuity?: WorkspaceLearningContextMemory;
  confidence: WorkspaceMemoryConfidence;
  evidence: string[];
}

export interface WorkspaceDataLoadingState {
  tasks: boolean;
  events: boolean;
  finance: boolean;
  habits: boolean;
  documents: boolean;
  learnAi: boolean;
  chat: boolean;
}

export interface WorkspaceSignalEngineInput {
  now?: Date;
  tasks: WorkspaceTaskSignal[];
  events: WorkspaceEventSignal[];
  transactions: WorkspaceFinanceSignal[];
  habits: unknown[];
  documents: unknown[];
  learnAiActivity: WorkspaceLearnAiSignal | null;
  loading: WorkspaceDataLoadingState;
}

export interface WorkspaceMemoryEngineInput extends WorkspaceSignalEngineInput {
  signals: WorkspaceSignal[];
  existingMemory: WorkspaceMemory;
  chatSessions: WorkspaceChatSignal[];
}

export interface WorkspaceMemoryEngineResult {
  updatedMemory: WorkspaceMemory;
  memoryInsights: WorkspaceMemoryInsights;
  hasChanges: boolean;
}

export interface WorkspaceEngineInput extends WorkspaceSignalEngineInput {
  chatSessions: WorkspaceChatSignal[];
  signals: WorkspaceSignal[];
  personalization: WorkspacePersonalizationModel;
  priority: WorkspacePriorityModel;
  interactionFeedback: WorkspaceInteractionFeedback;
}

export interface WorkspaceToday {
  date: Date;
  label: string;
  greeting: string;
}

export interface WorkspaceSignals {
  isLoading: boolean;
  totalSignals: number;
  incompleteTasks: number;
  eventsToday: number;
  netThisMonth: number;
  netThisMonthLabel: string;
  tasksCreatedThisWeek: number;
}

export interface WorkspaceDailyStory {
  bullets: string[];
}

export interface WorkspaceReason {
  title: string;
  body: string;
  signalDomain?: WorkspaceSignalDomain;
}

export interface WorkspaceRecentLesson {
  title: string;
  progress: number;
  icon: WorkspaceIconKey;
}

export interface WorkspaceRecommendation {
  title: string;
  reason: string;
  icon: WorkspaceIconKey;
  target: WorkspaceNavigationTarget;
  signalDomain?: WorkspaceSignalDomain;
}

export interface WorkspaceRecentConversation {
  title: string;
  relativeTime: string;
}

export interface WorkspaceRightRail {
  statusMessage: string;
  recentLessons: WorkspaceRecentLesson[];
  recommendations: WorkspaceRecommendation[];
  recentConversation: WorkspaceRecentConversation | null;
  isChatLoading: boolean;
}

export interface WorkspaceWelcome {
  setupActions: WorkspaceSetupAction[];
  learningSignals: string[];
}

export interface Workspace {
  today: WorkspaceToday;
  isLowData: boolean;
  signals: WorkspaceSignals;
  hero: {
    title: string;
    summary: string;
    skills: WorkspaceSkill[];
  };
  suggestedActions: WorkspaceAction[];
  dailyStory: WorkspaceDailyStory;
  recommendationReasons: WorkspaceReason[];
  signalFeed: WorkspaceSignal[];
  personalization: WorkspacePersonalizationModel;
  welcome: WorkspaceWelcome;
  rightRail: WorkspaceRightRail;
}
