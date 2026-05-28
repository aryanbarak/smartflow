import { useState } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Smile } from 'lucide-react';
import { useTodayMood, useMoodHistory, useLogMood } from './useMood';
import { MOOD_CONFIG, type MoodScore } from './types';
import { useT } from '@/i18n';

const SCORES: MoodScore[] = [1, 2, 3, 4, 5];

function MoodTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  const score = payload[0].value as MoodScore;
  const cfg = MOOD_CONFIG[score];
  if (!cfg) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-2 py-1 text-xs">
      {cfg.emoji} {cfg.label}
    </div>
  );
}

export function MoodWidget() {
  const { data: today } = useTodayMood();
  const { data: history = [] } = useMoodHistory();
  const { mutate: logMood, isPending } = useLogMood();
  const [hovered, setHovered] = useState<MoodScore | null>(null);
  const { t } = useT();

  const chartData = history.map(log => ({
    date: log.date.slice(5),
    mood: log.mood,
  }));

  const currentScore = today?.mood as MoodScore | undefined;
  const displayScore = hovered ?? currentScore;
  const displayCfg = displayScore ? MOOD_CONFIG[displayScore] : null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Smile size={16} className="text-primary" />
          {t('mood_title')}
        </h3>
        {displayCfg && (
          <span className="text-xs text-muted-foreground">
            {displayCfg.emoji} {displayCfg.label}
          </span>
        )}
      </div>

      <div className="flex justify-between gap-1">
        {SCORES.map(score => {
          const cfg = MOOD_CONFIG[score];
          const isSelected = currentScore === score;
          return (
            <button
              key={score}
              type="button"
              aria-label={`${t('mood_how_feeling')} ${cfg.label}`}
              disabled={isPending}
              onClick={() => logMood({ mood: score })}
              onMouseEnter={() => setHovered(score)}
              onMouseLeave={() => setHovered(null)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all text-lg
                ${isSelected ? 'bg-primary/10 ring-1 ring-primary scale-105' : 'hover:bg-muted'}`}
            >
              <span>{cfg.emoji}</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {chartData.length > 1 && (
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<MoodTooltip />} />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#moodGrad)"
                dot={false}
                domain={[1, 5]}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartData.length === 0 && !today && (
        <p className="text-xs text-muted-foreground text-center py-2">
          {t('mood_how_feeling')}
        </p>
      )}
    </div>
  );
}
