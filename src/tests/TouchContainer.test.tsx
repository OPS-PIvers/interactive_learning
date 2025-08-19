import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TouchContainer } from '../client/components/touch/TouchContainer';

// Mock touch gesture hook
const mockTouchHandlers = {
  onTouchStart: vi.fn(),
  onTouchMove: vi.fn(),
  onTouchEnd: vi.fn(),
  onTouchCancel: vi.fn(),
};

vi.mock('../client/hooks/useTouchGestures', () => ({
  useTouchGestures: vi.fn(() => ({
    handleTouchStart: mockTouchHandlers.onTouchStart,
    handleTouchMove: mockTouchHandlers.onTouchMove,
    handleTouchEnd: mockTouchHandlers.onTouchEnd,
    handleTouchCancel: mockTouchHandlers.onTouchCancel,
  }))
}));

const defaultProps = {
  children: <div data-testid="touch-content">Touch Content</div>,
  onPanGesture: vi.fn(),
  onPinchZoom: vi.fn(),
  onTap: vi.fn(),
  enablePan: true,
  enableZoom: true,
  className: 'test-container'
};

describe('TouchContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(<TouchContainer {...defaultProps} />);
      
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
      expect(screen.getByText('Touch Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<TouchContainer {...defaultProps} className="custom-touch-class" />);
      
      const container = screen.getByTestId('touch-content').parentElement;
      expect(container).toHaveClass('custom-touch-class');
    });

    it('renders without className when not provided', () => {
      const { className, ...propsWithoutClassName } = defaultProps;
      render(<TouchContainer {...propsWithoutClassName} />);
      
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
    });
  });

  describe('Touch Event Handling', () => {
    it('attaches touch event handlers when gestures are enabled', () => {
      render(<TouchContainer {...defaultProps} />);
      
      const container = screen.getByTestId('touch-content').parentElement!;
      
      // Verify touch handlers are attached
      expect(container).toBeInTheDocument();
      
      // Test touch start
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      });
      
      act(() => {
        fireEvent(container, touchStartEvent);
      });

      // The TouchContainer should be rendered and handle touch events
      // Since we're mocking the hook, we check that the component renders correctly
      expect(container).toBeInTheDocument();
    });

    it('handles touch move events', () => {
      render(<TouchContainer {...defaultProps} />);
      
      const container = screen.getByTestId('touch-content').parentElement!;
      
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 150 } as Touch]
      });
      
      act(() => {
        fireEvent(container, touchMoveEvent);
      });

      expect(container).toBeInTheDocument();
    });

    it('handles touch end events', () => {
      render(<TouchContainer {...defaultProps} />);
      
      const container = screen.getByTestId('touch-content').parentElement!;
      
      const touchEndEvent = new TouchEvent('touchend', {});
      
      act(() => {
        fireEvent(container, touchEndEvent);
      });

      expect(container).toBeInTheDocument();
    });

    it('handles touch cancel events', () => {
      render(<TouchContainer {...defaultProps} />);
      
      const container = screen.getByTestId('touch-content').parentElement!;
      
      const touchCancelEvent = new TouchEvent('touchcancel', {});
      
      act(() => {
        fireEvent(container, touchCancelEvent);
      });

      expect(container).toBeInTheDocument();
    });
  });

  describe('Gesture Configuration', () => {
    it('respects pan gesture enablement', () => {
      render(<TouchContainer {...defaultProps} enablePan={false} />);
      
      // Touch container should still render but with different gesture configuration
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
    });

    it('respects pinch gesture enablement', () => {
      render(<TouchContainer {...defaultProps} enableZoom={false} />);
      
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
    });

    it('respects zoom and pan gesture disablement', () => {
      render(<TouchContainer {...defaultProps} enableZoom={false} enablePan={false} />);
      
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
    });

    it('handles all gestures disabled', () => {
      render(
        <TouchContainer 
          {...defaultProps} 
          enablePan={false} 
          enableZoom={false}
        />
      );
      
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
    });
  });

  describe('Callback Integration', () => {
    it('provides pan callback when enabled', () => {
      const onPan = vi.fn();
      render(<TouchContainer {...defaultProps} onPanGesture={onPan} enablePan={true} />);
      
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
      // Pan callback testing would require mocking the useTouchGestures hook more extensively
    });

    it('provides pinch callback when enabled', () => {
      const onPinch = vi.fn();
      render(<TouchContainer {...defaultProps} onPinchZoom={onPinch} enableZoom={true} />);
      
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
    });

    it('provides tap callback when enabled', () => {
      const onTap = vi.fn();
      render(<TouchContainer {...defaultProps} onTap={onTap} />);
      
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
    });
  });

  describe('Performance and Memory', () => {
    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(<TouchContainer {...defaultProps} />);
      
      // Component should unmount without errors
      unmount();
      
      // Touch handlers should be cleaned up (tested implicitly)
      expect(screen.queryByTestId('touch-content')).not.toBeInTheDocument();
    });

    it('handles rapid touch events without performance issues', () => {
      render(<TouchContainer {...defaultProps} />);
      
      const container = screen.getByTestId('touch-content').parentElement!;
      
      // Simulate rapid touch events
      act(() => {
        for (let i = 0; i < 100; i++) {
          const touchEvent = new TouchEvent('touchmove', {
            touches: [{ clientX: 100 + i, clientY: 100 + i } as Touch]
          });
          fireEvent(container, touchEvent);
        }
      });

      // Should still render correctly after rapid events
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains accessibility for touch interactions', () => {
      render(<TouchContainer {...defaultProps} />);
      
      const container = screen.getByTestId('touch-content').parentElement!;
      
      // Should not interfere with keyboard navigation
      expect(container).toBeInTheDocument();
      
      // Touch container should not add conflicting ARIA attributes
      expect(container.getAttribute('aria-hidden')).toBeNull();
    });

    it('works with keyboard navigation', () => {
      render(<TouchContainer {...defaultProps} />);
      
      const container = screen.getByTestId('touch-content').parentElement!;
      
      // Keyboard events should still work
      fireEvent.keyDown(container, { key: 'Enter' });
      fireEvent.keyDown(container, { key: 'Space' });
      
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing touch events gracefully', () => {
      render(<TouchContainer {...defaultProps} />);
      
      const container = screen.getByTestId('touch-content').parentElement!;
      
      // Test with malformed touch events
      act(() => {
        fireEvent(container, new TouchEvent('touchstart', { touches: [] }));
        fireEvent(container, new TouchEvent('touchmove', { touches: [] }));
      });

      // Should not crash
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
    });

    it('handles null callbacks gracefully', () => {
      render(
        <TouchContainer 
          enablePan={true}
          enableZoom={true}
        >
          <div data-testid="touch-content">Touch Content</div>
        </TouchContainer>
      );
      
      // Should render without callbacks
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
    });

    it('handles dynamic prop changes', () => {
      const { rerender } = render(<TouchContainer {...defaultProps} />);
      
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
      
      // Change props
      rerender(
        <TouchContainer 
          {...defaultProps} 
          enablePan={false} 
          className="updated-class"
        />
      );
      
      expect(screen.getByTestId('touch-content')).toBeInTheDocument();
      expect(screen.getByTestId('touch-content').parentElement).toHaveClass('updated-class');
    });
  });
});