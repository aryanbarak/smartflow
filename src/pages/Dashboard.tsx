import { type ReactNode, useMemo, useState } from "react";
import {
  WorkspaceReveal,
  WorkspaceRevealSection,
} from "@/components/animations/WorkspaceReveal";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Briefcase,
  Calendar,
  CheckSquare,
  FileText,
  Flame,
  MessageSquare,
  Music,
  Pause,
  Play,
  Plus,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AddHabitModal } from "@/features/habits/components/AddHabitModal";
import { AgentBriefingCard } from "@/components/AgentBriefingCard";
import "@/components/AgentBriefingCard.css";
import { FlowAIOrb } from "@/components/FlowAIOrb";
import { SmartflowAsciiVisual } from "@/components/smartflow";
import { SmartAcademyWidget } from "@/components/dashboard/SmartAcademyWidget";
import { TodaysFocusWidget } from "@/components/dashboard/TodaysFocusWidget";
import { AiInsightsWidget } from "@/components/dashboard/AiInsightsWidget";
import { RecommendedTopicsWidget } from "@/components/dashboard/RecommendedTopicsWidget";
import { useSetPageTitle } from "@/hooks/useSetPageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonBlock } from "@/components/common/Skeletons";
import { useMusicPlayer, loadHistory } from "@/hooks/useMusicPlayer";
import { useWorkspace } from "@/features/workspace";
import { trackWorkspaceInteraction } from "@/features/workspace";
import type {
  WorkspaceIconKey,
  WorkspaceInteractionSource,
  WorkspaceInteractionType,
  WorkspaceNavigationTarget,
  WorkspaceRightRail,
  WorkspaceSignalDomain,
  WorkspaceSkill,
  WorkspaceWelcome,
} from "@/features/workspace";

const workspaceIconMap = {
  book: BookOpen,
  briefcase: Briefcase,
  calendar: Calendar,
  check: CheckSquare,
  file: FileText,
  flame: Flame,
  message: MessageSquare,
  sparkles: Sparkles,
  wallet: Wallet,
} satisfies Record<WorkspaceIconKey, typeof BookOpen>;

function navigateToWorkspaceTarget(
  navigate: ReturnType<typeof useNavigate>,
  target: WorkspaceNavigationTarget,
) {
  if (target.initialPrompt) {
    navigate(target.route, {
      state: { initialPrompt: target.initialPrompt },
    });
    return;
  }
  navigate(target.route);
}

function domainForWorkspaceRoute(route: string): WorkspaceSignalDomain {
  if (route === "/tasks") return "tasks";
  if (route === "/calendar") return "calendar";
  if (route === "/finance") return "finance";
  if (route === "/documents") return "documents";
  if (route === "/learn-ai") return "learning";
  if (route === "/briefing/weekly") return "documents";
  if (route === "/journal") return "documents";
  return "learning";
}

function trackWorkspaceUiClick({
  type,
  domain,
  targetId,
  targetTitle,
  source,
  metadata,
}: {
  type: WorkspaceInteractionType;
  domain: WorkspaceSignalDomain;
  targetId?: string;
  targetTitle: string;
  source: WorkspaceInteractionSource;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  trackWorkspaceInteraction({
    type,
    domain,
    targetId,
    targetTitle,
    source,
    metadata,
  });
}

function trackAndNavigateToWorkspaceTarget(
  navigate: ReturnType<typeof useNavigate>,
  target: WorkspaceNavigationTarget,
  options: {
    type: WorkspaceInteractionType;
    source: WorkspaceInteractionSource;
    targetTitle: string;
    targetId?: string;
    domain?: WorkspaceSignalDomain;
    metadata?: Record<string, string | number | boolean | null>;
  },
) {
  trackWorkspaceUiClick({
    type: options.type,
    domain: options.domain ?? domainForWorkspaceRoute(target.route),
    targetId: options.targetId ?? target.route,
    targetTitle: options.targetTitle,
    source: options.source,
    metadata: options.metadata,
  });
  navigateToWorkspaceTarget(navigate, target);
}

function FocusPlaylistCard() {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, pause, resume, playYouTube } =
    useMusicPlayer();
  const lastPlayed = useMemo(() => loadHistory()[0] ?? null, []);

  const isYouTube = currentTrack?.type === "youtube";
  const trackTitle = currentTrack
    ? currentTrack.type === "youtube"
      ? currentTrack.title
      : currentTrack.name
    : null;
  const videoId = isYouTube ? currentTrack.videoId : null;
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : null;

  return (
    <Card className="glass-card">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-3">
          <div className="icon-tile w-7 h-7 rounded-md">
            <Music className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold">Focus Playlist</p>
        </div>

        {currentTrack ? (
          <div className="flex items-center gap-3">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt=""
                className="w-12 h-12 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="icon-tile w-12 h-12 rounded-md">
                <Music className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{trackTitle}</p>
              <p className="text-[10px] text-muted-foreground">
                {isPlaying ? "Now playing" : "Paused"}
              </p>
            </div>
            <button
              type="button"
              aria-label={isPlaying ? "Pause" : "Resume"}
              onClick={isPlaying ? pause : resume}
              className="icon-tile w-8 h-8 rounded-full shrink-0 hover:bg-primary/20 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-primary" />
              ) : (
                <Play className="w-4 h-4 text-primary ml-0.5" />
              )}
            </button>
          </div>
        ) : lastPlayed ? (
          <div className="flex items-center gap-3">
            <img
              src={`https://img.youtube.com/vi/${lastPlayed.videoId}/mqdefault.jpg`}
              alt=""
              className="w-12 h-12 rounded-md object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">
                {lastPlayed.title}
              </p>
              <p className="text-[10px] text-muted-foreground">Last played</p>
            </div>
            <button
              type="button"
              aria-label="Play"
              onClick={() =>
                playYouTube(lastPlayed.videoId, lastPlayed.title)
              }
              className="icon-tile w-8 h-8 rounded-full shrink-0 hover:bg-primary/20 transition-colors"
            >
              <Play className="w-4 h-4 text-primary ml-0.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              No recent tracks
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2"
              onClick={() => navigate("/music")}
            >
              <Music className="w-3.5 h-3.5" />
              Browse Music
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FlowAIAssistantRail({ rail }: Readonly<{ rail: WorkspaceRightRail }>) {
  const navigate = useNavigate();
  const visibleLessons = rail.recentLessons.slice(0, 6);
  const visibleRecommendations = rail.recommendations.slice(0, 6);
  const visibleConversations = rail.recentConversation
    ? [rail.recentConversation].slice(0, 3)
    : [];

  return (
    <Card className="glass-card relative overflow-hidden">
      <SmartflowAsciiVisual
        variant="sphere"
        className="pointer-events-none absolute -right-24 -top-24 h-[300px] w-[300px] opacity-30"
      />

      <CardContent className="relative z-10 space-y-4 p-4">
        <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-visible">
              <FlowAIOrb
                size="md"
                state="presence"
                beam={false}
                particles
                glowIntensity={0.9}
                theme="transparent"
                ariaLabel="Flow AI active assistant"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Flow AI</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-45" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Online
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  {rail.statusMessage}
                </p>
              </div>
            </div>
          </div>

        <Button
          size="sm"
          className="w-full gap-2 text-white border-0"
          style={{ background: "var(--gradient-primary)" }}
          onClick={() => {
            trackWorkspaceUiClick({
              type: "chat_opened",
              domain: "learning",
              targetId: "flow-ai-chat",
              targetTitle: "Chat with Flow AI",
              source: "flow_ai",
            });
            navigate("/chat");
          }}
        >
          <MessageSquare className="w-4 h-4" />
          Chat with Flow AI
        </Button>

        <div className="border-t border-border/35 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Continue learning
          </p>
          <div className="space-y-2">
            {visibleLessons.map((lesson) => {
              const LessonIcon = workspaceIconMap[lesson.icon];
              return (
                <button
                  key={lesson.title}
                  type="button"
                  onClick={() => {
                    trackWorkspaceUiClick({
                      type: "learning_continued",
                      domain: "learning",
                      targetId: lesson.title,
                      targetTitle: lesson.title,
                      source: "right_rail_learning",
                      metadata: { progress: lesson.progress },
                    });
                    navigate("/learn-ai");
                  }}
                  className="group w-full rounded-lg border border-border/25 bg-background/15 px-2.5 py-2 text-left transition-colors hover:border-primary/35 hover:bg-primary/10"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="icon-tile h-7 w-7 rounded-md bg-primary/10">
                      <LessonIcon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium">{lesson.title}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {lesson.progress}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary/50">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${lesson.progress}%`,
                            background: "var(--gradient-primary)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                trackWorkspaceUiClick({
                  type: "view_all_clicked",
                  domain: "learning",
                  targetId: "right-rail-learning-view-all",
                  targetTitle: "Continue learning",
                  source: "right_rail_learning",
                });
                navigate("/learn-ai");
              }}
              className="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium text-primary transition-colors hover:bg-primary/10 hover:text-primary/85"
            >
              View all
            </button>
          </div>
        </div>

        <div className="border-t border-border/35 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recommended today
          </p>
          <div className="grid grid-cols-1 gap-2">
            {visibleRecommendations.map((item) => {
              const ItemIcon = workspaceIconMap[item.icon];
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() =>
                    trackAndNavigateToWorkspaceTarget(navigate, item.target, {
                      type: "recommendation_opened",
                      source: "right_rail_recommendations",
                      targetId: item.title,
                      targetTitle: item.title,
                      domain: item.signalDomain,
                    })
                  }
                  className="group rounded-lg border border-border/25 bg-background/15 px-2.5 py-2 text-left transition-colors hover:border-primary/35 hover:bg-primary/10"
                >
                  <div className="flex gap-2.5">
                    <div className="icon-tile h-7 w-7 rounded-md bg-primary/10">
                      <ItemIcon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-4">{item.title}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() =>
                trackWorkspaceUiClick({
                  type: "view_all_clicked",
                  domain: "learning",
                  targetId: "right-rail-recommendations-view-all",
                  targetTitle: "Recommended today",
                  source: "right_rail_recommendations",
                })
              }
              className="rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium text-primary transition-colors hover:bg-primary/10 hover:text-primary/85"
            >
              View all
            </button>
          </div>
        </div>

        <div className="border-t border-border/35 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Recent conversation
          </p>
          {rail.isChatLoading ? (
            <div className="rounded-lg border border-border/25 bg-background/15 p-3">
              <SkeletonBlock className="h-3 w-32" />
              <SkeletonBlock className="mt-2 h-2.5 w-16" />
            </div>
          ) : visibleConversations.length > 0 ? (
            <div className="space-y-2">
              {visibleConversations.map((conversation) => (
                <button
                  key={`${conversation.title}-${conversation.relativeTime}`}
                  type="button"
                  onClick={() => {
                    trackWorkspaceUiClick({
                      type: "conversation_opened",
                      domain: "learning",
                      targetId: conversation.title,
                      targetTitle: conversation.title,
                      source: "recent_conversation",
                      metadata: { relativeTime: conversation.relativeTime },
                    });
                    navigate("/chat");
                  }}
                  className="w-full rounded-lg border border-border/25 bg-background/15 p-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/10"
                >
                  <p className="truncate text-xs font-medium" dir="auto">
                    {conversation.title}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {conversation.relativeTime}
                  </p>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  trackWorkspaceUiClick({
                    type: "view_all_clicked",
                    domain: "learning",
                    targetId: "recent-conversation-view-all",
                    targetTitle: "Recent conversation",
                    source: "recent_conversation",
                  });
                  navigate("/chat");
                }}
                className="w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium text-primary transition-colors hover:bg-primary/10 hover:text-primary/85"
              >
                View all
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-border/25 bg-background/15 p-3">
              <p className="text-xs font-medium">No recent conversation yet.</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                Your latest Flow AI thread will appear here.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HeroSkills({
  className = "",
  skills,
}: Readonly<{ className?: string; skills: WorkspaceSkill[] }>) {
  const navigate = useNavigate();

  return (
    <section className={className}>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            How I can help today
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {skills.map((skill) => {
            const SkillIcon = workspaceIconMap[skill.icon];
            return (
              <button
                key={skill.title}
                type="button"
                onClick={() =>
                  trackAndNavigateToWorkspaceTarget(navigate, skill.target, {
                    type: "skill_opened",
                    source: "hero",
                    targetId: skill.title,
                    targetTitle: skill.title,
                    domain: skill.signalDomain,
                  })
                }
                className="group flex min-h-[92px] items-start gap-3 rounded-xl border border-border/35 bg-background/25 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/10 hover:shadow-[0_0_24px_rgba(139,92,246,0.12)]"
              >
                <div className="icon-tile h-9 w-9 rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <SkillIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-5">{skill.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {skill.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WelcomeWorkspace({
  afterHero,
  welcome,
}: Readonly<{ afterHero?: ReactNode; welcome: WorkspaceWelcome }>) {
  const navigate = useNavigate();

  return (
    <>
      <WorkspaceRevealSection order={0}>
        <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-card/35 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{
              background:
                "radial-gradient(ellipse 46% 34% at 50% 0%, rgba(196,184,255,0.13), transparent 72%), radial-gradient(ellipse 32% 22% at 12% 12%, rgba(34,211,238,0.055), transparent 74%)",
            }}
          />
          <div className="relative z-10 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/75">
              Welcome Workspace
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.8rem]">
              Welcome to SmartFlow.
            </h1>
            <p className="mt-3 text-base leading-7 text-foreground/90">
              I&apos;m still learning how you work.
            </p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              Add a few signals and I&apos;ll start preparing your workspace.
            </p>
          </div>
        </section>
      </WorkspaceRevealSection>
      {afterHero}

      <WorkspaceRevealSection order={1}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Setup Signals
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Start with these</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {welcome.setupActions.map((action) => {
              const ActionIcon = workspaceIconMap[action.icon];
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() =>
                    trackAndNavigateToWorkspaceTarget(navigate, action.target, {
                      type: "action_clicked",
                      source: "suggested_actions",
                      targetId: action.label,
                      targetTitle: action.label,
                    })
                  }
                  className="group flex min-h-[104px] flex-col rounded-xl border border-border/35 bg-background/25 p-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/10"
                >
                  <ActionIcon className="h-4 w-4 text-primary" />
                  <span className="mt-3 text-sm font-semibold">{action.label}</span>
                  <span className="mt-1 text-xs leading-5 text-muted-foreground">
                    {action.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={2}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              What I need to learn
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">The signals that shape your workspace</h2>
          </div>
          <div className="rounded-xl border border-border/25 bg-background/15 p-4 backdrop-blur-sm">
            <ul className="grid gap-2 text-sm text-foreground/90 sm:grid-cols-2">
              {welcome.learningSignals.map((item) => (
                <li key={item} className="flex gap-2 rounded-lg border border-border/25 bg-secondary/[0.06] px-3 py-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span className="leading-5">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </WorkspaceRevealSection>
    </>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showDailyStoryDetails, setShowDailyStoryDetails] = useState(false);
  const workspace = useWorkspace();

  useSetPageTitle("Dashboard", workspace.today.label);

  return (
    <WorkspaceReveal className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 pt-5 lg:pt-6 pb-8 space-y-7 [&_.glass-card]:!bg-card/45 [&_.glass-card]:!border-primary/10 [&_.card-accent]:before:!opacity-25">
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-7">
          {workspace.isLowData ? (
            <WelcomeWorkspace
              afterHero={
                <WorkspaceRevealSection order={1} className="lg:hidden">
                  <FlowAIAssistantRail rail={workspace.rightRail} />
                </WorkspaceRevealSection>
              }
              welcome={workspace.welcome}
            />
          ) : (
            <>
      <WorkspaceRevealSection order={0}>
        <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-card/35 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{
              background:
                "radial-gradient(ellipse 46% 34% at 50% 0%, rgba(196,184,255,0.13), transparent 72%), radial-gradient(ellipse 32% 22% at 12% 12%, rgba(34,211,238,0.055), transparent 74%)",
            }}
          />

          <div className="relative z-10 flex flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/75">
              {workspace.today.label}
            </p>
            <h1 className="mt-1.5 max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
              {workspace.hero.title}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {workspace.hero.summary}
            </p>

            <HeroSkills
              className="mt-5 hidden lg:block"
              skills={workspace.hero.skills}
            />

            <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border/25 bg-secondary/[0.07] px-3 py-2.5 text-left sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Today&apos;s Signals
              </p>
              {workspace.signals.isLoading ? (
                <div className="flex flex-wrap gap-3">
                  <SkeletonBlock className="h-4 w-16" />
                  <SkeletonBlock className="h-4 w-16" />
                  <SkeletonBlock className="h-4 w-20" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    <span className="text-foreground">{workspace.signals.incompleteTasks}</span> Tasks
                  </span>
                  <span>
                    <span className="text-foreground">{workspace.signals.eventsToday}</span> Events
                  </span>
                  <span>
                    <span className="text-foreground">€{workspace.signals.netThisMonthLabel}</span> Net
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={1} className="lg:hidden">
        <FlowAIAssistantRail rail={workspace.rightRail} />
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={2} className="lg:hidden">
        <HeroSkills skills={workspace.hero.skills} />
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={1}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              My Suggested Actions
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">I surfaced these next</h2>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-primary/[0.025] p-2.5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {workspace.suggestedActions.map((action) => {
                const ActionIcon = workspaceIconMap[action.icon];
                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() =>
                      trackAndNavigateToWorkspaceTarget(navigate, action.target, {
                        type: "action_clicked",
                        source: "suggested_actions",
                        targetId: action.title,
                        targetTitle: action.title,
                        domain: action.signalDomain,
                      })
                    }
                    className="group flex min-h-[86px] flex-col rounded-xl border border-border/35 bg-background/25 p-3 text-left transition-colors hover:border-primary/35 hover:bg-primary/10"
                  >
                    <ActionIcon className="h-4 w-4 text-primary" />
                    <span className="mt-2.5 text-sm font-semibold">{action.title}</span>
                    <span className="mt-1 text-xs leading-5 text-muted-foreground">
                      {action.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={2}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              AI Reasoning
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Why these matter today</h2>
          </div>

          <div className="rounded-xl border border-border/25 bg-background/15 p-3 text-left backdrop-blur-sm sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  AI Reasoning
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDailyStoryDetails((value) => !value)}
                className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                {showDailyStoryDetails ? "Show less" : "Read full briefing"}
              </button>
            </div>

            <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-foreground/90 sm:grid-cols-2">
              {workspace.dailyStory.bullets.map((item) => (
                <li key={item} className="flex gap-2 border-t border-border/30 py-2 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span className="leading-5">{item}</span>
                </li>
              ))}
            </ul>

            {showDailyStoryDetails && (
              <div className="mt-4 border-t border-border/50 pt-4 [&_.agent-briefing-card]:!bg-transparent [&_.agent-briefing-card]:!border-0 [&_.agent-briefing-card]:!p-0 [&_.agent-briefing-card]:!m-0 [&_.agent-briefing-card]:!rounded-none">
                <AgentBriefingCard />
              </div>
            )}
          </div>
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={3}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              What needs attention
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Today&apos;s focus</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
            <TodaysFocusWidget />
            <AiInsightsWidget />
          </div>
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={4}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Continue Learning
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Selected for your current momentum</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Continue from the Smart Academy path already waiting in your workspace.
            </p>
          </div>
          <SmartAcademyWidget />
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={5}>
        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recommended Today
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Because I noticed...</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {workspace.recommendationReasons.map((reason) => (
              <p
                key={reason.title}
                className="flex-1 rounded-lg border border-border/35 bg-secondary/10 px-3 py-2 text-xs leading-5 text-muted-foreground"
              >
                <span className="font-medium text-foreground">{reason.title}</span>{" "}
                {reason.body}
              </p>
            ))}
          </div>
          <RecommendedTopicsWidget />
        </section>
      </WorkspaceRevealSection>

      <WorkspaceRevealSection order={6}>
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-4">
          <Card className="glass-card">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="icon-tile w-7 h-7 rounded-md">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Manual Actions</p>
                  <p className="text-xs text-muted-foreground">Still available when you need a direct shortcut.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => {
                    trackWorkspaceUiClick({
                      type: "action_clicked",
                      domain: "tasks",
                      targetId: "manual-new-task",
                      targetTitle: "New Task",
                      source: "manual_actions",
                    });
                    navigate("/tasks");
                  }}
                  className="flex items-center gap-2 rounded-lg border border-border/45 bg-secondary/15 px-3 py-2.5 text-left text-foreground transition-colors hover:bg-secondary/35 hover:border-primary/30"
                >
                  <div className="icon-tile w-6 h-6 rounded-md bg-violet-500/15">
                    <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <span className="text-[11px] font-medium">New Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackWorkspaceUiClick({
                      type: "action_clicked",
                      domain: "documents",
                      targetId: "manual-journal",
                      targetTitle: "Journal",
                      source: "manual_actions",
                    });
                    navigate("/journal");
                  }}
                  className="flex items-center gap-2 rounded-lg border border-border/45 bg-secondary/15 px-3 py-2.5 text-left text-foreground transition-colors hover:bg-secondary/35 hover:border-primary/30"
                >
                  <div className="icon-tile w-6 h-6 rounded-md bg-blue-500/15">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-[11px] font-medium">Journal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackWorkspaceUiClick({
                      type: "action_clicked",
                      domain: "habits",
                      targetId: "manual-add-habit",
                      targetTitle: "Add Habit",
                      source: "manual_actions",
                    });
                    setShowAddHabit(true);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-border/45 bg-secondary/15 px-3 py-2.5 text-left text-foreground transition-colors hover:bg-secondary/35 hover:border-primary/30"
                >
                  <div className="icon-tile w-6 h-6 rounded-md bg-orange-500/15">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <span className="text-[11px] font-medium">Add Habit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackWorkspaceUiClick({
                      type: "action_clicked",
                      domain: "finance",
                      targetId: "manual-record-expense",
                      targetTitle: "Record Expense",
                      source: "manual_actions",
                    });
                    navigate("/finance");
                  }}
                  className="flex items-center gap-2 rounded-lg border border-border/45 bg-secondary/15 px-3 py-2.5 text-left text-foreground transition-colors hover:bg-secondary/35 hover:border-primary/30"
                >
                  <div className="icon-tile w-6 h-6 rounded-md bg-emerald-500/15">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-medium">Record Expense</span>
                </button>
              </div>
            </CardContent>
          </Card>
          <FocusPlaylistCard />
          {showAddHabit && (
            <AddHabitModal onClose={() => setShowAddHabit(false)} />
          )}
        </section>
      </WorkspaceRevealSection>
            </>
          )}
        </div>

        <WorkspaceRevealSection order={2} className="hidden lg:sticky lg:top-6 lg:block">
          <FlowAIAssistantRail rail={workspace.rightRail} />
        </WorkspaceRevealSection>
      </div>
    </WorkspaceReveal>
  );
}
