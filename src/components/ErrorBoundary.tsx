import React from "react";
import { AlertTriangle, RefreshCw, Home, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import { logger } from "@/lib/logger";
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  /** true si la frontière est montée à l'intérieur du Router : on navigue sans recharger. */
  insideRouter?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ErrorBoundary caught:", error, { component: "ErrorBoundary", data: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
          <div className="text-center space-y-4 p-8 max-w-md">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">
              {this.props.fallbackTitle || "Une erreur est survenue"}
            </h2>
            <p className="text-muted-foreground text-sm">
              Ce module a rencontré un problème. Le reste de l'application fonctionne normalement.
            </p>
            {this.state.error && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                {this.state.error.message}
              </p>
            )}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button type="button" variant="outline" size="sm" onClick={this.handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              {this.props.insideRouter ? (
                <Button type="button" size="sm" asChild onClick={this.handleReset}>
                  <Link to="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Tableau de bord
                  </Link>
                </Button>
              ) : (
                <Button type="button" size="sm" asChild>
                  <a href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Tableau de bord
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
