import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { getHabitMoodCorrelation, type CorrelationSummary } from '../habitMoodService';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function MoodCorrelationWidget() {
  const { user } = useAuth();
  const [data, setData] = useState<CorrelationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getHabitMoodCorrelation(user.id, 14)
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) return null;

  const chartData = data.days
    .filter(d => d.mood !== null || d.habitsCompleted > 0)
    .map(d => ({
      date: new Date(d.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric' }),
      mood: d.mood ?? 0,
      habits: Math.round(d.completionRate * 100),
      hasMood: d.mood !== null,
    }));

  const correlationIcon = data.correlation === 'positive'
    ? <TrendingUp className="w-4 h-4 text-green-400" />
    : data.correlation === 'negative'
    ? <TrendingDown className="w-4 h-4 text-red-400" />
    : <Minus className="w-4 h-4 text-muted-foreground" />;

  const correlationLabel = data.correlation === 'positive' ? 'Positive ↑'
    : data.correlation === 'negative' ? 'Negative ↓'
    : data.correlation === 'neutral' ? 'Neutral'
    : 'Collecting data…';

  const correlationColor = data.correlation === 'positive' ? 'text-green-400'
    : data.correlation === 'negative' ? 'text-red-400'
    : 'text-muted-foreground';

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          {correlationIcon}
          Habits &amp; Mood Correlation
        </h3>
        <span className={cn('text-xs', correlationColor)}>{correlationLabel}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">This week mood</p>
          <p className="text-xl font-semibold mt-0.5">
            {data.thisWeekAvgMood > 0 ? `${data.thisWeekAvgMood.toFixed(1)}/5` : '—'}
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">This week habits</p>
          <p className="text-xl font-semibold mt-0.5">{Math.round(data.thisWeekCompletionRate * 100)}%</p>
        </div>
      </div>

      {chartData.length >= 3 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Mood last 14 days</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 5]} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                formatter={(v: number, name: string) => [name === 'mood' ? `${v}/5` : `${v}%`, name === 'mood' ? 'Mood' : 'Habits']}
              />
              <Bar dataKey="mood" name="mood" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={
                    !entry.hasMood ? '#334155'
                    : entry.mood >= 4 ? '#10b981'
                    : entry.mood >= 3 ? '#f59e0b'
                    : '#ef4444'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.correlation !== 'insufficient_data' && data.avgMoodHighHabit > 0 && data.avgMoodLowHabit > 0 && (
        <div className="flex items-center gap-3 text-xs">
          <div className="flex-1 text-center p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-muted-foreground">High habit days</p>
            <p className="font-semibold text-green-400 mt-0.5">{data.avgMoodHighHabit.toFixed(1)}/5 mood</p>
          </div>
          <div className="text-muted-foreground">vs</div>
          <div className="flex-1 text-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <p className="text-muted-foreground">Low habit days</p>
            <p className="font-semibold text-red-400 mt-0.5">{data.avgMoodLowHabit.toFixed(1)}/5 mood</p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground italic">{data.message}</p>
    </div>
  );
}
