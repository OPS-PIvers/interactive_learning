import React, { Component, ReactNode } from 'react';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isMobile?: boolean; // Allow explicit mobile styling
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
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use mobile styling if isMobile prop is true
      const isMobile = this.props.isMobile;
      
      if (isMobile) {
        // Mobile-optimized dark theme error UI
        return (
          <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
            <h3 className="font-semibold mb-2">Something went wrong</h3>
            <p className="text-sm opacity-75">
              A component encountered an error. Please try refreshing the page.
            </p>
            <button
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
              onClick={() => this.setState({ hasError: false })}
            >
              Try Again
            </button>
            {process.env['NODE_ENV'] === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-red-800/30 rounded text-xs">
                <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
                <pre className="mt-2 text-red-100 whitespace-pre-wrap">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        );
      }

      // Desktop light theme error UI
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-700 text-center mb-4">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          {process.env['NODE_ENV'] === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-red-100 rounded text-sm">
              <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
              <pre className="mt-2 text-red-800 whitespace-pre-wrap">
                {this.state.error.message}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Responsive Error Boundary wrapper that automatically detects device type
 * and applies appropriate styling. This replaces both ErrorBoundary and MobileErrorBoundary.
 */
export const ResponsiveErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'isMobile'>> = (props) => {
  const { isMobile } = useDeviceDetection();
  
  return <ErrorBoundary {...props} isMobile={isMobile} />;
};

// Export both the class component (for manual isMobile control) and the responsive wrapper
export { ErrorBoundary };
export default ResponsiveErrorBoundary;