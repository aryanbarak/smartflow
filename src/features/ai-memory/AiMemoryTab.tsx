import { useState } from 'react';
import {
  Brain, RefreshCw, Trash2, Save,
  User, TrendingUp, Heart, DollarSign, BookOpen,
  Loader2, Info, Zap,
} from 'lucide-react';
import { useAiMemory } from './useAiMemory';
import { MEMORY_KEYS } from './aiMemoryService';
import { cn } from '@/lib/utils';

const KEY_ICONS: Record<string, React.ReactNode> = {
  goal_primary:    <Zap className="w-3.5 h-3.5 text-cyan-400" />,
  goal_secondary:  <Zap className="w-3.5 h-3.5 text-purple-400" />,
  work_status:     <User className="w-3.5 h-3.5 text-blue-400" />,
  mood_pattern:    <Heart className="w-3.5 h-3.5 text-pink-400" />,
  habit_pattern:   <TrendingUp className="w-3.5 h-3.5 text-green-400" />,
  finance_pattern: <DollarSign className="w-3.5 h-3.5 text-yellow-400" />,
  family_note:     <User className="w-3.5 h-3.5 text-orange-400" />,
  health_note:     <Heart className="w-3.5 h-3.5 text-red-400" />,
  learning_note:   <BookOpen className="w-3.5 h-3.5 text-indigo-400" />,
  custom_1:        <Brain className="w-3.5 h-3.5 text-slate-400" />,
  custom_2:        <Brain className="w-3.5 h-3.5 text-slate-400" />,
  custom_3:        <Brain className="w-3.5 h-3.5 text-slate-400" />,
};

const AUTO_KEYS = ['mood_pattern', 'habit_pattern', 'finance_pattern'];

export function AiMemoryTab() {
  const { entries, isLoading, isAutoDetecting, set, remove, autoDetect, getValue, getSource } = useAiMemory();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleSave = async (key: string) => {
    const value = key in drafts ? drafts[key] : getValue(key);
    setSaving(prev => ({ ...prev, [key]: true }));
    if (value.trim()) {
      await set(key, value.trim());
    } else {
      await remove(key);
    }
    setSaving(prev => ({ ...prev, [key]: false }));
    setDrafts(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const isDirty = (key: string) => key in drafts && drafts[key] !== getValue(key);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groups = [
    {
      title: 'Goals & Status',
      keys: ['goal_primary', 'goal_secondary', 'work_status'],
      badge: null,
    },
    {
      title: 'Auto-detected Patterns',
      keys: AUTO_KEYS,
      badge: <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 normal-case font-normal">Updated automatically</span>,
    },
    {
      title: 'Personal Notes',
      keys: ['family_note', 'health_note', 'learning_note'],
      badge: null,
    },
    {
      title: 'Custom Notes',
      keys: ['custom_1', 'custom_2', 'custom_3'],
      badge: null,
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            AI Memory
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Facts about you that AI uses to personalize Weekly Briefing and responses.
          </p>
        </div>
        <button
          onClick={() => void autoDetect()}
          disabled={isAutoDetecting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all whitespace-nowrap disabled:opacity-50"
        >
          {isAutoDetecting
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting…</>
            : <><RefreshCw className="w-3.5 h-3.5" /> Auto-detect</>
          }
        </button>
      </div>

      <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-300">
          This memory is injected into every AI conversation.
          Auto-detected fields update from your data. Manual fields let you tell AI things it can't detect.
        </p>
      </div>

      {groups.map(group => (
        <div key={group.title} className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            {group.title}
            {group.badge}
          </h3>
          {MEMORY_KEYS.filter(k => group.keys.includes(k.key)).map(({ key, label, placeholder }) => (
            <MemoryRow
              key={key}
              label={label}
              placeholder={placeholder}
              icon={KEY_ICONS[key]}
              value={key in drafts ? drafts[key] : getValue(key)}
              source={getSource(key)}
              isDirty={isDirty(key)}
              isSaving={saving[key] ?? false}
              isAuto={AUTO_KEYS.includes(key)}
              onChange={v => setDrafts(prev => ({ ...prev, [key]: v }))}
              onSave={() => void handleSave(key)}
              onRemove={() => void remove(key)}
            />
          ))}
        </div>
      ))}

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {entries.filter(e => e.value).length} of {MEMORY_KEYS.length} memory slots used ·{' '}
          {entries.filter(e => e.source === 'auto').length} auto-detected ·{' '}
          {entries.filter(e => e.source === 'manual').length} manual
        </p>
      </div>
    </div>
  );
}

interface MemoryRowProps {
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  source: string | null;
  isDirty: boolean;
  isSaving: boolean;
  isAuto: boolean;
  onChange: (v: string) => void;
  onSave: () => void;
  onRemove: () => void;
}

function MemoryRow({
  label, placeholder, icon, value, source,
  isDirty, isSaving, isAuto, onChange, onSave, onRemove,
}: Readonly<MemoryRowProps>) {
  return (
    <div className={cn(
      'p-3 rounded-lg border transition-colors',
      isDirty ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-border bg-card/50',
    )}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
        {source === 'auto' && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 ml-auto">Auto</span>
        )}
        {source === 'manual' && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 ml-auto">Manual</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => { if (e.key === 'Enter' && isDirty) onSave(); }}
          className={cn(
            'flex-1 text-xs bg-background border border-border rounded px-2 py-1.5',
            'focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50',
            isAuto && !isDirty && 'text-muted-foreground italic',
          )}
        />
        {isDirty && (
          <button onClick={onSave} disabled={isSaving} title="Save"
            className="p-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          </button>
        )}
        {value && !isDirty && (
          <button onClick={onRemove} title="Clear"
            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
