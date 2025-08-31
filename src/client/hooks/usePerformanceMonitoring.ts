import { useEffect } from 'react';
import { performanceMonitor } from '../utils/performance';

// TODO: Implement a more comprehensive performance monitoring hook
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // This is a placeholder for a more comprehensive performance monitoring hook.
    // For now, it just logs the performance metrics to the console.
    console.log('Performance metrics:', performanceMonitor.getAllMetrics());
  }, []);
};
