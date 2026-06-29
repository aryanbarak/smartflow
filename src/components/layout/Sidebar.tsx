import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Wallet,
  Users,
  FileText,
  Music,
  Image,
  Settings,
  Bot,
  Flame,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/features/search/GlobalSearch";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/features/profile/useProfile";
import { SmartFlowIcon } from "@/components/SmartFlowLogo";
import { useT } from "@/i18n";
import type { TranslationKey } from "@/i18n";

const navItems: { icon: React.ElementType; key: TranslationKey; path: string }[] = [
  { icon: LayoutDashboard, key: 'nav_dashboard', path: "/" },
  { icon: MessageSquare, key: 'nav_chat', path: "/chat" },
  { icon: Bot, key: 'nav_tutor_app', path: "/tutor/app" },
  { icon: CheckSquare, key: 'nav_tasks', path: "/tasks" },
  { icon: Calendar, key: 'nav_calendar', path: "/calendar" },
  { icon: Flame, key: 'nav_habits', path: "/habits" },
  { icon: BookOpen, key: 'nav_journal', path: "/journal" },
  { icon: Wallet, key: 'nav_finance', path: "/finance" },
  { icon: Users, key: 'nav_family', path: "/family" },
  { icon: FileText, key: 'nav_documents', path: "/documents" },
  { icon: Image, key: 'nav_photos', path: "/photos" },
  { icon: Music, key: 'nav_music', path: "/music" },
  { icon: Settings, key: 'nav_settings', path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { t } = useT();

  const displayName = profile?.displayName?.trim()
    || user?.email?.split("@")[0]
    || "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  return (
    <aside className="w-64 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <SmartFlowIcon size={36} />
          <div>
            <h1 className="text-lg leading-none">
              <span className="font-light text-sidebar-foreground">Smart</span>
              <span className="font-semibold text-sidebar-foreground">Flow</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Intelligent productivity</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "nav-link",
                isActive && "nav-link-active"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{t(item.key)}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Search */}
      <div className="px-3 py-2 border-t border-white/5">
        <GlobalSearch />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">Personal</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
