import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log all errors caught by the boundary for general debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Enhanced TDZ error detection
    if (
      error.message.includes('before initialization') ||
      error.message.includes('Cannot access') ||
      error.message.includes('temporal dead zone') ||
      error.name === 'ReferenceError'
    ) {
      console.error('🚨 TEMPORAL DEAD ZONE ERROR DETECTED:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        possibleCauses: [
          'Variable used before declaration',
          'Function called before definition',
          'Circular dependency in useCallback/useMemo'
        ]
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Application Error</h1>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-red-600 mb-4">
                The interactive learning application encountered an error during initialization.
              </p>
              <p className="text-gray-600 text-sm mb-4">
                Error: {this.state.error?.message || 'Unknown error'}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;