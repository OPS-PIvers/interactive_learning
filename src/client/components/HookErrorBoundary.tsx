import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class HookErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a hooks-related error
    const isHookError = error.message.includes('hooks') || 
                       error.message.includes('render') ||
                       error.message.includes('Rendered more hooks') ||
                       error.message.includes('Invariant');
    
    return {
      hasError: true,
      ...(isHookError && { error }),
    };
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    console.error('Hook Error Boundary caught an error:', error, errorInfo);
    
    // Enhanced detection for hook-related errors
    const isHookError = error.message.includes('hooks') || 
                       error.message.includes('Rendered more hooks') ||
                       error.message.includes('Rendered fewer hooks') ||
                       error.message.includes('Invariant');
    
    if (isHookError) {
      console.error('🚨 React Hooks Error Detected:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        // Help developers identify the component
        possibleComponent: errorInfo.componentStack?.split('\n')[1]?.trim()
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Component Error</h2>
            <p className="text-slate-300 mb-4">
              A rendering error occurred. This is usually due to component state issues or hook order violations.
            </p>
            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-slate-800 p-2 rounded overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default HookErrorBoundary;