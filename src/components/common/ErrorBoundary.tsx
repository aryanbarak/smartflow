import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">خطایی رخ داده است</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            متأسفانه یک خطای غیرمنتظره رخ داد. لطفاً صفحه را رفرش کنید یا دوباره تلاش کنید.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details className="mb-4 text-left max-w-md">
              <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                جزئیات خطا (فقط در حالت توسعه)
              </summary>
              <pre className="text-xs bg-secondary p-3 rounded overflow-auto">
                {this.state.error.toString()}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <Button onClick={this.handleReset} variant="default">
              تلاش دوباره
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              رفرش صفحه
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
