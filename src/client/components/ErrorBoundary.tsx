import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorType?: 'tdz' | 'reference' | 'hook' | 'runtime' | 'unknown';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Classify error type for better reporting
    const errorType = ErrorBoundary.classifyError(error);
    return { hasError: true, error, errorType };
  }

  static classifyError(error: Error): 'tdz' | 'reference' | 'hook' | 'runtime' | 'unknown' {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // Temporal Dead Zone errors
    if (message.includes('cannot access') && message.includes('before initialization')) {
      return 'tdz';
    }
    
    // Reference errors (undefined variables, null property access)
    if (error.name === 'ReferenceError' || 
        message.includes('is not defined') ||
        message.includes('cannot read property') ||
        message.includes('cannot read properties of null') ||
        message.includes('cannot read properties of undefined')) {
      return 'reference';
    }
    
    // React Hook errors
    if (message.includes('rules of hooks') ||
        message.includes('hook') && (message.includes('conditional') || message.includes('loop'))) {
      return 'hook';
    }
    
    // General runtime errors
    if (error.name === 'TypeError' || error.name === 'RangeError' || error.name === 'SyntaxError') {
      return 'runtime';
    }
    
    return 'unknown';
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorType = this.state.errorType || 'unknown';
    console.error(`ErrorBoundary caught a ${errorType} error:`, error, errorInfo);
    
    // Enhanced error reporting with classification
    this.reportError(error, errorInfo, errorType);
    
    // Store error info for better debugging
    this.setState({ errorInfo });
    
    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError(error: Error, errorInfo: React.ErrorInfo, errorType: string) {
    // In production, this could send to error tracking service
    const errorReport = {
      type: errorType,
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace available',
      componentStack: errorInfo?.componentStack || 'No component stack available',
      timestamp: new Date().toISOString(),
      userAgent: navigator?.userAgent || 'Unknown user agent',
      url: window?.location?.href || 'Unknown URL',
    };
    
    if (process.env['NODE_ENV'] === 'development') {
      console.group(`🔴 ${errorType.toUpperCase()} Error Report`);
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Full Report:', errorReport);
      console.groupEnd();
    }
    
    // TODO: In production, send to error tracking service
    // e.g., Sentry, LogRocket, or custom analytics
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Unified responsive error UI
      return (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 md:flex md:flex-col md:items-center md:justify-center md:p-6 md:bg-red-50 md:border-red-200">
          <div className="hidden md:block text-red-600 mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-semibold mb-2 md:text-lg md:font-semibold md:text-red-800">Something went wrong</h2>
          <p className="text-sm opacity-75 md:text-red-700 md:text-center md:opacity-100">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded md:px-4 md:py-2 md:mt-4 transition-colors"
          >
            Try Again
          </button>
          {process.env['NODE_ENV'] === 'development' && this.state.error && (
            <details className="mt-4 p-3 bg-red-800/30 rounded text-xs md:bg-red-100 md:p-4 md:text-sm">
              <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
              <pre className="mt-2 text-red-100 whitespace-pre-wrap md:text-red-800">
                {this.state.error?.message || 'No error message'}
                {this.state.error?.stack || 'No stack trace'}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;