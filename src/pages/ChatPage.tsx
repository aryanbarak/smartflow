import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  CheckSquare,
  FileText,
  Flame,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Wallet,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/features/profile/useProfile'
import { useTasks } from '@/hooks/useTasks'
import { SmartFlowIcon } from '@/components/SmartFlowLogo'
import { SmartflowAsciiVisual } from '@/components/smartflow'
import { useT } from '@/i18n'
import type { TranslationKey } from '@/i18n'
import { useChatSessions } from '@/hooks/useChatSessions'
import { useAppearance } from '@/features/settings/appearanceStore'
import {
  createLlmReasoningCaller,
  getToolById,
  reasonAboutUserMessage,
  resolveToolForStep,
  runReadOnlyTool,
  runWriteTool,
  type AgentReasoningResult,
  type ReadOnlyRuntimeResult,
  type WriteRuntimeResult,
  type ApprovalInteractionResult,
} from '@/features/agent'
import { StepApprovalDialog } from '@/features/workspace/components/StepApprovalDialog'
import { useWorkspace } from '@/features/workspace'
import type {
  WorkspacePlanActionType,
  WorkspacePlanStep,
  WorkspaceStepApproval,
} from '@/features/workspace'
import type { ToolResolutionResult } from '@/features/agent'
import {
  getAiResponseDirection,
  getAiResponseLanguageInstruction,
  getStoredAiResponseLanguage,
  resolveAiResponseLanguage,
  type SupportedAiResponseLanguage,
} from '@/features/ai/responseLanguage'

interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
  language?: SupportedAiResponseLanguage
}

interface QuickAction {
  labelKey: TranslationKey
  descKey: TranslationKey
  icon: React.ElementType
  iconBg: string
  iconColor: string
  prompt: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    labelKey: 'flow_action_study',
    descKey: 'flow_action_study_desc',
    icon: BookOpen,
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    prompt: 'Help me study and review a concept for my FIAE exam.',
  },
  {
    labelKey: 'flow_action_plan',
    descKey: 'flow_action_plan_desc',
    icon: Calendar,
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
    prompt: 'Help me plan my day effectively based on my tasks and goals.',
  },
  {
    labelKey: 'flow_action_habits',
    descKey: 'flow_action_habits_desc',
    icon: Flame,
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    prompt: 'Analyze my habits and give me insights on my patterns.',
  },
  {
    labelKey: 'flow_action_finance',
    descKey: 'flow_action_finance_desc',
    icon: Wallet,
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    prompt: 'Review my finances and help me understand my spending.',
  },
  {
    labelKey: 'flow_action_weekly',
    descKey: 'flow_action_weekly_desc',
    icon: FileText,
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    prompt: 'Give me a weekly summary of my progress and priorities.',
  },
  {
    labelKey: 'flow_action_career',
    descKey: 'flow_action_career_desc',
    icon: Briefcase,
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-400',
    prompt: 'Help me with my job search and interview preparation.',
  },
]

function MsgP({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="mb-1 last:mb-0">{children}</p>
}
function MsgUl({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ul className="list-disc pl-4 mt-1 space-y-0.5">{children}</ul>
}
function MsgLi({ children }: Readonly<{ children: React.ReactNode }>) {
  return <li>{children}</li>
}
const MSG_MD_COMPONENTS = { p: MsgP, ul: MsgUl, li: MsgLi } as const

type ReasoningRunStatus = 'idle' | 'running' | 'success' | 'failed' | 'approval_required' | 'approved' | 'rejected'
type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string

interface ReasoningProposalState {
  result: AgentReasoningResult
  step: WorkspacePlanStep | null
  resolution: ToolResolutionResult | null
  approval: WorkspaceStepApproval | null
  runStatus: ReasoningRunStatus
  readOnlyResult?: ReadOnlyRuntimeResult
  writeResult?: WriteRuntimeResult
}

const readIntentAction: Record<string, WorkspacePlanActionType> = {
  inspect_tasks: 'review',
  inspect_calendar: 'review',
  inspect_learning: 'continue',
  inspect_workspace: 'inspect',
}

function isWorkspaceActionMessage(message: string) {
  return /\b(task|tasks|calendar|learning|lesson|workspace|complete|done|todo|kalender|aufgabe|lernen|یادگیری|کار|تقویم)\b/i.test(message)
}

function intentTitleKey(type: AgentReasoningResult['proposal']['type']): TranslationKey {
  switch (type) {
    case 'inspect_tasks':
      return 'agent_intent_title_inspect_tasks'
    case 'inspect_calendar':
      return 'agent_intent_title_inspect_calendar'
    case 'inspect_learning':
      return 'agent_intent_title_inspect_learning'
    case 'inspect_workspace':
      return 'agent_intent_title_inspect_workspace'
    case 'complete_task':
      return 'agent_intent_title_complete_task'
    case 'ask_clarification':
      return 'agent_intent_title_clarification'
    default:
      return 'agent_intent_title_unsupported'
  }
}

function intentTitle(type: AgentReasoningResult['proposal']['type'], t: Translate) {
  return t(intentTitleKey(type))
}

function stepForReasoning(result: AgentReasoningResult, t: Translate): WorkspacePlanStep | null {
  const proposal = result.proposal
  if (!proposal.toolId || proposal.type === 'ask_clarification' || proposal.type === 'unsupported') {
    return null
  }
  const domain =
    proposal.type === 'inspect_workspace'
      ? 'workspace'
      : proposal.type === 'inspect_calendar'
      ? 'calendar'
      : proposal.type === 'inspect_learning'
        ? 'learning'
        : 'tasks'
  const actionType = proposal.type === 'complete_task'
    ? 'complete'
    : readIntentAction[proposal.type] ?? 'inspect'
  const targetId = proposal.type === 'complete_task' ? proposal.target?.taskId : undefined

  return {
    id: `reasoning-step:${proposal.id}`,
    order: 1,
    title: intentTitle(proposal.type, t),
    description: proposal.type === 'complete_task'
      ? t('agent_intent_complete_description', { title: proposal.target?.taskTitleHint ?? t('agent_intent_selected_task') })
      : t('agent_intent_read_description', { toolId: proposal.toolId }),
    domain: domain as WorkspacePlanStep['domain'],
    estimatedMinutes: 5,
    status: 'proposed',
    actionType,
    targetId,
    reason: proposal.reasons[0] ?? t('agent_intent_validated_reason'),
    requiresApproval: proposal.requiresApproval,
    dependencies: [],
    optional: false,
  }
}

function writeResolutionForStep(step: WorkspacePlanStep): ToolResolutionResult | null {
  const tool = getToolById('tasks.complete')
  if (!tool) return null
  return {
    status: 'resolved',
    resolved: true,
    stepId: step.id,
    toolId: 'tasks.complete',
    tool,
    confidence: 'high',
    reasons: ['Resolved through the explicit tasks.complete reasoning mapping.'],
    candidates: [],
    requiredInput: ['taskId'],
    generatedAt: new Date().toISOString(),
    resolverVersion: 'tool-resolver-v1',
  }
}

function approvalForReasoningStep(step: WorkspacePlanStep, resolution: ToolResolutionResult, t: Translate): WorkspaceStepApproval | null {
  if (resolution.toolId !== 'tasks.complete' || !step.targetId) return null
  const tool = resolution.tool
  return {
    stepId: step.id,
    targetId: step.targetId,
    toolId: 'tasks.complete',
    toolName: tool?.name,
    toolDescription: tool?.description,
    toolCapability: tool?.capability,
    toolMode: tool?.mode,
    status: 'pending',
    requiresApproval: true,
    approvalReason: t('agent_intent_complete_approval_reason'),
    riskLevel: 'medium',
    reversible: true,
    externalEffect: true,
    dataDomains: ['tasks'],
    approvalScope: 'single_step',
  }
}

function proposalToState(result: AgentReasoningResult, t: Translate): ReasoningProposalState {
  const step = stepForReasoning(result, t)
  const resolution = step
    ? result.proposal.type === 'complete_task'
      ? writeResolutionForStep(step)
      : resolveToolForStep({ step })
    : null
  const approval = step && resolution?.resolved && result.proposal.type === 'complete_task'
    ? approvalForReasoningStep(step, resolution, t)
    : null
  return {
    result,
    step,
    resolution,
    approval,
    runStatus: result.proposal.requiresApproval ? 'approval_required' : 'idle',
  }
}

function resultMessage(result: ReadOnlyRuntimeResult | WriteRuntimeResult) {
  const items = 'safePreviewItems' in result ? result.safePreviewItems : []
  if (!items.length) return result.safeSummary
  return `${result.safeSummary}\n\n${items.map((item) => `- ${item}`).join('\n')}`
}

function ReasoningProposalCard({
  proposal,
  onRunReadOnly,
  onReviewApproval,
  onRunWrite,
}: Readonly<{
  proposal: ReasoningProposalState
  onRunReadOnly: () => void
  onReviewApproval: () => void
  onRunWrite: () => void
}>) {
  const { t } = useT()
  const { result, resolution, approval, runStatus } = proposal
  const toolId = resolution?.toolId ?? result.proposal.toolId
  const isRunning = runStatus === 'running'
  const isCompleteTask = result.proposal.type === 'complete_task'
  const isApproved = approval?.status === 'approved'
  const isRejected = approval?.status === 'rejected' || runStatus === 'rejected'
  const canRunReadOnly = Boolean(
    !isCompleteTask &&
    proposal.step &&
    resolution?.resolved &&
    runStatus !== 'success' &&
    runStatus !== 'failed'
  )
  const canReviewApproval = isCompleteTask && approval?.status === 'pending'
  const canRunWrite = isCompleteTask && isApproved && runStatus !== 'success' && runStatus !== 'failed'

  return (
    <div className="mb-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/80">
            {t('agent_intent_label')}
          </p>
          <p className="mt-1 text-sm font-semibold">
            {intentTitle(result.proposal.type, t)}
          </p>
        </div>
        {runStatus === 'success' && (
          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
        )}
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg border border-border/25 bg-background/30 px-2.5 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('agent_intent_tool')}
          </dt>
          <dd className="mt-1 font-medium">{toolId ?? t('agent_intent_no_runtime')}</dd>
        </div>
        <div className="rounded-lg border border-border/25 bg-background/30 px-2.5 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('agent_intent_confidence')}
          </dt>
          <dd className="mt-1 font-medium">{result.proposal.confidence}</dd>
        </div>
        {result.proposal.target?.taskTitleHint && (
          <div className="rounded-lg border border-border/25 bg-background/30 px-2.5 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('agent_intent_target')}
            </dt>
            <dd className="mt-1 truncate font-medium" title={result.proposal.target.taskTitleHint}>
              {result.proposal.target.taskTitleHint}
            </dd>
          </div>
        )}
      </dl>

      {isRejected && (
        <p className="mt-3 text-xs text-muted-foreground">{t('agent_intent_rejected')}</p>
      )}

      {!proposal.step || !resolution?.resolved ? (
        <p className="mt-3 text-xs text-muted-foreground">{t('agent_intent_no_runtime')}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {!isCompleteTask && (
            <Button
              type="button"
              size="sm"
              onClick={onRunReadOnly}
              disabled={!canRunReadOnly || isRunning}
            >
              {isRunning ? t('agent_intent_running') : `${t('agent_intent_run')} ${toolId}`}
            </Button>
          )}
          {canReviewApproval && (
            <Button type="button" size="sm" variant="outline" onClick={onReviewApproval}>
              {t('agent_intent_review_approval')}
            </Button>
          )}
          {isCompleteTask && isApproved && (
            <Button
              type="button"
              size="sm"
              onClick={onRunWrite}
              disabled={!canRunWrite || isRunning}
            >
              {isRunning ? t('agent_intent_running') : t('agent_intent_complete_task')}
            </Button>
          )}
        </div>
      )}

      {(proposal.readOnlyResult || proposal.writeResult) && (
        <p className="mt-3 rounded-lg border border-border/25 bg-background/30 px-3 py-2 text-xs leading-5 text-muted-foreground">
          {proposal.readOnlyResult?.safeSummary ?? proposal.writeResult?.safeSummary}
        </p>
      )}
    </div>
  )
}

function AssistantContent({ content }: Readonly<{ content: string }>) {
  const md = content.replace(/^•\s*/gm, '- ')
  return <ReactMarkdown components={MSG_MD_COMPONENTS}>{md}</ReactMarkdown>
}

function ChatBubble({ role, content, language }: Readonly<{
  role: 'user' | 'assistant'
  content: string
  language?: SupportedAiResponseLanguage
}>) {
  const direction = role === 'assistant' && language ? getAiResponseDirection(language) : 'auto'
  return (
    <div className={cn('flex gap-2.5', role === 'user' ? 'justify-end' : 'justify-start')}>
      {role === 'assistant' && (
        <div className="icon-tile w-7 h-7 rounded-full shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed break-words',
          role === 'user'
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'glass-card rounded-bl-sm'
        )}
        dir={direction}
        lang={language}
      >
        {role === 'assistant'
          ? <AssistantContent content={content} />
          : <span className="whitespace-pre-wrap">{content}</span>}
      </div>
    </div>
  )
}

function TypingIndicator({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex gap-2.5 justify-start">
      <div className="icon-tile w-7 h-7 rounded-full shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="glass-card rounded-xl rounded-bl-sm px-4 py-2.5 text-sm flex items-center gap-2">
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground" />
        <span className="text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function ChatPage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { tasks } = useTasks()
  const workspace = useWorkspace()
  const { t } = useT()
  const interfaceLanguage = useAppearance((state) => state.language)
  const location = useLocation()
  const nav = useNavigate()
  const { sessions, refresh: refreshSessions, createSession, deleteSession } = useChatSessions()

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [reasoningProposal, setReasoningProposal] = useState<ReasoningProposalState | null>(null)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const initialPromptFired = useRef(false)
  const workerUrl = import.meta.env.VITE_AGENT_WORKER_URL as string

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    if (!user?.id) return
    setLoading(true)
    setMessages([])
    const { data, error } = await supabase
      .from('agent_chat_messages')
      .select('id, role, content')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(
        data.map((r: { id: string; role: string; content: string }) => ({
          id: r.id,
          role: r.role as 'user' | 'assistant',
          content: r.content,
        }))
      )
    }
    setLoading(false)
  }, [user?.id])

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
    void loadSessionMessages(sessionId)
  }, [loadSessionMessages])

  const startNewChat = useCallback(() => {
    setActiveSessionId(null)
    setMessages([])
    setSendError(null)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? draft).trim()
    if (text === '' || sending) return
    const responseLanguage = resolveAiResponseLanguage({
      configuredResponseLanguage: getStoredAiResponseLanguage(),
      latestUserMessage: text,
      interfaceLanguage,
    })
    const responseLanguageInstruction = getAiResponseLanguageInstruction(responseLanguage)

    if (!overrideText) setDraft('')
    setSending(true)
    setSendError(null)

    let sessionId = activeSessionId

    try {
      if (!sessionId) {
        const newId = await createSession(text)
        if (!newId) throw new Error('Failed to create session')
        sessionId = newId
        setActiveSessionId(newId)
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session === null) throw new Error('No session')

      if (isWorkspaceActionMessage(text)) {
        const result = await reasonAboutUserMessage({
          userMessage: text,
          configuredResponseLanguage: getStoredAiResponseLanguage(),
          interfaceLanguage,
          safeContext: {
            tasks: workspace.agentContext.tasks,
            events: workspace.agentContext.events,
            learningProgress: workspace.agentContext.learningProgress,
            workspace: {
              goal: workspace.goal,
              plan: workspace.plan,
              signalFeed: workspace.signalFeed,
            },
          },
          sessionId,
        }, {
          callLlmReasoning: createLlmReasoningCaller({
            endpoint: `${workerUrl}/chat`,
            accessToken: session.access_token,
          }),
        })
        const proposalState = proposalToState(result, t)
        setReasoningProposal(proposalState)
        const assistantContent = result.proposal.clarificationQuestion
          ? result.proposal.clarificationQuestion
          : `${t('agent_intent_proposed')}: ${intentTitle(result.proposal.type, t)}. ${t('agent_intent_run_hint')}`

        setMessages(prev => [
          ...prev,
          { id: `u-${Date.now()}`, role: 'user', content: text },
          { id: `a-${Date.now() + 1}`, role: 'assistant', content: assistantContent, language: result.responseLanguage },
        ])

        void refreshSessions()
        return
      }

      const res = await fetch(`${workerUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          responseLanguage,
          responseLanguageInstruction,
        }),
      })

      if (!res.ok) throw new Error(`Worker responded ${res.status}`)

      const { reply } = await res.json() as { reply: string }

      setMessages(prev => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', content: text },
        { id: `a-${Date.now() + 1}`, role: 'assistant', content: reply, language: responseLanguage },
      ])

      void refreshSessions()
    } catch {
      setSendError(t('chat_error_send'))
      if (!overrideText) setDraft(text)
    } finally {
      setSending(false)
    }
  }, [draft, sending, workerUrl, t, activeSessionId, createSession, refreshSessions, interfaceLanguage, workspace])

  useEffect(() => {
    const prompt = (location.state as { initialPrompt?: string } | null)?.initialPrompt
    if (!prompt || initialPromptFired.current) return
    initialPromptFired.current = true
    nav(location.pathname, { replace: true, state: {} })
    void handleSend(prompt)
  }, [location.state, location.pathname, nav, handleSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey === false) {
      e.preventDefault()
      void handleSend()
    }
  }

  const appendAssistantResult = useCallback((content: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content,
        language: resolveAiResponseLanguage({
          configuredResponseLanguage: getStoredAiResponseLanguage(),
          interfaceLanguage,
        }),
      },
    ])
  }, [interfaceLanguage])

  const handleRunReasoningProposal = useCallback(async () => {
    if (!reasoningProposal?.step || !reasoningProposal.resolution?.resolved) return
    if (reasoningProposal.result.proposal.requiresApproval) return

    setReasoningProposal(prev => prev ? { ...prev, runStatus: 'running' } : prev)
    const currentTime = new Date()
    const runResult = await runReadOnlyTool({
      requestId: `reasoning:read:${reasoningProposal.resolution.toolId}:${reasoningProposal.step.id}:${currentTime.getTime()}`,
      step: reasoningProposal.step,
      toolResolution: reasoningProposal.resolution,
      approval: null,
      executionInput: {},
      executionContext: {
        ...workspace.agentContext,
        workspace,
        currentTime: currentTime.toISOString(),
      },
      currentTime,
    })

    setReasoningProposal(prev => prev ? {
      ...prev,
      runStatus: runResult.success ? 'success' : 'failed',
      readOnlyResult: runResult,
    } : prev)
    appendAssistantResult(resultMessage(runResult))
  }, [appendAssistantResult, reasoningProposal, workspace])

  const handleApprovalDecision = useCallback((decision: ApprovalInteractionResult) => {
    if (!decision.ok || decision.decision === 'closed') return
    setReasoningProposal(prev => {
      if (!prev) return prev
      return {
        ...prev,
        approval: decision.approval,
        runStatus: decision.decision === 'approved' ? 'approved' : 'rejected',
      }
    })
  }, [])

  const handleRunTaskCompleteProposal = useCallback(async () => {
    if (!reasoningProposal?.step || !reasoningProposal.resolution?.resolved) return
    if (reasoningProposal.approval?.status !== 'approved') return

    setReasoningProposal(prev => prev ? { ...prev, runStatus: 'running' } : prev)
    const currentTime = new Date()
    const writeResult = await runWriteTool({
      requestId: `reasoning:write:tasks.complete:${reasoningProposal.step.id}:${reasoningProposal.step.targetId}:${currentTime.getTime()}`,
      step: reasoningProposal.step,
      toolResolution: reasoningProposal.resolution,
      approval: reasoningProposal.approval,
      executionContext: {
        ...workspace.agentContext,
        workspace,
        currentTime: currentTime.toISOString(),
      },
      currentTime,
    }, {
      getAuthenticatedUserId: () => user?.id,
    })

    setReasoningProposal(prev => prev ? {
      ...prev,
      runStatus: writeResult.success ? 'success' : 'failed',
      writeResult,
    } : prev)
    if (writeResult.success) {
      void workspace.refresh?.tasks()
    }
    appendAssistantResult(resultMessage(writeResult))
  }, [appendAssistantResult, reasoningProposal, user?.id, workspace])

  const firstName =
    profile?.displayName?.trim()?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there'
  const conversationCount = messages.filter(m => m.role === 'user').length + sessions.length
  const taskCount = tasks.length

  const canSend = draft.trim().length > 0 && !sending && !loading
  const showWelcome = !activeSessionId && messages.length === 0 && !sending

  return (
    <div className="pb-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 lg:px-8 py-4 border-b border-border"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-tile">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">{t('chat_title')}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{t('chat_subtitle')}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={startNewChat}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('flow_new_chat')}</span>
          </Button>
        </div>
      </motion.header>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 px-4 sm:px-6 lg:px-8 pt-5">
        {/* Center column */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Quick actions — shown when no active session */}
          {showWelcome && (
            <div>
              <h3 className="text-sm font-semibold mb-3">{t('flow_quick_title')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.labelKey}
                    type="button"
                    disabled={sending}
                    onClick={() => void handleSend(action.prompt)}
                    className="glass-card flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:shadow-elevated hover:scale-[1.02] hover:border-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className={cn('icon-tile w-9 h-9 rounded-lg shrink-0', action.iconBg)}>
                      <action.icon className={cn('w-4 h-4', action.iconColor)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t(action.labelKey)}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{t(action.descKey)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation */}
          <Card className="glass-card card-accent">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
                <div className="icon-tile w-7 h-7 rounded-md">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                </div>
                {t('flow_conversation_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {/* Messages */}
              <div className="max-h-[450px] overflow-y-auto space-y-3 pr-1 mb-3">
                {loading && (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    {t('loading')}
                  </div>
                )}

                {!loading && messages.length === 0 && !sending && (
                  <div className="py-6">
                    <div className="glass-card relative overflow-hidden rounded-2xl p-5 w-full">
                      <SmartflowAsciiVisual
                        variant="wiremesh"
                        className="absolute -right-8 -top-10 h-44 w-44 opacity-45 sm:h-52 sm:w-52"
                      />
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-primary/10 bg-background/25">
                          <SmartflowAsciiVisual
                            variant="wiremesh"
                            className="h-full w-full opacity-80"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg sm:text-xl font-semibold">
                            {t('flow_greeting')}, {firstName} 👋
                          </h2>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('flow_hero_desc')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-4 pt-3 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <div className="icon-tile w-7 h-7 rounded-md">
                            <MessageSquare className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-base font-bold leading-none">{conversationCount}</p>
                            <p className="text-[10px] text-muted-foreground">{t('flow_stat_conversations')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="icon-tile w-7 h-7 rounded-md">
                            <CheckSquare className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-base font-bold leading-none">{taskCount}</p>
                            <p className="text-[10px] text-muted-foreground">{t('flow_stat_tasks')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map(msg => (
                  <ChatBubble key={msg.id} role={msg.role} content={msg.content} language={msg.language} />
                ))}

                {sending && <TypingIndicator label={t('chat_typing')} />}

                <div ref={bottomRef} />
              </div>

              {reasoningProposal && (
                <ReasoningProposalCard
                  proposal={reasoningProposal}
                  onRunReadOnly={handleRunReasoningProposal}
                  onReviewApproval={() => setApprovalDialogOpen(true)}
                  onRunWrite={handleRunTaskCompleteProposal}
                />
              )}

              {/* Input */}
              <div className="border-t border-border/40 pt-3">
                {sendError !== null && (
                  <p className="text-xs text-destructive mb-2">{sendError}</p>
                )}
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chat_placeholder')}
                    rows={5}
                    disabled={sending || loading}
                    className="resize-none min-h-[120px]"
                    dir="auto"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleSend()}
                    disabled={!canSend}
                    className="gap-1.5 self-end shrink-0"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {sending ? t('chat_sending') : t('chat_send')}
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar — session list */}
        <div className="w-full lg:w-[260px] shrink-0">
          <Card className="glass-card card-accent">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
                <div className="icon-tile w-7 h-7 rounded-md">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                </div>
                {t('flow_conversations')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t('flow_no_conversations')}
                </p>
              ) : (
                <ul className="max-h-[500px] overflow-y-auto space-y-1 -mx-1">
                  {sessions.map(s => (
                    <li key={s.id} className="group flex items-center">
                      <button
                        type="button"
                        onClick={() => selectSession(s.id)}
                        className={cn(
                          'flex-1 min-w-0 text-left rounded-lg px-2.5 py-2 transition-colors',
                          s.id === activeSessionId
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-secondary/30'
                        )}
                      >
                        <p className="text-xs font-medium truncate" dir="auto">
                          {s.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {timeAgo(s.updated_at)}
                        </p>
                      </button>
                      <button
                        type="button"
                        aria-label="Delete conversation"
                        onClick={async () => {
                          const ok = await deleteSession(s.id);
                          if (ok && activeSessionId === s.id) startNewChat();
                        }}
                        className="shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <StepApprovalDialog
        open={approvalDialogOpen}
        step={reasoningProposal?.step ?? null}
        stepApproval={reasoningProposal?.approval ?? null}
        tool={reasoningProposal?.resolution?.tool ?? null}
        onClose={() => setApprovalDialogOpen(false)}
        onDecision={handleApprovalDecision}
      />
    </div>
  )
}
