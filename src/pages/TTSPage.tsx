import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAzureTTS, type TtsLang } from "@/hooks/useAzureTTS";

// ─── Voice picker (Web Speech fallback) ──────────────────────────────────────

function pickBestVoice(lang: TtsLang): SpeechSynthesisVoice | null {
  const all = globalThis.speechSynthesis?.getVoices() ?? [];
  const de = [/Microsoft Katja/i, /Microsoft Conrad/i, /Google Deutsch/i, /Anna/i];
  const fa = [/Microsoft Parvaz/i, /Google.*fa/i];
  const patterns = lang === "de" ? de : fa;
  const filtered = all.filter((v) => v.lang.startsWith(lang));
  for (const p of patterns) {
    const match = filtered.find((v) => p.test(v.name));
    if (match) return match;
  }
  return filtered.find((v) => v.localService) ?? filtered[0] ?? null;
}

// ─── Lang config ─────────────────────────────────────────────────────────────

function getEngineLabel(engine: string | undefined): string | null {
  if (engine === "azure") return "Azure Neural TTS";
  if (engine === "webspeech") return "Web Speech API";
  return null;
}

const LANG_CONFIG: Record<TtsLang, { label: string; flag: string; dir: "ltr" | "rtl"; placeholder: string }> = {
  de: { label: "Deutsch", flag: "🇩🇪", dir: "ltr", placeholder: "Deutschen Text hier eingeben…" },
  fa: { label: "فارسی",  flag: "🇮🇷", dir: "rtl", placeholder: "متن فارسی را اینجا بنویسید…" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TTSPage() {
  const [lang, setLang] = useState<TtsLang>("de");
  const [text, setText] = useState("");
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");

  const { isPlaying, progress, play, stop } = useAzureTTS();

  const supported = globalThis.window !== undefined && "speechSynthesis" in globalThis;
  const cfg = LANG_CONFIG[lang];

  // Reload voices when lang changes
  useEffect(() => {
    const load = () => {
      const filtered = (globalThis.speechSynthesis?.getVoices() ?? [])
        .filter((v) => v.lang.startsWith(lang));
      setVoices(filtered);
      const best = pickBestVoice(lang);
      setVoiceName(best?.name ?? filtered[0]?.name ?? "");
    };
    load();
    globalThis.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => { globalThis.speechSynthesis?.removeEventListener("voiceschanged", load); };
  }, [lang]);

  const handlePlay = async () => {
    await play(text, { lang, rate, pitch, webSpeechVoiceName: voiceName });
  };

  const engineLabel = getEngineLabel(progress?.engine);

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Text zu Sprache / متن به گفتار</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Azure Neural TTS (de-DE-KatjaNeural / fa-IR-DilaraNeural) · متن نامحدود با chunking
        </p>
      </div>

      {/* Language selector */}
      <div className="flex gap-3">
        {(Object.entries(LANG_CONFIG) as [TtsLang, typeof cfg][]).map(([key, c]) => (
          <button
            key={key}
            type="button"
            onClick={() => { stop(); setLang(key); }}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
              lang === key
                ? "border-primary bg-primary/10 text-primary"
                : "border-slate-700 bg-slate-900 hover:bg-slate-800 text-muted-foreground",
            )}
          >
            <span className="text-lg">{c.flag}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Textarea — no hard char limit; chunking handles long texts */}
      <div className="space-y-1.5">
        <label htmlFor="tts-text" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Text eingeben / متن
        </label>
        <textarea
          id="tts-text"
          dir={cfg.dir}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={cfg.placeholder}
          rows={10}
          className={cn(
            "w-full rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-base resize-y",
            "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40",
            cfg.dir === "rtl" && "text-right",
          )}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {text.length > 0 && (
              <>
                {text.length.toLocaleString()} Zeichen ·{" "}
                {Math.ceil(text.length / 1500)} Abschnitt{Math.ceil(text.length / 1500) !== 1 ? "e" : ""}
              </>
            )}
          </span>
          {text.length > 0 && (
            <button type="button" onClick={() => setText("")} className="hover:text-slate-200 transition-colors">
              Löschen
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4 rounded-lg border border-slate-700/60 bg-slate-900/40 p-4">
        {/* Web Speech voice (fallback only) */}
        {supported && voices.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="tts-voice" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Fallback-Stimme (Web Speech)
            </label>
            <select
              id="tts-voice"
              title="Stimme für Web Speech Fallback"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Wird nur verwendet, wenn Azure TTS nicht erreichbar ist.</p>
          </div>
        )}

        {/* Rate */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="tts-rate" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Geschwindigkeit / سرعت
            </label>
            <span className="text-xs font-mono text-slate-300">{rate.toFixed(2)}×</span>
          </div>
          <input id="tts-rate" type="range" title="Geschwindigkeit" min={0.5} max={2} step={0.05}
            value={rate} onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-primary" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5×</span><span>1.0×</span><span>2.0×</span>
          </div>
        </div>

        {/* Pitch */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="tts-pitch" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tonhöhe / زیر و بمی
            </label>
            <span className="text-xs font-mono text-slate-300">{pitch.toFixed(1)}</span>
          </div>
          <input id="tts-pitch" type="range" title="Tonhöhe" min={0.5} max={2} step={0.1}
            value={pitch} onChange={(e) => setPitch(Number(e.target.value))}
            className="w-full accent-primary" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>بم / Tief</span><span>Normal</span><span>زیر / Hoch</span>
          </div>
        </div>
      </div>

      {/* Play / Stop */}
      <div className="flex gap-3">
        <Button size="lg" onClick={handlePlay}
          disabled={text.trim().length === 0 || isPlaying}
          className="flex-1 gap-2 text-base">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {lang === "de" ? "Vorlesen" : "پخش"}
        </Button>
        <Button size="lg" variant="outline" onClick={stop} disabled={!isPlaying}
          className="gap-2 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 disabled:opacity-30">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
          {lang === "de" ? "Stopp" : "توقف"}
        </Button>
      </div>

      {/* Progress */}
      {progress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-primary">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <span>
                {lang === "de" ? "Abschnitt" : "بخش"} {progress.current} / {progress.total}
              </span>
            </div>
            <span className="text-xs text-muted-foreground rounded border border-slate-700 px-1.5 py-0.5">
              {engineLabel}
            </span>
          </div>
          <progress
            value={progress.current}
            max={progress.total}
            className="w-full h-1.5 rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary"
          />
        </div>
      )}

      {/* Persian install guide */}
      {lang === "fa" && voices.length === 0 && supported && (
        <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-4 text-sm space-y-2">
          <p className="font-medium text-slate-300">
            صدای فارسی برای Web Speech fallback یافت نشد
          </p>
          <p className="text-muted-foreground text-xs">
            Azure TTS به‌صورت خودکار استفاده می‌شود. اگر Azure در دسترس نباشد:
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
            <li>Windows: تنظیمات → زمان و زبان → گفتار → اضافه کردن صدا → فارسی</li>
            <li>Mac: System Settings → Accessibility → Spoken Content → Manage Voices → Persian</li>
          </ul>
        </div>
      )}
    </div>
  );
}
