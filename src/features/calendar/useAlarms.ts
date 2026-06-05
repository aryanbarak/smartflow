import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { alarmService, type Alarm } from './alarmService';

const CHECK_INTERVAL_MS = 60_000;

function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}

function showBrowserNotification(alarm: Alarm) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const body = alarm.remindBeforeMinutes === 0
    ? 'Starting now!'
    : alarm.remindBeforeMinutes < 60
      ? `Starting in ${alarm.remindBeforeMinutes} minutes`
      : `Starting in ${alarm.remindBeforeMinutes / 60} hour(s)`;

  const n = new Notification(`⏰ ${alarm.sourceTitle}`, {
    body,
    icon: '/favicon.ico',
    tag: alarm.id,
    requireInteraction: true,
  });

  n.onclick = () => { window.focus(); n.close(); };
}

export function useAlarms() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const firedRef = useRef<Set<string>>(new Set());

  const checkAndFire = useCallback(async () => {
    try {
      const now = new Date();
      const pending = await alarmService.getPending();

      for (const alarm of pending) {
        if (firedRef.current.has(alarm.id)) continue;
        if (new Date(alarm.triggerAt) <= now) {
          firedRef.current.add(alarm.id);
          void alarmService.markFired(alarm.id);

          const description = alarm.remindBeforeMinutes === 0
            ? 'Starting now!'
            : alarm.remindBeforeMinutes < 60
              ? `In ${alarm.remindBeforeMinutes} min`
              : `In ${alarm.remindBeforeMinutes / 60}h`;

          toast(`⏰ ${alarm.sourceTitle}`, {
            description,
            duration: 10000,
            action: {
              label: 'Dismiss',
              onClick: () => void alarmService.dismiss(alarm.id),
            },
          });

          showBrowserNotification(alarm);
        }
      }
    } catch (err) {
      console.error('[useAlarms] check failed:', err);
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
    void checkAndFire();
    intervalRef.current = setInterval(() => { void checkAndFire(); }, CHECK_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [checkAndFire]);
}
