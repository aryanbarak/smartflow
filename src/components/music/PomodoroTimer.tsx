import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMusicPlayer, PRESETS } from "@/hooks/useMusicPlayer";
import { usePomodoroStore } from "@/features/music/pomodoroStore";
import { useTasks } from "@/hooks/useTasks";

type Phase = "focus" | "break" | "long-break";

const PHASE_DURATIONS: Record<Phase, number> = {
  focus: 25 * 60,
  break: 5 * 60,
  "long-break": 15 * 60,
};

const PHASE_LABELS: Record<Phase, string> = {
  focus: "Focus",
  break: "Break",
  "long-break": "Long Break",
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function requestNotification(title: string, body: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  } else if (Notification.permission === "default") {
    void Notification.requestPermission().then((perm) => {
      if (perm === "granted") new Notification(title, { body });
    });
  }
}

// Rain preset used for break suggestion — located by label so it survives videoId changes
const RAIN_PRESET = PRESETS.find((p) => p.label === "Rain") ?? PRESETS[1];

const PHASE_COLORS = {
  focus: { text: "text-cyan-400", stroke: "#22D3EE" },
  break: { text: "text-emerald-400", stroke: "#34D399" },
  "long-break": { text: "text-violet-400", stroke: "#A78BFA" },
} satisfies Record<Phase, { text: string; stroke: string }>;

export function PomodoroTimer() {
  const [phase, setPhase] = useState<Phase>("focus");
  const [secondsLeft, setSecondsLeft] = useState(PHASE_DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { playYouTube, currentTrack } = useMusicPlayer();
  const { linkedTaskId, linkedTaskTitle, setLinkedTask } = usePomodoroStore();
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const { tasks } = useTasks();
  const openTasks = tasks.filter(t => !t.completed);

  const total = PHASE_DURATIONS[phase];
  const strokeDashoffset = CIRCUMFERENCE * (1 - secondsLeft / total);

  const switchPhase = useCallback(
    (next: Phase) => {
      setPhase(next);
      setSecondsLeft(PHASE_DURATIONS[next]);
      setRunning(false);
      if (next === "focus") {
        requestNotification("Focus time! 🔥", "Let's get back to work.");
      } else {
        requestNotification("Time for a break! 🎉", "Great work — take a moment to recharge.");
        const alreadyPlayingRain =
          currentTrack?.type === "youtube" && currentTrack.videoId === RAIN_PRESET.videoId;
        if (!alreadyPlayingRain) playYouTube(RAIN_PRESET.videoId, RAIN_PRESET.title);
      }
    },
    [currentTrack, playYouTube],
  );

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          const next: Phase = phase === "focus" ? "break" : "focus";
          switchPhase(next);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, switchPhase]);

  const handleReset = () => {
    setRunning(false);
    setSecondsLeft(PHASE_DURATIONS[phase]);
  };

  const { text: phaseText, stroke: phaseStroke } = PHASE_COLORS[phase];

  return (
    <Card className="border-cyan-400/10">
      <CardContent className="flex flex-col items-center gap-4 pt-4">
        {/* Phase selector */}
        <div className="flex gap-1 rounded-lg bg-slate-800/60 p-1 w-full">
          {(["focus", "break", "long-break"] as Phase[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPhase(p);
                setSecondsLeft(PHASE_DURATIONS[p]);
                setRunning(false);
              }}
              className={cn(
                "flex-1 rounded-md py-1 text-xs font-medium transition-colors",
                phase === p ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200",
              )}
            >
              {PHASE_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Countdown circle */}
        <div className="relative flex items-center justify-center">
          <svg width="130" height="130" className="-rotate-90" aria-hidden="true">
            <circle
              cx="65" cy="65" r={RADIUS}
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"
            />
            <circle
              cx="65" cy="65" r={RADIUS}
              fill="none"
              stroke={phaseStroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute text-center" aria-live="polite">
            <p className={cn("text-2xl font-mono font-bold", phaseText)}>
              {formatTime(secondsLeft)}
            </p>
            <p className="text-xs text-slate-400">{PHASE_LABELS[phase]}</p>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-400 hover:text-white"
            onClick={handleReset}
            aria-label="Reset timer"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-11 w-11 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/30"
            onClick={() => setRunning((v) => !v)}
            aria-label={running ? "Pause timer" : "Start timer"}
          >
            {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", linkedTaskId ? "text-cyan-400" : "text-slate-400 hover:text-white")}
            onClick={() => setShowTaskPicker((v) => !v)}
            title={linkedTaskId ? `Linked: ${linkedTaskTitle}` : "Link a task"}
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>

        {/* Task picker */}
        {showTaskPicker && (
          <div className="w-full space-y-1">
            <p className="text-xs text-slate-400 text-center">Link task to this session</p>
            <select
              aria-label="Link task to pomodoro session"
              className="w-full rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 focus:outline-none"
              value={linkedTaskId ?? ''}
              onChange={e => {
                const task = openTasks.find(t => t.id === e.target.value);
                setLinkedTask(task?.id ?? null, task?.title ?? null);
                setShowTaskPicker(false);
              }}
            >
              <option value="">— بدون وظیفه —</option>
              {openTasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            {linkedTaskTitle && (
              <p className="text-xs text-cyan-400 text-center truncate">✓ {linkedTaskTitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
