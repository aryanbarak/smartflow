import { cn } from "@/lib/utils";
import { Child, MemberRole } from "@/features/family/familyService";

const ROLE_CONFIG: Record<MemberRole, { emoji: string; label: string }> = {
  child:  { emoji: "👶", label: "Kind" },
  teen:   { emoji: "🧑", label: "Jugendlicher" },
  adult:  { emoji: "👨", label: "Erwachsen" },
  parent: { emoji: "👪", label: "Elternteil" },
};

const ROLE_OPTIONS: MemberRole[] = ["child", "teen", "adult", "parent"];

interface Props {
  readonly children: Child[];
  readonly selectedId: string | null;
  readonly completionMap: Record<string, { done: number; total: number }>;
  readonly onSelect: (id: string) => void;
  readonly onRoleChange?: (id: string, role: MemberRole) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function CompletionBadge({ done, total }: Readonly<{ done: number; total: number }>) {
  if (total === 0) return null;
  const allDone = done === total;
  return (
    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", allDone ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400")}>
      {done}/{total} ✅
    </span>
  );
}

export function ChildSelector({ children, selectedId, completionMap, onSelect, onRoleChange }: Props) {
  if (children.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No family members added yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {children.map((child) => {
        const isSelected = child.id === selectedId;
        const comp = completionMap[child.id] ?? { done: 0, total: 0 };
        const initials = child.initials || getInitials(child.name);
        const roleInfo = ROLE_CONFIG[child.role] ?? ROLE_CONFIG.child;

        return (
          <div
            key={child.id}
            className={cn(
              "rounded-xl border transition-all",
              isSelected ? "border-cyan-500/50 bg-cyan-500/10" : "border-slate-700"
            )}
          >
            <div className="flex items-center gap-2 px-3 py-3">
              {/* Native button: avatar + name area — clicking selects this member */}
              <button
                type="button"
                onClick={() => onSelect(child.id)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-90 transition-opacity"
              >
                {/* Avatar — uses Tailwind color class stored in child.color */}
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0", child.color)}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{child.name}</p>
                  <p className="text-xs text-slate-500">
                    {child.age == null ? "" : `Age ${child.age} · `}
                    {roleInfo.emoji} {roleInfo.label}
                  </p>
                </div>
              </button>

              {/* Right side: completion badge + role selector (native elements, no nesting) */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <CompletionBadge done={comp.done} total={comp.total} />
                <select
                  title="Change role"
                  value={child.role}
                  onChange={(e) => onRoleChange?.(child.id, e.target.value as MemberRole)}
                  className="text-xs bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-slate-300 cursor-pointer hover:bg-slate-600 transition-colors"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{ROLE_CONFIG[r].emoji} {ROLE_CONFIG[r].label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
