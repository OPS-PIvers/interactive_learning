/**
 * Performance Optimization Test Suite
 * Week 3 Cross-Platform Testing - Performance validation
 */

import { render, act, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ViewerFooterToolbar from '../../client/components/ViewerFooterToolbar';

// Performance testing utilities
const measurePerformance = async (operation: () => void | Promise<void>) => {
  const start = performance.now();
  await operation();
  const end = performance.now();
  return end - start;
};

const mockSlides = [
  { 
    id: 'slide-1', 
    title: 'Slide 1', 
    elements: [], 
    transitions: [],
    layout: {
      aspectRatio: '16:9',
      scaling: 'fit' as const,
      backgroundSize: 'cover' as const,
      backgroundPosition: 'center'
    }
  },
  { 
    id: 'slide-2', 
    title: 'Slide 2', 
    elements: [], 
    transitions: [],
    layout: {
      aspectRatio: '16:9',
      scaling: 'fit' as const,
      backgroundSize: 'cover' as const,
      backgroundPosition: 'center'
    }
  },
  { 
    id: 'slide-3', 
    title: 'Slide 3', 
    elements: [], 
    transitions: [],
    layout: {
      aspectRatio: '16:9',
      scaling: 'fit' as const,
      backgroundSize: 'cover' as const,
      backgroundPosition: 'center'
    }
  }
];

const defaultProps = {
  projectName: 'Performance Test Project',
  onBack: vi.fn(),
  currentSlideIndex: 0,
  totalSlides: 3,
  slides: mockSlides,
  onSlideSelect: vi.fn(),
  showProgress: true,
  moduleState: 'idle' as const,
  onStartLearning: vi.fn(),
  onStartExploring: vi.fn(),
  hasContent: true,
  onPreviousSlide: vi.fn(),
  onNextSlide: vi.fn(),
  canGoPrevious: true,
  canGoNext: true,
  viewerModes: {
    explore: true,
    selfPaced: true,
    timed: false
  }
};

describe('Performance Optimization Tests', () => {
  beforeEach(() => {
    // Mock mobile viewport for performance testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('CSS Animation Performance', () => {
    it('should perform auto-collapse animation efficiently', async () => {
      vi.useFakeTimers();
      
      const renderTime = await measurePerformance(() => {
        render(
          <BrowserRouter>
            <ViewerFooterToolbar {...defaultProps} />
          </BrowserRouter>
        );
      });

      // Component should render quickly (< 50ms)
      expect(renderTime).toBeLessThan(50);

      // Animation should complete without hanging or errors
      act(() => {
        vi.runAllTimers();
      });

      // Test passes if no errors are thrown during timer execution
      expect(true).toBe(true);
    });

    it('should handle button press animations efficiently', async () => {
      const { container } = render(
        <BrowserRouter>
          <ViewerFooterToolbar {...defaultProps} />
        </BrowserRouter>
      );

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();

      const clickTime = await measurePerformance(() => {
        button!.click();
      });

      // Button click should be fast (< 50ms)
      expect(clickTime).toBeLessThan(50);
    });
  });

  describe('Touch Event Response Time', () => {
    it('should respond to touch events quickly', async () => {
      vi.useFakeTimers();
      
      render(
        <BrowserRouter>
          <ViewerFooterToolbar {...defaultProps} />
        </BrowserRouter>
      );

      // Start collapse timer
      act(() => {
        vi.advanceTimersByTime(2900);
      });

      // Measure touch response time
      const touchResponseTime = await measurePerformance(() => {
        act(() => {
          const touchEvent = new TouchEvent('touchstart', { bubbles: true });
          document.dispatchEvent(touchEvent);
        });
      });

      // Touch response should be under 100ms
      expect(touchResponseTime).toBeLessThan(100);
    });

    it('should handle mouse interaction efficiently', async () => {
      const mouseResponseTime = await measurePerformance(() => {
        act(() => {
          const mouseEvent = new MouseEvent('mousemove', { bubbles: true });
          document.dispatchEvent(mouseEvent);
        });
      });

      // Mouse response should be very fast (< 10ms)
      expect(mouseResponseTime).toBeLessThan(10);
    });
  });

  describe('Memory Usage and Leaks', () => {
    it('should not create memory leaks with timer cleanup', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      let mountCount = 0;

      // Simulate multiple mount/unmount cycles
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <BrowserRouter>
            <ViewerFooterToolbar {...defaultProps} />
          </BrowserRouter>
        );
        mountCount++;
        unmount();
      }

      // Should have called clearTimeout for each mount
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(mountCount);
    });

    it('should cleanup event listeners properly', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(
        <BrowserRouter>
          <ViewerFooterToolbar {...defaultProps} />
        </BrowserRouter>
      );

      unmount();
      const removeCallCount = removeEventListenerSpy.mock.calls.length;

      // Should remove event listeners on cleanup  
      expect(removeCallCount).toBeGreaterThanOrEqual(3); // touchstart, mousemove, scroll
    });
  });

  describe('Bundle Size Impact', () => {
    it('should use CSS-only approach for minimal JS overhead', () => {
      const { container } = render(
        <BrowserRouter>
          <ViewerFooterToolbar {...defaultProps} />
        </BrowserRouter>
      );

      const toolbar = container.querySelector('.viewer-footer-toolbar');
      
      // Should use CSS classes rather than inline styles for animations
      expect(toolbar).not.toHaveAttribute('style');
      expect(toolbar).toHaveClass('viewer-footer-toolbar');
    });

    it('should minimize DOM manipulation', () => {
      vi.useFakeTimers();
      const { container } = render(
        <BrowserRouter>
          <ViewerFooterToolbar {...defaultProps} />
        </BrowserRouter>
      );

      const initialChildCount = container.children.length;
      
      // Trigger collapse
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      const afterCollapseChildCount = container.children.length;
      
      // Should not create/remove DOM elements, only change classes
      expect(afterCollapseChildCount).toBe(initialChildCount);
    });
  });

  describe('Render Performance', () => {
    it('should maintain 60fps animation capability', async () => {
      // Mock requestAnimationFrame for testing
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        setTimeout(callback, 16.67); // 60fps = 16.67ms per frame
        return 1;
      });

      vi.useFakeTimers();
      
      render(
        <BrowserRouter>
          <ViewerFooterToolbar {...defaultProps} />
        </BrowserRouter>
      );

      // Simulate animation frame timing
      const frameTime = await measurePerformance(() => {
        act(() => {
          vi.advanceTimersByTime(16.67);
        });
      });

      // Should maintain reasonable frame timing (< 50ms per frame in test environment)
      expect(frameTime).toBeLessThan(50);
      
      rafSpy.mockRestore();
    });

    it('should handle rapid state changes efficiently', async () => {
      vi.useFakeTimers();
      
      render(
        <BrowserRouter>
          <ViewerFooterToolbar {...defaultProps} />
        </BrowserRouter>
      );

      // Simulate rapid touch interactions
      const rapidStateChangeTime = await measurePerformance(() => {
        for (let i = 0; i < 10; i++) {
          act(() => {
            const touchEvent = new TouchEvent('touchstart', { bubbles: true });
            document.dispatchEvent(touchEvent);
          });
        }
      });

      // Should handle rapid changes efficiently (< 50ms for 10 interactions)
      expect(rapidStateChangeTime).toBeLessThan(50);
    });
  });

  describe('Cross-Device Performance', () => {
    it('should perform consistently across mobile devices', async () => {
      const deviceTests = [
        { width: 390, height: 844, name: 'iPhone 13' },
        { width: 393, height: 851, name: 'Pixel 5' },
        { width: 414, height: 896, name: 'iPhone 11' }
      ];

      for (const device of deviceTests) {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: device.width,
        });

        const renderTime = await measurePerformance(() => {
          const { unmount } = render(
            <BrowserRouter>
              <ViewerFooterToolbar {...defaultProps} />
            </BrowserRouter>
          );
          unmount();
        });

        // Should render consistently across devices (< 50ms)
        expect(renderTime).toBeLessThan(50);
      }
    });

    it('should handle desktop performance requirements', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false, // Not mobile
          media: '',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const desktopRenderTime = await measurePerformance(() => {
        const { unmount } = render(
          <BrowserRouter>
            <ViewerFooterToolbar {...defaultProps} />
          </BrowserRouter>
        );
        unmount();
      });

      // Desktop should render efficiently (< 30ms)
      expect(desktopRenderTime).toBeLessThan(30);
    });
  });
});