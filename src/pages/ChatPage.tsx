import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useT } from '@/i18n'

// =============================================
// Types
// =============================================
interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// =============================================
// Markdown sub-components for assistant bubbles
// =============================================
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

// =============================================
// Sub-components
// =============================================
function ChatBubble({ role, content }: Readonly<{
  role: 'user' | 'assistant'
  content: string
}>) {
  return (
    <div className={cn('flex', role === 'user' ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed break-words',
          role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-foreground'
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
    <div className="flex justify-start">
      <div className="bg-secondary rounded-lg px-4 py-2.5 text-sm flex items-center gap-2">
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground" />
        <span className="text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

// =============================================
// ChatPage
// =============================================
export default function ChatPage() {
  const { user } = useAuth()
  const { t } = useT()
  const location = useLocation()
  const nav = useNavigate()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const initialPromptFired = useRef(false)
  const workerUrl = import.meta.env.VITE_AGENT_WORKER_URL as string

  // Load history on mount
  useEffect(() => {
    if (user?.id === undefined) return
    let active = true
    setLoading(true)

    supabase
      .from('agent_chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data, error: err }: { data: Array<{ id: string; role: string; content: string }> | null; error: unknown }) => {
        if (!active) return
        if (data !== null && err === null) {
          setMessages(
            data.map(r => ({
              id: r.id,
              role: r.role as 'user' | 'assistant',
              content: r.content,
            }))
          )
        }
        setLoading(false)
      })

    return () => { active = false }
  }, [user?.id])

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? draft).trim()
    if (text === '' || sending) return

    if (!overrideText) setDraft('')
    setSending(true)
    setSendError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session === null) throw new Error('No session')

      const res = await fetch(`${workerUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) throw new Error(`Worker responded ${res.status}`)

      const { reply } = await res.json() as { reply: string }

      setMessages(prev => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', content: text },
        { id: `a-${Date.now() + 1}`, role: 'assistant', content: reply },
      ])
    } catch {
      setSendError(t('chat_error_send'))
      if (!overrideText) setDraft(text)
    } finally {
      setSending(false)
    }
  }, [draft, sending, workerUrl, t])

  // Auto-send initial prompt from location state (e.g. Dashboard suggested prompts)
  useEffect(() => {
    const prompt = (location.state as { initialPrompt?: string } | null)?.initialPrompt
    if (!prompt || loading || initialPromptFired.current) return
    initialPromptFired.current = true
    nav(location.pathname, { replace: true, state: {} })
    void handleSend(prompt)
  }, [loading, location.state, location.pathname, nav, handleSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey === false) {
      e.preventDefault()
      void handleSend()
    }
  }

  const canSend = draft.trim().length > 0 && !sending && !loading

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 px-6 lg:px-8 py-5 border-b border-border"
      >
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-semibold leading-tight">{t('chat_title')}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t('chat_subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Message list */}
      <div className="overflow-y-auto px-4 lg:px-8 py-4 space-y-3 max-h-[calc(100dvh-280px)]">
        {loading && (
          <div className="flex items-center justify-center pt-10 text-sm text-muted-foreground gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            {t('loading')}
          </div>
        )}

        {loading === false && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-14 pb-4">
            <Bot className="w-10 h-10 mb-3 text-muted-foreground/25" aria-hidden="true" />
            <p className="text-sm text-muted-foreground text-center max-w-xs">{t('chat_empty')}</p>
          </div>
        )}

        {messages.map(msg => (
          <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {sending && <TypingIndicator label={t('chat_typing')} />}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 lg:px-8 py-3">
        {sendError !== null && (
          <p className="text-xs text-destructive mb-2">{sendError}</p>
        )}
        <div className="flex gap-2 items-end max-w-3xl">
          <Textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat_placeholder')}
            rows={2}
            disabled={sending || loading}
            className="resize-none"
            dir="auto"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSend()}
            disabled={!canSend}
            className="gap-1.5 self-end shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {sending ? t('chat_sending') : t('chat_send')}
            </span>
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">{t('chat_enter_hint')}</p>
      </div>
    </div>
  )
}
