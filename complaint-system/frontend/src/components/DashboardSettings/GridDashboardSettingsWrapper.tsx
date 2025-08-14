import { Component, ErrorInfo, ReactNode } from 'react';
import GridDashboardSettings from './GridDashboardSettings';
import type { DashboardCard } from './SimpleDashboardSettings';

interface Props {
  onSave?: (cards: DashboardCard[], globalConfig: any) => Promise<void>;
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class GridDashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GridDashboard error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Dashboard Settings Error</h3>
          <p className="text-red-700 mb-4">
            There was an error loading the dashboard settings. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
          {this.state.error && (
            <details className="mt-4">
              <summary className="text-sm text-red-600 cursor-pointer">Error Details</summary>
              <pre className="text-xs mt-2 p-2 bg-red-100 rounded overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return <GridDashboardSettings onSave={this.props.onSave} />;
  }
}

export default GridDashboardErrorBoundary;
