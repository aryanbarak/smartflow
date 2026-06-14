import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// =============================================
// Types
// =============================================
interface Briefing {
  id: string
  content: string
  language: string
  created_at: string
  triggered_by: string
}

// =============================================
// AgentBriefingCard
// داشبورد — فضای خالی بالای "Good evening"
// =============================================
export function AgentBriefingCard() {
  const { user } = useAuth()
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // آخرین briefing رو از Supabase بگیر
  const fetchLatestBriefing = useCallback(async () => {
    if (!user?.id) return

    const { data, error: err } = await supabase
      .from('agent_briefings')
      .select('id, content, language, created_at, triggered_by')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (err && err.code !== 'PGRST116') {
      setError('Could not load briefing.')
    } else {
      setBriefing(data || null)
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchLatestBriefing()
  }, [fetchLatestBriefing])

  // On-demand — از Worker جدید بساز
  const handleRefresh = async () => {
    if (!user?.id) return
    setRefreshing(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const workerUrl = import.meta.env.VITE_AGENT_WORKER_URL as string
      const res = await fetch(
        `${workerUrl}/generate?user_id=${user.id}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      )

      if (!res.ok) throw new Error('Worker error')

      // یه ثانیه صبر کن تا Supabase آپدیت بشه
      await new Promise(r => setTimeout(r, 1000))
      await fetchLatestBriefing()
    } catch {
      setError('Failed to generate briefing. Try again.')
    } finally {
      setRefreshing(false)
    }
  }

  // چک کن briefing امروزه یا قدیمی
  const isToday = briefing
    ? new Date(briefing.created_at).toDateString() === new Date().toDateString()
    : false

  const timeAgo = briefing
    ? formatTimeAgo(new Date(briefing.created_at))
    : null

  // =============================================
  // Render
  // =============================================
  if (loading) {
    return (
      <div className="agent-briefing-card agent-briefing-card--loading">
        <div className="agent-briefing-card__shimmer" />
      </div>
    )
  }

  return (
    <div className={`agent-briefing-card ${!isToday && briefing ? 'agent-briefing-card--stale' : ''}`}>
      {/* Header */}
      <div className="agent-briefing-card__header">
        <div className="agent-briefing-card__title">
          <span className="agent-briefing-card__icon" aria-hidden="true">✦</span>
          <span>Daily Briefing</span>
          {briefing && (
            <span className="agent-briefing-card__badge">
              {isToday ? 'Today' : 'Yesterday'}
            </span>
          )}
        </div>
        <button
          className="agent-briefing-card__refresh"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Generate new briefing"
          aria-label="Refresh briefing"
        >
          <span className={refreshing ? 'spinning' : ''}>↻</span>
        </button>
      </div>

      {/* Content */}
      <div className="agent-briefing-card__content">
        {error ? (
          <p className="agent-briefing-card__error">{error}</p>
        ) : briefing ? (
          <>
            <p className="agent-briefing-card__text">{briefing.content}</p>
            {timeAgo && (
              <span className="agent-briefing-card__time">{timeAgo}</span>
            )}
          </>
        ) : (
          <div className="agent-briefing-card__empty">
            <p>No briefing yet for today.</p>
            <button
              className="agent-briefing-card__generate-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Generating…' : 'Generate my briefing'}
            </button>
          </div>
        )}
      </div>

      {/* زبان نشانگر */}
      {briefing && (
        <div className="agent-briefing-card__footer">
          <span className="agent-briefing-card__lang">
            {briefing.language === 'fa' ? '🇮🇷 فارسی'
              : briefing.language === 'de' ? '🇩🇪 Deutsch'
              : '🇬🇧 English'}
          </span>
        </div>
      )}
    </div>
  )
}

// =============================================
// Helper
// =============================================
function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}
