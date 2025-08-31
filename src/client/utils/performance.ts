/**
 * Performance monitoring utilities
 */

interface PerformanceData {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  memoryUsage?: {
    used: number;
    total: number;
  };
}

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    this.initializeObservers();
    this.trackPageLoad();
  }

  private initializeObservers(): void {
    // Paint timing observer
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.metrics.set(entry.name, entry.startTime);
          });
        });

        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
      } catch (error) {
        console.warn('Paint observer not supported:', error);
      }

      // Largest Contentful Paint observer
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.set('largest-contentful-paint', lastEntry.startTime);
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }
    }
  }

  private trackPageLoad(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      this.metrics.set('load-time', navigation.loadEventEnd - navigation.navigationStart);
      this.metrics.set('dom-content-loaded', navigation.domContentLoadedEventEnd - navigation.navigationStart);
      this.metrics.set('dom-interactive', navigation.domInteractive - navigation.navigationStart);
    });
  }

  markStart(name: string): void {
    performance.mark(`${name}-start`);
  }

  markEnd(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const measure = performance.getEntriesByName(name, 'measure')[0];
    const duration = measure.duration;

    this.metrics.set(name, duration);
    return duration;
  }

  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): PerformanceData {
    const memoryInfo = (performance as any).memory;

    return {
      loadTime: this.metrics.get('load-time') || 0,
      domContentLoaded: this.metrics.get('dom-content-loaded') || 0,
      firstContentfulPaint: this.metrics.get('first-contentful-paint'),
      largestContentfulPaint: this.metrics.get('largest-contentful-paint'),
      memoryUsage: memoryInfo ? {
        used: memoryInfo.usedJSHeapSize,
        total: memoryInfo.totalJSHeapSize
      } : undefined
    };
  }

  trackCustomMetric(name: string, value: number): void {
    this.metrics.set(name, value);

    // Send to analytics
    if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true') {
      import('./analytics').then(({ analytics }) => {
        analytics.trackPerformance({
          name,
          value,
          unit: 'ms',
          timestamp: Date.now()
        });
      });
    }
  }

  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const measureAsync = async <T>(name:string, fn: () => Promise<T>): Promise<T> => {
  performanceMonitor.markStart(name);
  try {
    const result = await fn();
    const duration = performanceMonitor.markEnd(name);
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    performanceMonitor.markEnd(name);
    throw error;
  }
};

export const measureSync = <T>(name: string, fn: () => T): T => {
  performanceMonitor.markStart(name);
  try {
    const result = fn();
    const duration = performanceMonitor.markEnd(name);
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    performanceMonitor.markEnd(name);
    throw error;
  }
};
