import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { performanceMonitor } from '../utils/performance';
import { analytics } from '../utils/analytics';

export const usePerformanceMonitoring = () => {
  const location = useLocation();

  useEffect(() => {
    const metrics = performanceMonitor.getAllMetrics();

    if (import.meta.env.DEV) {
      console.log('Performance Metrics:', metrics);
    }

    if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true') {
      analytics.trackPerformance({
        name: 'page_load',
        value: metrics.loadTime,
        unit: 'ms',
        timestamp: Date.now(),
      });

      if (metrics.firstContentfulPaint) {
        analytics.trackPerformance({
          name: 'first_contentful_paint',
          value: metrics.firstContentfulPaint,
          unit: 'ms',
          timestamp: Date.now(),
        });
      }

      if (metrics.largestContentfulPaint) {
        analytics.trackPerformance({
          name: 'largest_contentful_paint',
          value: metrics.largestContentfulPaint,
          unit: 'ms',
          timestamp: Date.now(),
        });
      }
    }
  }, [location]);
};
