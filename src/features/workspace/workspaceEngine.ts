import type {
  Workspace,
  WorkspaceAction,
  WorkspaceEngineInput,
  WorkspaceRecentLesson,
  WorkspaceRecommendation,
  WorkspaceSetupAction,
  WorkspaceSignalDomain,
  WorkspaceSkill,
} from "./workspaceTypes";

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameCalendarDay(a: Date, b: Date) {
  return toDateOnly(a) === toDateOnly(b);
}

function formatRelativeTime(iso: string, now: Date) {
  const diff = now.getTime() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function getGreeting(today: Date) {
  const hour = today.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Still here";
}

function scoreForDomain(
  input: WorkspaceEngineInput,
  domain: WorkspaceSignalDomain,
) {
  return input.signals.find((signal) => signal.domain === domain)?.score ?? 0;
}

function severityForDomain(
  input: WorkspaceEngineInput,
  domain?: WorkspaceSignalDomain,
) {
  if (!domain) return "low";
  const signal = input.signals.find((item) => item.domain === domain);
  return signal?.severity ?? "low";
}

function affinityForDomain(
  input: WorkspaceEngineInput,
  domain?: WorkspaceSignalDomain,
) {
  return domain ? input.personalization.domainAffinity[domain] ?? 0 : 0;
}

function interactionFeedbackForDomain(
  input: WorkspaceEngineInput,
  domain?: WorkspaceSignalDomain,
) {
  if (!domain) return 0;
  const base = input.interactionFeedback.domainEngagement[domain] ?? 0;
  const dismissalPenalty = input.interactionFeedback.avoidedDomains.includes(domain)
    ? 8
    : 0;
  return base - dismissalPenalty;
}

function interactionFeedbackForItem(input: WorkspaceEngineInput, title?: string) {
  if (!title) return 0;
  const match = input.interactionFeedback.actionEngagement.find(
    (action) => action.targetId === title || action.targetId === title.toLowerCase(),
  );
  return match?.score ?? 0;
}

function priorityRankForDomain(
  input: WorkspaceEngineInput,
  domain?: WorkspaceSignalDomain,
) {
  if (!domain) return Number.MAX_SAFE_INTEGER;
  if (domain === input.priority.primaryDomain) return 0;
  const secondaryIndex = input.priority.secondaryDomains.indexOf(domain);
  return secondaryIndex === -1 ? Number.MAX_SAFE_INTEGER : secondaryIndex + 1;
}

function sortBySignalPriority<T extends { title?: string; signalDomain?: WorkspaceSignalDomain }>(
  items: T[],
  input: WorkspaceEngineInput,
) {
  return [...items].sort((a, b) => {
    const aIsUrgent = severityForDomain(input, a.signalDomain) === "high";
    const bIsUrgent = severityForDomain(input, b.signalDomain) === "high";
    if (aIsUrgent !== bIsUrgent) return bIsUrgent ? 1 : -1;

    const rankDiff =
      priorityRankForDomain(input, a.signalDomain) -
      priorityRankForDomain(input, b.signalDomain);
    if (rankDiff !== 0) return rankDiff;
    const aScore = a.signalDomain ? scoreForDomain(input, a.signalDomain) : 0;
    const bScore = b.signalDomain ? scoreForDomain(input, b.signalDomain) : 0;
    const scoreDiff = bScore - aScore;
    if (scoreDiff !== 0) return scoreDiff;

    return (
      affinityForDomain(input, b.signalDomain) -
      affinityForDomain(input, a.signalDomain) ||
      interactionFeedbackForDomain(input, b.signalDomain) -
        interactionFeedbackForDomain(input, a.signalDomain) ||
      interactionFeedbackForItem(input, b.title) -
        interactionFeedbackForItem(input, a.title)
    );
  });
}

const flowAISkills: WorkspaceSkill[] = [
  {
    title: "Plan My Day",
    description: "Optimize today's schedule.",
    icon: "calendar",
    target: {
      route: "/chat",
      initialPrompt: "Help me plan my day and choose what to do first.",
    },
    signalDomain: "calendar",
  },
  {
    title: "Study With Me",
    description: "Focus and learning support.",
    icon: "book",
    target: { route: "/learn-ai" },
    signalDomain: "learning",
  },
  {
    title: "Analyze My Habits",
    description: "Understand your routines.",
    icon: "flame",
    target: {
      route: "/chat",
      initialPrompt: "Analyze my habits and give me insights on my routines.",
    },
    signalDomain: "habits",
  },
  {
    title: "Review Finances",
    description: "Review spending patterns.",
    icon: "wallet",
    target: { route: "/finance" },
    signalDomain: "finance",
  },
  {
    title: "Weekly Briefing",
    description: "AI-generated summaries.",
    icon: "file",
    target: { route: "/briefing/weekly" },
    signalDomain: "documents",
  },
  {
    title: "Career Assistant",
    description: "Jobs, CV and interview help.",
    icon: "briefcase",
    target: {
      route: "/chat",
      initialPrompt:
        "Help me with my career: jobs, CV, applications, and interview preparation.",
    },
    signalDomain: "documents",
  },
];

const welcomeSetupActions: WorkspaceSetupAction[] = [
  {
    label: "Add your first task",
    description: "Tell SmartFlow what needs attention.",
    icon: "check",
    target: { route: "/tasks" },
  },
  {
    label: "Review calendar",
    description: "Give Flow AI a sense of your available time.",
    icon: "calendar",
    target: { route: "/calendar" },
  },
  {
    label: "Upload a document",
    description: "Add context Flow AI can help you organize.",
    icon: "file",
    target: { route: "/documents" },
  },
  {
    label: "Continue Smart Academy",
    description: "Start a learning signal for recommendations.",
    icon: "book",
    target: { route: "/learn-ai" },
  },
  {
    label: "Record your first expense",
    description: "Create the first monthly finance signal.",
    icon: "wallet",
    target: { route: "/finance" },
  },
  {
    label: "Chat with Flow AI",
    description: "Tell Flow AI what you want SmartFlow to become.",
    icon: "message",
    target: {
      route: "/chat",
      initialPrompt:
        "Help me set up SmartFlow. Ask me what I want this workspace to help me with.",
    },
  },
];

const welcomeLearningSignals = [
  "Tasks tell me what matters.",
  "Calendar tells me available time.",
  "Documents give context.",
  "Finance gives monthly signals.",
  "Learning activity guides recommendations.",
];

const recentLessons: WorkspaceRecentLesson[] = [
  { title: "Sorting Algorithms", progress: 82, icon: "book" },
  { title: "OOP Fundamentals", progress: 54, icon: "file" },
  { title: "SQL JOINs", progress: 18, icon: "check" },
  { title: "Java Collections", progress: 73, icon: "book" },
  { title: "Prompt Engineering", progress: 100, icon: "message" },
  { title: "LangGraph", progress: 31, icon: "sparkles" },
];

const rightRailRecommendations: WorkspaceRecommendation[] = [
  {
    title: "Vector Databases",
    reason: "Because you recently studied LangGraph.",
    icon: "sparkles",
    target: { route: "/chat", initialPrompt: "Help me explore Vector Databases." },
    signalDomain: "learning",
  },
  {
    title: "Neural Networks",
    reason: "Good next step after Linear Algebra.",
    icon: "book",
    target: { route: "/chat", initialPrompt: "Help me explore Neural Networks." },
    signalDomain: "learning",
  },
  {
    title: "AI Memory",
    reason: "Useful for your DailyFlow project.",
    icon: "message",
    target: { route: "/chat", initialPrompt: "Help me explore AI Memory." },
    signalDomain: "documents",
  },
  {
    title: "MCP Protocol",
    reason: "Related to AI Agents.",
    icon: "file",
    target: { route: "/chat", initialPrompt: "Help me explore MCP Protocol." },
    signalDomain: "learning",
  },
  {
    title: "Advanced Prompting",
    reason: "Matches your recent activity.",
    icon: "check",
    target: { route: "/chat", initialPrompt: "Help me explore Advanced Prompting." },
    signalDomain: "learning",
  },
  {
    title: "RAG Systems",
    reason: "Recommended after embeddings.",
    icon: "briefcase",
    target: { route: "/chat", initialPrompt: "Help me explore RAG Systems." },
    signalDomain: "documents",
  },
];

export function workspaceEngine(input: WorkspaceEngineInput): Workspace {
  const today = input.now ?? new Date();
  const todayLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const todayKey = toDateOnly(today);
  const currentMonth = todayKey.slice(0, 7);

  const seenEvents = new Set<string>();
  const eventsToday = input.events
    .filter((event) => isSameCalendarDay(new Date(event.dateTimeStart), today))
    .filter((event) => {
      const key = `${event.title}|${event.dateTimeStart}`;
      if (seenEvents.has(key)) return false;
      seenEvents.add(key);
      return true;
    }).length;

  const incompleteTasks = input.tasks.filter((task) => !task.completed).length;
  const monthTransactions = input.transactions.filter((transaction) =>
    transaction.date.startsWith(currentMonth),
  );
  const income = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expense = monthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const netThisMonth = income - expense;

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const tasksCreatedThisWeek = input.tasks.filter(
    (task) => new Date(task.createdAt) >= weekAgo,
  ).length;

  const isStatsLoading =
    (input.loading.events && input.events.length === 0) ||
    (input.loading.tasks && input.tasks.length === 0) ||
    (input.loading.finance && input.transactions.length === 0);

  const totalSignals =
    input.tasks.length + input.events.length + input.transactions.length;
  const isLowData = !isStatsLoading && totalSignals < 5;

  const suggestedActions: WorkspaceAction[] = [
    {
      title: "Finish active tasks",
      description: `Because ${incompleteTasks} item${incompleteTasks === 1 ? "" : "s"} still need attention.`,
      icon: "check",
      target: { route: "/tasks" },
      signalDomain: "tasks",
    },
    {
      title: "Review calendar",
      description: `Because today has ${eventsToday} scheduled event${eventsToday === 1 ? "" : "s"}.`,
      icon: "calendar",
      target: { route: "/calendar" },
      signalDomain: "calendar",
    },
    {
      title: "Continue Smart Academy",
      description: "Because a short focused session keeps learning in motion.",
      icon: "book",
      target: { route: "/learn-ai" },
      signalDomain: "learning",
    },
    {
      title: "Review budget",
      description: "Because your monthly net is part of today's workspace signal.",
      icon: "wallet",
      target: { route: "/finance" },
      signalDomain: "finance",
    },
  ];

  const dailyStoryBullets = [
    `${incompleteTasks} open task${incompleteTasks === 1 ? "" : "s"} need attention today.`,
    eventsToday > 0
      ? `${eventsToday} calendar event${eventsToday === 1 ? "" : "s"} may shape your available focus time.`
      : "Your calendar looks open enough for deeper work.",
    `This month is currently at ${formatCurrency(netThisMonth)} net.`,
    tasksCreatedThisWeek > 0
      ? `${tasksCreatedThisWeek} task${tasksCreatedThisWeek === 1 ? "" : "s"} were created this week, so start with the active list.`
      : "No new tasks were added this week, so review what is already in motion.",
  ];

  const latestConversation = input.chatSessions[0] ?? null;

  return {
    today: {
      date: today,
      label: todayLabel,
      greeting: getGreeting(today),
    },
    isLowData,
    signals: {
      isLoading: isStatsLoading,
      totalSignals,
      incompleteTasks,
      eventsToday,
      netThisMonth,
      netThisMonthLabel: formatCurrency(netThisMonth),
      tasksCreatedThisWeek,
    },
    hero: {
      title: `${getGreeting(today)}. ${input.goal.title}`,
      summary: input.goal.summary,
      skills: sortBySignalPriority(flowAISkills, input),
    },
    suggestedActions: sortBySignalPriority(suggestedActions, input),
    dailyStory: {
      bullets: dailyStoryBullets,
    },
    recommendationReasons: sortBySignalPriority([
      {
        title: "Your task load is visible.",
        body: `${incompleteTasks} open item${incompleteTasks === 1 ? "" : "s"} make focus selection useful today.`,
        signalDomain: "tasks",
      },
      {
        title: "Your calendar signal is clear.",
        body:
          eventsToday === 0
            ? "No events today leaves room for deeper work."
            : `${eventsToday} event${eventsToday === 1 ? "" : "s"} may shape your available time.`,
        signalDomain: "calendar",
      },
      {
        title: "New work appeared this week.",
        body:
          tasksCreatedThisWeek === 0
            ? "No new tasks were added, so continuing existing work is enough."
            : `${tasksCreatedThisWeek} task${tasksCreatedThisWeek === 1 ? "" : "s"} were created recently.`,
        signalDomain: "tasks",
      },
    ], input),
    signalFeed: input.signals,
    personalization: input.personalization,
    goal: input.goal,
    welcome: {
      setupActions: welcomeSetupActions,
      learningSignals: welcomeLearningSignals,
    },
    rightRail: {
      statusMessage: isLowData
        ? "I'm learning from your first workspace signals."
        : "Always learning from your workspace.",
      recentLessons,
      recommendations: sortBySignalPriority(rightRailRecommendations, input),
      recentConversation: latestConversation
        ? {
            title: latestConversation.title,
            relativeTime: formatRelativeTime(latestConversation.updatedAt, today),
          }
        : null,
      isChatLoading: input.loading.chat,
    },
  };
}
