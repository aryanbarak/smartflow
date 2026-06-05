import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { OfflineBadge } from "@/components/OfflineBadge";
import { MiniPlayer } from "@/components/music/MiniPlayer";
import { GlobalSearch } from "@/features/search/GlobalSearch";
import { useAlarms } from "@/features/calendar/useAlarms";
import { aiMemoryService } from "@/features/ai-memory/aiMemoryService";

export function AppLayout() {
  useAlarms();

  useEffect(() => {
    if ('Notification' in globalThis && Notification.permission === 'default') {
      const timer = setTimeout(() => { void Notification.requestPermission(); }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      aiMemoryService.autoDetectAndSave().catch(console.error);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <OfflineBadge />
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-auto">
          {/* Desktop search bar */}
          <div className="flex justify-end px-6 pt-4">
            <GlobalSearch />
          </div>
          <Outlet />
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Mobile search bar */}
        <div className="flex justify-end px-4 pt-3 pb-1">
          <GlobalSearch />
        </div>
        <main className="flex-1 pb-20 overflow-auto">
          <Outlet />
        </main>
        <MobileNav />
      </div>

      {/* Global persistent mini player (fixed bottom bar) */}
      <MiniPlayer />
    </div>
  );
}
