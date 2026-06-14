import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { OfflineBadge } from "@/components/OfflineBadge";
import { MiniPlayer } from "@/components/music/MiniPlayer";
import { GlobalSearch } from "@/features/search/GlobalSearch";
import { useAlarms } from "@/features/calendar/useAlarms";
import { aiMemoryService } from "@/features/ai-memory/aiMemoryService";
import { PageTitleProvider, usePageTitle } from "@/contexts/PageTitleContext";

function DesktopHeader() {
  const { pageTitle } = usePageTitle();
  return (
    <div className="flex items-center justify-between px-6 py-6 border-b border-sidebar-border shrink-0">
      {pageTitle ? (
        <div>
          <h1 className="text-lg font-semibold font-display leading-none">
            {pageTitle.title}
          </h1>
          {pageTitle.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{pageTitle.subtitle}</p>
          )}
        </div>
      ) : (
        <div />
      )}
      <GlobalSearch />
    </div>
  );
}

function AppLayoutInner() {
  useAlarms();

  useEffect(() => {
    if ("Notification" in globalThis && Notification.permission === "default") {
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

      {/* Desktop */}
      <div className="hidden lg:flex">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-auto flex flex-col">
          <DesktopHeader />
          <Outlet />
        </main>
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <div className="flex justify-end px-4 pt-3 pb-1">
          <GlobalSearch />
        </div>
        <main className="flex-1 pb-20 overflow-auto">
          <Outlet />
        </main>
        <MobileNav />
      </div>

      <MiniPlayer />
    </div>
  );
}

export function AppLayout() {
  return (
    <PageTitleProvider>
      <AppLayoutInner />
    </PageTitleProvider>
  );
}
