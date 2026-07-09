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

export interface WorkspaceDataLoadingState {
  tasks: boolean;
  events: boolean;
  finance: boolean;
  habits: boolean;
  documents: boolean;
  learnAi: boolean;
  chat: boolean;
}

export interface WorkspaceEngineInput {
  now?: Date;
  tasks: WorkspaceTaskSignal[];
  events: WorkspaceEventSignal[];
  transactions: WorkspaceFinanceSignal[];
  habits: unknown[];
  documents: unknown[];
  learnAiActivity: WorkspaceLearnAiSignal | null;
  chatSessions: WorkspaceChatSignal[];
  loading: WorkspaceDataLoadingState;
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
    skills: WorkspaceSkill[];
  };
  suggestedActions: WorkspaceAction[];
  dailyStory: WorkspaceDailyStory;
  recommendationReasons: WorkspaceReason[];
  welcome: WorkspaceWelcome;
  rightRail: WorkspaceRightRail;
}
