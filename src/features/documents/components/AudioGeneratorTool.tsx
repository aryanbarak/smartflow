import { useEffect, useRef, useState } from 'react';
import { Volume2, Download, Loader2, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';

const TTS_URL = (import.meta.env.VITE_AI_AGENT_URL as string | undefined)
  ?.replace('/analyze', '/tts') ?? 'https://api.barakzai.cloud/tts';

const MAX_CHARS = 3000;

// Curated voices that work well with eleven_multilingual_v2
const VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: '♀', style: 'Warm' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',   gender: '♂', style: 'Deep' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella',  gender: '♀', style: 'Soft' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh',   gender: '♂', style: 'Natural' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli',   gender: '♀', style: 'Bright' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: '♂', style: 'Confident' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi',   gender: '♀', style: 'Strong' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: '♂', style: 'Crisp' },
];

export function AudioGeneratorTool() {
  const { t } = useT();
  const [text, setText]           = useState('');
  const [voiceId, setVoiceId]     = useState(VOICES[0].id);
  const [audioUrl, setAudioUrl]   = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Clean up blob URL on unmount or when a new one replaces it
  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);

  const handleGenerate = async () => {
    const trimmed = text.trim();
    if (!trimmed) { toast.error('Please enter some text'); return; }
    if (trimmed.length > MAX_CHARS) { toast.error(`Max ${MAX_CHARS} characters`); return; }

    setIsGenerating(true);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      const res = await fetch(TTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, voiceId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      setAudioUrl(url);
      toast.success(t('audio_ready'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); }
    else           { void audio.play(); }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `audio_${Date.now()}.mp3`;
    a.click();
  };

  const charsLeft = MAX_CHARS - text.length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Text input */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="tts-text">
          متن / Text / Text
        </label>
        <textarea
          id="tts-text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('audio_placeholder')}
          rows={9}
          maxLength={MAX_CHARS}
          dir="auto"
          className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
        />
        <p className={`text-xs text-right ${charsLeft < 200 ? 'text-amber-500' : 'text-muted-foreground'}`}>
          {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} — {t('audio_char_limit')}
        </p>
      </div>

      {/* Voice selector */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">{t('audio_voice')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VOICES.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVoiceId(v.id)}
              className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl border text-xs transition-colors"
              style={{
                background:   voiceId === v.id ? 'hsl(var(--primary))' : 'transparent',
                color:        voiceId === v.id ? 'white' : undefined,
                borderColor:  voiceId === v.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              }}
            >
              <span className="text-base leading-none">{v.gender}</span>
              <span className="font-medium">{v.name}</span>
              <span className="opacity-60 text-[10px]">{v.style}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={isGenerating || !text.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {isGenerating
          ? <><Loader2 size={15} className="animate-spin" /> {t('audio_generating')}</>
          : <><Volume2 size={15} /> {t('audio_generate')}</>
        }
      </button>

      {/* Audio player */}
      {audioUrl && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              title={isPlaying ? 'Pause' : 'Play'}
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
            >
              {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>

            {/* Native audio element (hidden controls — we use our own play button) */}
            <audio
              ref={audioRef}
              src={audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="flex-1 h-8"
              controls
              style={{ accentColor: 'hsl(var(--primary))' }}
            >
              <track kind="captions" />
            </audio>
          </div>

          <button
            type="button"
            title={t('audio_download_mp3')}
            onClick={handleDownload}
            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors w-full justify-center"
          >
            <Download size={14} /> {t('audio_download_mp3')}
          </button>
        </div>
      )}

      {/* Info note */}
      <p className="text-xs text-muted-foreground text-center">
        Powered by ElevenLabs · <span className="font-medium">eleven_multilingual_v2</span> · fa / de / en auto-detected
      </p>
    </div>
  );
}
