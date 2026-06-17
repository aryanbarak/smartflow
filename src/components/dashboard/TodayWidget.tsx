import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonSection } from "@/components/common/Skeletons";
import { useEvents } from "@/hooks/useEvents";
import { isSameDay } from "@/lib/date";

export function TodayWidget() {
  const { events, isLoading } = useEvents();
  const today = useMemo(() => new Date(), []);

  const todayEvents = useMemo(() => {
    const seen = new Set<string>();
    return events
      .filter((event) => isSameDay(new Date(event.dateTimeStart), today))
      .filter((event) => {
        const key = `${event.title}|${event.dateTimeStart}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.dateTimeStart).getTime() -
          new Date(b.dateTimeStart).getTime()
      )
      .slice(0, 5);
  }, [events, today]);

  const isInitialLoading = isLoading && events.length === 0;

  return (
    <Card className="glass-card card-accent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isInitialLoading ? (
          <SkeletonSection rows={2} />
        ) : todayEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">No events today.</p>
        ) : (
          <ul className="space-y-2">
            {todayEvents.map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2"
              >
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.dateTimeStart).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
