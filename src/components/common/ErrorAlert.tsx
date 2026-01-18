import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { AIError } from "@/features/learn-ai/aiService";

interface ErrorAlertProps {
  error: AIError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorAlert({ error, onRetry, onDismiss }: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-semibold">{error.title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{error.message}</p>
        {error.action && (
          <p className="text-sm opacity-90">{error.action}</p>
        )}
        {import.meta.env.DEV && error.debug && (
          <details className="text-xs opacity-70 mt-2">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-1 whitespace-pre-wrap">{error.debug}</pre>
          </details>
        )}
        <div className="flex gap-2 mt-3">
          {error.canRetry && onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              {error.title.includes("Retry") || error.title.includes("دوباره")
                ? "Retry"
                : "Try Again"}
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
