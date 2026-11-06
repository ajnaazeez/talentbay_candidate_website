import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Candidate Web:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.fallbackComponent) {
        return this.fallbackComponent;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-[#0E2233] border border-rose-200 dark:border-rose-900/50 shadow-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0E2233] dark:text-white">Something went wrong</h3>
              <p className="text-xs sm:text-sm text-[#6B8699] dark:text-[#8CA6B7] mt-1">
                {this.state.error?.message || 'An unexpected error occurred while rendering this section.'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E2233] hover:bg-[#163248] text-white border border-[#00BFA6]/40 hover:border-[#00BFA6] text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#00BFA6]" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private get fallbackComponent(): ReactNode {
    return this.props.fallback;
  }
}
