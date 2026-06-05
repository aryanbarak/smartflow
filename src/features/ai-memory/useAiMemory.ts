import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { aiMemoryService, type MemoryEntry } from './aiMemoryService';

export function useAiMemory() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  const load = useCallback(async () => {
    try {
      setEntries(await aiMemoryService.getAll());
    } catch {
      toast.error('Failed to load AI memory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const set = async (key: string, value: string) => {
    try {
      await aiMemoryService.set(key, value, 'manual');
      await load();
      toast.success('Memory saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const remove = async (key: string) => {
    try {
      await aiMemoryService.delete(key);
      setEntries(prev => prev.filter(e => e.key !== key));
      toast.success('Memory cleared');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const autoDetect = async () => {
    setIsAutoDetecting(true);
    try {
      await aiMemoryService.autoDetectAndSave();
      await load();
      toast.success('Auto-detected patterns updated');
    } catch {
      toast.error('Auto-detection failed');
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const getValue = (key: string) => entries.find(e => e.key === key)?.value ?? '';
  const getSource = (key: string) => entries.find(e => e.key === key)?.source ?? null;

  return { entries, isLoading, isAutoDetecting, set, remove, autoDetect, getValue, getSource };
}
