import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Wallet,
  Menu,
  Users,
  FileText,
  Music,
  Image,
  Globe,
  Settings,
  Brain,
  GraduationCap,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DailyFlowLogo } from "@/components/DailyFlowLogo";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: CheckSquare, label: "Tasks", path: "/tasks" },
  { icon: Wallet, label: "Finance", path: "/finance" },
];

const moreNavItems = [
  { icon: Users, label: "Family", path: "/family" },
  { icon: FileText, label: "Documents", path: "/documents" },
  { icon: Image, label: "Photos", path: "/photos" },
  { icon: Music, label: "Music", path: "/music" },
  { icon: Globe, label: "Web Links", path: "/links" },
  { icon: Brain, label: "Learn with AI", path: "/learn-ai" },
  { icon: GraduationCap, label: "Tutor Bank", path: "/tutor" },
  { icon: Bot, label: "Tutor App", path: "/tutor/app" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          );
        })}
        
        <Sheet>
          <SheetTrigger asChild>
            <button type="button" className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground">
              <Menu className="w-5 h-5" />
              <span className="text-xs">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-2xl">
            <div className="py-4">
              <div className="mb-6 px-2">
                <DailyFlowLogo size={36} />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {moreNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="text-xs">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
