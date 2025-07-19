import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mobile component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
          <h3 className="font-semibold mb-2">Something went wrong</h3>
          <p className="text-sm opacity-75">
            A mobile component encountered an error. Please try refreshing the page.
          </p>
          <button
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MobileErrorBoundary;