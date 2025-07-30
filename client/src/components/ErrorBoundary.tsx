import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<
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
    this.setState({ errorInfo });

    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you would send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return (
          <this.props.fallback
            error={this.state.error!}
            resetError={this.handleReset}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          resetError={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            We're sorry, but something unexpected happened. Please try
            refreshing the page or contact support if the problem persists.
          </AlertDescription>
        </Alert>

        {isDevelopment && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-semibold text-red-800 mb-2">
              Development Error Details:
            </h3>
            <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-40">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button onClick={resetError} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
};

// Higher-order component for async error handling
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;
  return WrappedComponent;
};

// Hook for handling async errors
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Async error handled:', error);
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error; // This will be caught by ErrorBoundary
    }
  }, [error]);

  return { handleError, resetError };
};

export default ErrorBoundary;
