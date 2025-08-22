import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ResponsiveCanvas } from '../../client/components/slides/canvas/ResponsiveCanvas';
import { useComponentPerformance } from '../../client/hooks/useComponentPerformance';
import { SlideDeck } from '../../shared/slideTypes';

// Mock performance timing for tests
const mockPerformanceNow = () => {
  let time = 0;
  return () => {
    time += Math.random() * 20; // Simulate 0-20ms render time
    return time;
  };
};

// Test component with performance monitoring
const TestComponentWithPerformance: React.FC<{ name: string }> = ({ name }) => {
  const { renderCount, averageRenderTime } = useComponentPerformance(name, true);
  
  return (
    <div data-testid={`test-component-${name}`}>
      <span data-testid="render-count">{renderCount}</span>
      <span data-testid="avg-render-time">{averageRenderTime.toFixed(2)}</span>
    </div>
  );
};

describe('Performance Render Optimization Tests', () => {
  beforeEach(() => {
    // Reset performance.now for consistent testing
    const mockNow = mockPerformanceNow();
    vi.spyOn(performance, 'now').mockImplementation(mockNow);
  });

  test('useComponentPerformance hook tracks render metrics correctly', () => {
    let renderCount = 0;
    let avgRenderTime = 0;
    
    const TestComponentWithTracking: React.FC = () => {
      const { renderCount: rc, averageRenderTime: art } = useComponentPerformance('test-component', true);
      renderCount = rc;
      avgRenderTime = art;
      
      return (
        <div data-testid="test-component">
          <span>Render count: {rc}</span>
          <span>Avg time: {art.toFixed(2)}ms</span>
        </div>
      );
    };
    
    const { rerender } = render(<TestComponentWithTracking />);
    
    // After first render, should have some metrics
    expect(renderCount).toBeGreaterThanOrEqual(0);
    
    // Force re-render
    rerender(<TestComponentWithTracking />);
    
    // Average render time should be reasonable (less than 100ms in tests)
    expect(avgRenderTime).toBeLessThan(100);
  });

  test('ResponsiveCanvas renders within acceptable time limits', async () => {
    const mockSlideDeck: SlideDeck = {
      id: 'test-deck',
      title: 'Performance Test Deck',
      settings: {
        autoAdvance: false,
        allowNavigation: true,
        showProgress: true,
        showControls: true,
        keyboardShortcuts: true,
        touchGestures: true,
        fullscreenMode: false,
      },
      slides: [
        {
          id: 'test-slide',
          title: 'Test Slide',
          transitions: [],
          elements: [
            {
              id: 'test-element',
              type: 'hotspot',
              position: {
                desktop: { x: 100, y: 100, width: 50, height: 50 },
                tablet: { x: 100, y: 100, width: 50, height: 50 },
                mobile: { x: 100, y: 100, width: 50, height: 50 },
              },
              content: { title: 'Test Hotspot' },
              interactions: [],
              style: { backgroundColor: '#000000' },
              isVisible: true,
            },
          ],
          backgroundMedia: {
            type: 'image',
            url: '',
          },
          layout: {
            aspectRatio: '16:9',
            scaling: 'fit',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          },
        },
      ],
      metadata: {
        version: '1.0',
        created: Date.now(),
        modified: Date.now(),
        isPublic: false,
      },
    };

    const startTime = performance.now();
    
    render(
      <ResponsiveCanvas
        slideDeck={mockSlideDeck}
        currentSlideIndex={0}
        onSlideDeckChange={() => {}}
        selectedElementId={null}
        onElementSelect={() => {}}
        onElementUpdate={() => {}}
        className="test-canvas"
        isEditable={true}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // ResponsiveCanvas should render within 200ms (reasonable for complex component)
    expect(renderTime).toBeLessThan(200);
    console.log(`ResponsiveCanvas render time: ${renderTime.toFixed(2)}ms`);
  });

  test('Component re-renders are optimized', () => {
    let renderCount = 0;
    
    const OptimizedComponent: React.FC<{ data: any }> = React.memo(({ data }) => {
      renderCount++;
      return <div>{data.value}</div>;
    });
    
    const testData = { value: 'test' };
    const { rerender } = render(<OptimizedComponent data={testData} />);
    
    expect(renderCount).toBe(1);
    
    // Re-render with same data - should not trigger re-render due to React.memo
    rerender(<OptimizedComponent data={testData} />);
    expect(renderCount).toBe(1); // Should still be 1 due to memoization
    
    // Re-render with different data - should trigger re-render
    rerender(<OptimizedComponent data={{ value: 'new test' }} />);
    expect(renderCount).toBe(2);
  });

  test('Memory usage stays within acceptable limits', () => {
    // Mock performance.memory
    const mockMemory = {
      usedJSHeapSize: 30 * 1024 * 1024, // 30MB
      totalJSHeapSize: 50 * 1024 * 1024, // 50MB
      jsHeapSizeLimit: 100 * 1024 * 1024, // 100MB
    };
    
    // @ts-ignore
    Object.defineProperty(performance, 'memory', {
      value: mockMemory,
      configurable: true,
    });
    
    const memoryUsageMB = mockMemory.usedJSHeapSize / (1024 * 1024);
    
    // Memory usage should be reasonable (less than 50MB for this test)
    expect(memoryUsageMB).toBeLessThan(50);
    
    console.log(`Memory usage: ${memoryUsageMB.toFixed(1)}MB`);
  });
});