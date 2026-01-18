import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

export function SkeletonBlock({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-muted/60", className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/40 p-4 animate-pulse",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-6 w-28" />
        </div>
        <SkeletonBlock className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonListItem({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/40 p-3 animate-pulse",
        className
      )}
    >
      <SkeletonBlock className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-3 w-32" />
        <SkeletonBlock className="h-3 w-48" />
      </div>
      <SkeletonBlock className="h-6 w-12 rounded-full" />
    </div>
  );
}

type SkeletonSectionProps = SkeletonProps & {
  rows?: number;
};

export function SkeletonSection({ rows = 3, className }: SkeletonSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <SkeletonBlock className="h-4 w-28" />
      {Array.from({ length: rows }).map((_, idx) => (
        <SkeletonListItem key={idx} />
      ))}
    </div>
  );
}
