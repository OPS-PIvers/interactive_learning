import { useRef, useEffect } from 'react';

/**
 * Performance monitoring hook for tracking component render times
 * Part of Phase 2.5: Performance Baseline & Monitoring
 * 
 * @param componentName Name of the component being monitored
 * @param enableLogging Whether to log performance metrics (default: development only)
 */
export const useComponentPerformance = (
  componentName: string,
  enableLogging: boolean = process.env['NODE_ENV'] === 'development'
) => {
  const startTime = useRef(performance.now());
  const renderCount = useRef(0);
  const totalRenderTime = useRef(0);

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    renderCount.current += 1;
    totalRenderTime.current += renderTime;
    
    if (enableLogging) {
      console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
      
      // Warn for slow renders (>16.67ms = 60fps threshold)
      if (renderTime > 16.67) {
        console.warn(`⚠️  Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
      
      // Log average render time every 10 renders
      if (renderCount.current % 10 === 0) {
        const avgRenderTime = totalRenderTime.current / renderCount.current;
        console.log(`📊 ${componentName} average render time: ${avgRenderTime.toFixed(2)}ms (${renderCount.current} renders)`);
      }
    }
    
    // Reset timer for next render
    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    averageRenderTime: renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0,
  };
};

/**
 * Memory usage monitoring hook
 * Tracks memory usage patterns for performance optimization
 */
export const useMemoryMonitoring = (componentName: string) => {
  useEffect(() => {
    if (process.env['NODE_ENV'] !== 'development') return;
    
    const checkMemory = () => {
      // @ts-ignore - performance.memory is non-standard but widely supported
      if (performance.memory) {
        // @ts-ignore
        const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
        const memoryUsageMB = usedJSHeapSize / (1024 * 1024);
        
        console.log(`💾 ${componentName} - Memory usage: ${memoryUsageMB.toFixed(1)}MB`);
        
        // Warn if memory usage is high
        if (memoryUsageMB > 50) {
          console.warn(`⚠️  High memory usage in ${componentName}: ${memoryUsageMB.toFixed(1)}MB`);
        }
      }
    };

    const interval = setInterval(checkMemory, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [componentName]);
};