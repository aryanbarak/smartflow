import { WifiOff, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartFlowLogo } from "@/components/SmartFlowLogo";

const CACHED_FEATURES = [
  "Previously viewed tasks and notes",
  "Calendar events loaded before going offline",
  "Finance summaries and recent transactions",
];

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-8">
      <SmartFlowLogo />

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-amber-400">
          <WifiOff className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">You're offline</h1>
        </div>
        <p className="text-muted-foreground max-w-sm">
          No internet connection detected. Some features may be limited until you reconnect.
        </p>
      </div>

      <div className="w-full max-w-sm text-left space-y-2">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Available offline
        </p>
        <ul className="space-y-2">
          {CACHED_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={() => window.location.reload()}
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Retry connection
      </Button>
    </div>
  );
}
