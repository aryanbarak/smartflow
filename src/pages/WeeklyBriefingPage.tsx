import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import briefingBg from '@/assets/briefing-bg.jpg'

interface Briefing {
  id: string
  content: string
  language: string
  created_at: string
}

function MdP({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="mb-2 last:mb-0 text-sm leading-relaxed text-foreground/85">{children}</p>
}
function MdUl({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ul className="list-disc pl-5 mt-2 space-y-1">{children}</ul>
}
function MdLi({ children }: Readonly<{ children: React.ReactNode }>) {
  return <li className="text-sm leading-relaxed text-foreground/85">{children}</li>
}
const MD_COMPONENTS = { p: MdP, ul: MdUl, li: MdLi } as const

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

export default function WeeklyBriefingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBriefing = useCallback(async () => {
    if (!user?.id) return
    const { data, error: err } = await supabase
      .from('agent_briefings')
      .select('id, content, language, created_at')
      .eq('user_id', user.id)
      .eq('mode', 'weekly')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (err) {
      setError('Could not load weekly briefing.')
    } else {
      setBriefing(data ?? null)
    }
  }, [user?.id])

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchBriefing().finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [fetchBriefing])

  const handleGenerate = async () => {
    if (!user?.id) return
    setGenerating(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')
      const workerUrl = import.meta.env.VITE_AGENT_WORKER_URL as string
      const res = await fetch(`${workerUrl}/generate?mode=weekly`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error('Worker error')
      await new Promise(r => setTimeout(r, 1500))
      await fetchBriefing()
    } catch {
      setError('Failed to generate weekly briefing.')
    } finally {
      setGenerating(false)
    }
  }

  const md = briefing?.content.replace(/^•\s*/gm, '- ') ?? ''

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 py-5">
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Button>
      </div>

      {/* Card */}
      <div className="glass-card rounded-2xl shadow-elevated relative overflow-hidden">
        <img
          src={briefingBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-15 pointer-events-none select-none"
        />
        <div className="relative p-5 sm:p-7">
          {/* Title */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-sm" aria-hidden="true">✦</span>
            <h1 className="text-lg font-semibold">Weekly Briefing</h1>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : briefing ? (
            <div>
              <ReactMarkdown components={MD_COMPONENTS}>{md}</ReactMarkdown>
              <p className="text-[11px] text-muted-foreground mt-4">
                Generated {formatTimeAgo(new Date(briefing.created_at))}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 gap-1.5"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'Generating…' : 'Regenerate'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No weekly briefing yet. Weekly briefings summarize your tasks, habits,
                finances, and calendar for the entire week.
              </p>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'Generating…' : 'Generate weekly briefing'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
