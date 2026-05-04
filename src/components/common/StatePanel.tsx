import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";

export type StateVariant = "loading" | "error" | "empty";

export type StatePanelProps = {
  variant: StateVariant;
  title: string;
  description?: unknown;
  actionLabel?: string;
  onAction?: () => void;
};

export function StatePanel({
  variant,
  title,
  description,
  actionLabel,
  onAction,
}: StatePanelProps) {
  const safeDescription = getErrorMessage(description);

  if (variant === "error") {
    return (
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        {safeDescription && <AlertDescription>{safeDescription}</AlertDescription>}
      </Alert>
    );
  }

  if (variant === "loading") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {safeDescription || "Loading..."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {safeDescription && <p>{safeDescription}</p>}
        {actionLabel && onAction && (
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
