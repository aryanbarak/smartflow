export const notificationService = {
  isSupported(): boolean {
    return 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  showNow(title: string, body: string): void {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    new Notification(title, {
      body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
    });
  },

  scheduleOnce(title: string, body: string, delayMs: number): ReturnType<typeof setTimeout> | null {
    if (!this.isSupported() || Notification.permission !== 'granted') return null;
    return setTimeout(() => this.showNow(title, body), delayMs);
  },

  scheduleDailyReminder(hour = 9, minute = 0): void {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    setTimeout(() => {
      this.showNow('🔥 یادآور عادت‌ها', 'وقتشه عادت‌های امروزت رو ثبت کنی!');
      // reschedule for next day
      this.scheduleDailyReminder(hour, minute);
    }, delay);
  },
};
