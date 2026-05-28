import { useState, useCallback } from 'react';
import { notificationService } from '@/lib/notifications';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    notificationService.getPermission()
  );

  const request = useCallback(async (): Promise<boolean> => {
    const granted = await notificationService.requestPermission();
    const newPerm = notificationService.getPermission();
    setPermission(newPerm);
    if (granted) {
      notificationService.scheduleDailyReminder(9, 0);
    }
    return granted;
  }, []);

  return {
    permission,
    isSupported: notificationService.isSupported(),
    isGranted: permission === 'granted',
    request,
  };
}
