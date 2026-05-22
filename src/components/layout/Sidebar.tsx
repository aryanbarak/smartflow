import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Wallet,
  Users,
  FileText,
  Music,
  Globe,
  Settings,
  Brain,
  GraduationCap,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/features/profile/useProfile";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: CheckSquare, label: "Tasks", path: "/tasks" },
  { icon: Wallet, label: "Finance", path: "/finance" },
  { icon: Users, label: "Family", path: "/family" },
  { icon: FileText, label: "Documents", path: "/documents" },
  { icon: Music, label: "Music", path: "/music" },
  { icon: Globe, label: "Web Links", path: "/links" },
  { icon: Brain, label: "Learn with AI", path: "/learn-ai" },
  { icon: GraduationCap, label: "Tutor Bank", path: "/tutor" },
  { icon: Bot, label: "Tutor App", path: "/tutor/app" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();

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
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src="/dailyflow-icon.svg" alt="dailyFlow" className="w-10 h-10" />
          <div>
            <h1 className="text-lg leading-none">
              <span className="font-light text-sidebar-foreground">daily</span>
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
              <span className="text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

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
