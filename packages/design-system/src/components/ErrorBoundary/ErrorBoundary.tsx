import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "../Button";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback renderer — receives the error and a retry function. */
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Wraps route-level (or any) content and catches render errors — including
 * a lazy chunk failing to load (corrupted file, antivirus blocking the
 * request, offline mid-navigation). Without this, a failed `React.lazy()`
 * import throws during render and the whole app goes blank with only a
 * console error, which is a bad failure mode for a desktop app that's
 * supposed to feel reliable.
 *
 * Must be a class component — error boundaries are one of the few remaining
 * class-only APIs in React (no hook equivalent for getDerivedStateFromError).
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] caught render error:", error, info.componentStack);
  }

  retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.retry);

      return (
        <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertTriangle size={28} className="text-status-danger" />
          <p className="text-sm font-medium text-text-primary">Essa tela não carregou corretamente.</p>
          <p className="max-w-sm text-xs text-text-muted">{this.state.error.message}</p>
          <Button variant="secondary" size="sm" icon={<RotateCw size={13} />} onClick={this.retry}>
            Tentar de novo
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
