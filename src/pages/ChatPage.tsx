import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Bot,
  Briefcase,
  Calendar,
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
import { useT } from '@/i18n'
import briefingArt from '@/assets/dashboard-briefing-192.png'
import type { TranslationKey } from '@/i18n'
import { useChatSessions } from '@/hooks/useChatSessions'

interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
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

function AssistantContent({ content }: Readonly<{ content: string }>) {
  const md = content.replace(/^•\s*/gm, '- ')
  return <ReactMarkdown components={MSG_MD_COMPONENTS}>{md}</ReactMarkdown>
}

function ChatBubble({ role, content }: Readonly<{
  role: 'user' | 'assistant'
  content: string
}>) {
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
        dir="auto"
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
  const { t } = useT()
  const location = useLocation()
  const nav = useNavigate()
  const { sessions, refresh: refreshSessions, createSession, deleteSession } = useChatSessions()

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
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

      const res = await fetch(`${workerUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      })

      if (!res.ok) throw new Error(`Worker responded ${res.status}`)

      const { reply } = await res.json() as { reply: string }

      setMessages(prev => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', content: text },
        { id: `a-${Date.now() + 1}`, role: 'assistant', content: reply },
      ])

      void refreshSessions()
    } catch {
      setSendError(t('chat_error_send'))
      if (!overrideText) setDraft(text)
    } finally {
      setSending(false)
    }
  }, [draft, sending, workerUrl, t, activeSessionId, createSession, refreshSessions])

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
                    <div className="glass-card rounded-2xl p-5 w-full">
                      <div className="flex items-center gap-4">
                        <img
                          src={briefingArt}
                          alt=""
                          className="w-20 sm:w-24 h-auto animate-pulse-soft select-none shrink-0"
                        />
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
                  <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
                ))}

                {sending && <TypingIndicator label={t('chat_typing')} />}

                <div ref={bottomRef} />
              </div>

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
    </div>
  )
}
