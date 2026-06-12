import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Lang = "de" | "fa";

interface LangConfig {
  label: string;
  locale: string;
  dir: "ltr" | "rtl";
  placeholder: string;
  flag: string;
  voiceFilter: (v: SpeechSynthesisVoice) => boolean;
  preferredNames: RegExp[];
}

const LANG_CONFIG: Record<Lang, LangConfig> = {
  de: {
    label: "Deutsch",
    locale: "de-DE",
    dir: "ltr",
    flag: "🇩🇪",
    placeholder: "Deutschen Text hier eingeben…",
    voiceFilter: (v) => v.lang.startsWith("de"),
    preferredNames: [
      /Microsoft Katja/i,
      /Microsoft Conrad/i,
      /Google Deutsch/i,
      /Anna/i,
      /Yannick/i,
    ],
  },
  fa: {
    label: "فارسی",
    locale: "fa-IR",
    dir: "rtl",
    flag: "🇮🇷",
    placeholder: "متن فارسی را اینجا بنویسید…",
    voiceFilter: (v) => v.lang.startsWith("fa"),
    preferredNames: [
      /Microsoft Parvaz/i,
      /Google\s*(فارسی|Persian|Farsi|fa)/i,
    ],
  },
};

function pickBestVoice(lang: Lang): SpeechSynthesisVoice | null {
  const cfg = LANG_CONFIG[lang];
  const voices = globalThis.speechSynthesis.getVoices().filter(cfg.voiceFilter);
  if (voices.length === 0) return null;
  for (const pattern of cfg.preferredNames) {
    const match = voices.find((v) => pattern.test(v.name));
    if (match) return match;
  }
  return voices.find((v) => v.localService) ?? voices[0];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TTSPage() {
  const [lang, setLang] = useState<Lang>("de");
  const [text, setText] = useState("");
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supported = globalThis.window !== undefined && "speechSynthesis" in globalThis;

  // Load / refresh voices when language changes or voices arrive
  useEffect(() => {
    const load = () => {
      const cfg = LANG_CONFIG[lang];
      const filtered = globalThis.speechSynthesis.getVoices().filter(cfg.voiceFilter);
      setVoices(filtered);
      const best = pickBestVoice(lang);
      setSelectedVoiceName(best?.name ?? (filtered[0]?.name ?? ""));
    };
    load();
    globalThis.speechSynthesis.addEventListener("voiceschanged", load);
    return () => { globalThis.speechSynthesis.removeEventListener("voiceschanged", load); };
  }, [lang]);

  // Stop playback when switching language
  useEffect(() => {
    globalThis.speechSynthesis.cancel();
    setIsPlaying(false);
  }, [lang]);

  useEffect(() => () => { globalThis.speechSynthesis.cancel(); }, []);

  const stop = useCallback(() => {
    globalThis.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (!text.trim()) return;
    globalThis.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text.trim());
    utter.lang = LANG_CONFIG[lang].locale;
    utter.rate = rate;
    utter.pitch = pitch;

    const voice = globalThis.speechSynthesis
      .getVoices()
      .find((v) => v.name === selectedVoiceName) ?? pickBestVoice(lang);
    if (voice) utter.voice = voice;

    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);
    utterRef.current = utter;
    setIsPlaying(true);
    globalThis.speechSynthesis.speak(utter);
  }, [text, lang, rate, pitch, selectedVoiceName]);

  const cfg = LANG_CONFIG[lang];
  const charCount = text.length;
  const MAX_CHARS = 3000;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Text zu Sprache / متن به گفتار</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Text-to-Speech — Deutsch & فارسی
        </p>
      </div>

      {/* Language selector */}
      <div className="flex gap-3">
        {(Object.entries(LANG_CONFIG) as [Lang, LangConfig][]).map(([key, c]) => (
          <button
            key={key}
            type="button"
            onClick={() => setLang(key)}
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

      {/* Text area */}
      <div className="space-y-1.5">
        <textarea
          dir={cfg.dir}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder={cfg.placeholder}
          rows={8}
          className={cn(
            "w-full rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-base resize-none",
            "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40",
            cfg.dir === "rtl" && "text-right font-[system-ui]",
          )}
        />
        <div className="flex justify-end">
          <span className={cn("text-xs", charCount > MAX_CHARS * 0.9 ? "text-amber-400" : "text-muted-foreground")}>
            {charCount} / {MAX_CHARS}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4 rounded-lg border border-slate-700/60 bg-slate-900/40 p-4">
        {/* Voice selector */}
        {supported && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Stimme / صدا
            </label>
            {voices.length === 0 ? (
              <p className="text-sm text-amber-400">
                {lang === "de"
                  ? "Keine deutschen Stimmen gefunden. Bitte installieren Sie eine deutsche Systemstimme."
                  : "صدای فارسی یافت نشد. لطفاً یک صدای فارسی در سیستم نصب کنید."}
              </p>
            ) : (
              <select
                value={selectedVoiceName}
                onChange={(e) => setSelectedVoiceName(e.target.value)}
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}  ({v.lang}){v.localService ? "" : " — Online"}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Rate */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Geschwindigkeit / سرعت
            </label>
            <span className="text-xs font-mono text-slate-300">{rate.toFixed(2)}×</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5×</span>
            <span>1.0×</span>
            <span>2.0×</span>
          </div>
        </div>

        {/* Pitch */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tonhöhe / زیر و بمی
            </label>
            <span className="text-xs font-mono text-slate-300">{pitch.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>بم / Tief</span>
            <span>Normal</span>
            <span>زیر / Hoch</span>
          </div>
        </div>
      </div>

      {/* Play / Stop */}
      <div className="flex gap-3">
        <Button
          size="lg"
          disabled={!supported || !text.trim() || voices.length === 0 || isPlaying}
          onClick={play}
          className="flex-1 gap-2 text-base"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {lang === "de" ? "Vorlesen" : "پخش"}
        </Button>

        <Button
          size="lg"
          variant="outline"
          disabled={!isPlaying}
          onClick={stop}
          className="gap-2 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 disabled:opacity-30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
          {lang === "de" ? "Stopp" : "توقف"}
        </Button>
      </div>

      {/* Status bar */}
      {isPlaying && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          {lang === "de" ? "Wird vorgelesen…" : "در حال پخش…"}
        </div>
      )}

      {/* Info box */}
      {!supported && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Ihr Browser unterstützt keine Text-to-Speech-Funktion. / مرورگر شما از قابلیت تبدیل متن به گفتار پشتیبانی نمی‌کند.
        </div>
      )}

      {/* Persian voice tip */}
      {supported && lang === "fa" && voices.length === 0 && (
        <div className="rounded-md border border-slate-700/60 bg-slate-900/40 p-4 text-sm space-y-2">
          <p className="font-medium text-slate-300">چطور صدای فارسی اضافه کنیم؟</p>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
            <li>Windows: تنظیمات → زمان و زبان → گفتار → اضافه کردن صدا → فارسی</li>
            <li>Mac: System Settings → Accessibility → Spoken Content → Manage Voices → Persian</li>
            <li>Android Chrome: به‌طور خودکار از Google TTS استفاده می‌کند</li>
          </ul>
        </div>
      )}
    </div>
  );
}
