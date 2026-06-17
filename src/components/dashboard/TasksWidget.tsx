import { useMemo } from "react";
import { CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatePanel } from "@/components/common/StatePanel";
import { SkeletonBlock, SkeletonListItem } from "@/components/common/Skeletons";
import { useTasks } from "@/hooks/useTasks";
import { formatDateLabel, isBeforeDay, isSameDay } from "@/lib/date";

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function TasksWidget() {
  const { tasks, isLoading, error } = useTasks();
  const today = useMemo(() => new Date(), []);

  const incompleteCount = useMemo(
    () => tasks.filter((t) => !t.completed).length,
    [tasks]
  );

  const dueSoonTasks = useMemo(() => {
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + 7);
    return tasks
      .filter((task) => !task.completed && task.dueDate)
      .map((task) => ({ task, due: parseDateOnly(task.dueDate!) }))
      .filter(({ due }) => !isBeforeDay(due, today) && due <= windowEnd)
      .sort((a, b) => a.due.getTime() - b.due.getTime())
      .slice(0, 5);
  }, [tasks, today]);

  const isInitialLoading = isLoading && tasks.length === 0;

  return (
    <Card className="glass-card card-accent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-primary" />
          Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error && !isInitialLoading ? (
          <StatePanel
            variant="error"
            title="Tasks unavailable"
            description={error}
          />
        ) : isInitialLoading ? (
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonListItem />
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {incompleteCount} open task(s)
            </p>
            {dueSoonTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tasks due.</p>
            ) : (
              <ul className="space-y-2">
                {dueSoonTasks.map(({ task, due }) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2"
                  >
                    <span className="text-sm font-medium truncate">
                      {task.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isSameDay(due, today)
                        ? "Today"
                        : formatDateLabel(task.dueDate!)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
