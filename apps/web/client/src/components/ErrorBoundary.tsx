import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    const staleModule = /failed to fetch dynamically imported module|importing a module script failed/i.test(error.message);
    const reloadKey = "bridgex-route-recovery";
    if (staleModule && !sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, "1");
      window.setTimeout(() => window.location.reload(), 100);
    }
  }

  render() {
    if (this.state.hasError) {
      const staleModule = /failed to fetch dynamically imported module|importing a module script failed/i.test(this.state.error?.message ?? "");
      if (staleModule) return <div className="grid min-h-screen place-items-center bg-[#f7f5ef] px-6 text-center"><div><p className="font-display text-3xl font-bold text-[#172126]">Updating BridgeX…</p><p className="mt-3 text-sm text-[#637073]">Refreshing the latest secure application files.</p></div></div>;
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
