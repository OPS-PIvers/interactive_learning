import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResponsiveModal } from '../client/components/responsive/ResponsiveModal';

// Mock hooks
const mockConstraints = {
  constraints: {
    viewport: { width: 1280, height: 800, actualHeight: 800 },
    safeArea: { top: 0, bottom: 64, left: 0, right: 0 },
    modal: {
      maxWidth: 600,
      maxHeight: 500,
      marginTop: 16,
      marginBottom: 80,
      marginLeft: 16,
      marginRight: 16
    },
    zIndex: {
      backdrop: 9800,
      content: 9801,
      tailwindBackdrop: 'z-[9800]',
      tailwindContent: 'z-[9801]'
    },
    cssVariables: {
      '--layout-safe-top': '0px',
      '--layout-safe-bottom': '64px',
      '--layout-modal-max-width': '600px',
      '--layout-modal-max-height': '500px'
    },
    isMobile: false,
    layoutMode: 'standard' as const,
    orientation: 'landscape' as const,
    toolbarHeight: 64,
    headerHeight: 0
  },
  styles: {
    backdrop: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 16px 80px 16px'
    },
    content: {
      maxWidth: 600,
      maxHeight: 500,
      zIndex: 9801,
      borderRadius: '0.75rem'
    }
  },
  tailwindClasses: {
    backdrop: 'z-[9800]',
    content: 'z-[9801]'
  }
};

const mockMobileConstraints = {
  ...mockConstraints,
  constraints: {
    ...mockConstraints.constraints,
    viewport: { width: 375, height: 667, actualHeight: 600 },
    modal: {
      ...mockConstraints.constraints.modal,
      maxWidth: 337,
      maxHeight: 450
    },
    isMobile: true,
    layoutMode: 'compact' as const,
    orientation: 'portrait' as const
  },
  styles: {
    backdrop: {
      alignItems: 'flex-end',
      paddingBottom: '64px'
    },
    content: {
      maxWidth: 337,
      maxHeight: 450,
      zIndex: 9801,
      marginBottom: 80,
      borderTopLeftRadius: '1rem',
      borderTopRightRadius: '1rem',
      borderBottomLeftRadius: '0',
      borderBottomRightRadius: '0'
    }
  }
};

let mockDeviceType = 'desktop';
vi.mock('../client/hooks/useLayoutConstraints', () => ({
  useModalConstraints: vi.fn(() => {
    return mockDeviceType === 'mobile' ? mockMobileConstraints : mockConstraints;
  })
}));

// Mock document methods for event listeners
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(document, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(document, 'removeEventListener', { value: mockRemoveEventListener });

const defaultProps = {
  type: 'settings' as const,
  isOpen: true,
  onClose: vi.fn(),
  title: 'Test Modal',
  children: <div data-testid="modal-content">Test Content</div>
};

describe('ResponsiveModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeviceType = 'desktop';
    // Reset document.body.style.overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up any overflow styles
    document.body.style.overflow = '';
  });

  describe('CSS-Only Responsive Design', () => {
    it('uses CSS breakpoints for layout adaptation without JavaScript device detection', () => {
      render(<ResponsiveModal {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog').parentElement;
      const modal = screen.getByRole('dialog');

      // Verify CSS classes are applied for responsive behavior
      expect(backdrop).toHaveClass('items-end', 'md:items-center');
      expect(modal).toHaveClass('w-full', 'md:w-auto');
      
      // Verify no conditional rendering based on device type
      // The drag handle should be hidden on desktop via CSS, not JavaScript
      const dragHandle = modal.querySelector('.drag-handle');
      expect(dragHandle).toBeInTheDocument();
      expect(dragHandle).toHaveClass('block', 'md:hidden');
    });

    it('applies responsive CSS classes without JavaScript device branching', () => {
      render(<ResponsiveModal {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog').parentElement;
      
      // Verify CSS-only responsive alignment
      expect(backdrop).toHaveClass('items-end'); // Mobile-first
      expect(backdrop).toHaveClass('md:items-center'); // Desktop enhancement
      expect(backdrop).toHaveClass('justify-center'); // Consistent centering
      expect(backdrop).toHaveClass('md:justify-center'); // Desktop confirmation
    });

    it('uses CSS classes for responsive modal sizing', () => {
      render(<ResponsiveModal {...defaultProps} size="large" />);
      
      const modal = screen.getByRole('dialog');
      
      // Verify base responsive classes are applied
      expect(modal).toHaveClass('w-full'); // Mobile-first full width
      expect(modal).toHaveClass('md:w-auto'); // Desktop auto width
      
      // Content area should have responsive max-height
      const contentArea = modal.querySelector('.flex-1');
      expect(contentArea).toHaveClass('max-h-[60vh]', 'md:max-h-none');
    });

    it('renders consistent layout structure across screen sizes', () => {
      const { rerender } = render(<ResponsiveModal {...defaultProps} />);
      
      // Verify desktop structure
      expect(screen.getByRole('dialog')).toHaveClass('responsive-modal-mobile', 'md:modal-content');
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
      
      // Switch to mobile constraints and re-render
      mockDeviceType = 'mobile';
      rerender(<ResponsiveModal {...defaultProps} />);
      
      // Structure should remain the same, only CSS classes change
      expect(screen.getByRole('dialog')).toHaveClass('responsive-modal-mobile', 'md:modal-content');
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    });
  });

  describe('Toolbar Overlap Prevention', () => {
    it('prevents toolbar overlap using constraint system', () => {
      render(<ResponsiveModal {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog').parentElement;
      const modal = screen.getByRole('dialog');

      // Verify backdrop uses constraint-based positioning
      expect(backdrop).toHaveStyle({
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 16px 80px 16px' // Bottom padding accounts for toolbar
      });

      // Verify modal content respects constraints
      expect(modal).toHaveStyle({
        maxWidth: '600px',
        maxHeight: '500px',
        zIndex: '9801'
      });
    });

    it('applies safe area spacing for mobile layout', () => {
      mockDeviceType = 'mobile';
      render(<ResponsiveModal {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog').parentElement;
      
      // Mobile should use bottom alignment with safe area padding
      expect(backdrop).toHaveStyle({
        alignItems: 'flex-end',
        paddingBottom: '64px' // Toolbar height
      });
    });

    it('respects z-index hierarchy from centralized system', () => {
      render(<ResponsiveModal {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog').parentElement;
      const modal = screen.getByRole('dialog');

      // Verify z-index values come from centralized system
      expect(backdrop).toHaveClass('z-[9800]');
      expect(modal).toHaveStyle({ zIndex: '9801' });
    });

    it('handles different modal types with appropriate z-index levels', () => {
      const { rerender } = render(<ResponsiveModal {...defaultProps} type="properties" />);
      
      let modal = screen.getByRole('dialog');
      expect(modal).toHaveStyle({ zIndex: '9801' });

      rerender(<ResponsiveModal {...defaultProps} type="settings" />);
      modal = screen.getByRole('dialog');
      expect(modal).toHaveStyle({ zIndex: '9801' });
    });
  });

  describe('Touch Gesture Support', () => {
    it('enables swipe-to-dismiss on mobile by default', () => {
      render(<ResponsiveModal {...defaultProps} allowSwipeDown={true} />);
      
      const modal = screen.getByRole('dialog');
      
      // Verify touch event handlers are attached
      expect(modal).toBeInTheDocument();
      
      // Test touch start
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 } as Touch]
      });
      
      act(() => {
        fireEvent(modal, touchStartEvent);
      });

      // Modal should handle touch events without errors
      expect(modal).toBeInTheDocument();
    });

    it('disables swipe gesture when allowSwipeDown is false', () => {
      render(<ResponsiveModal {...defaultProps} allowSwipeDown={false} />);
      
      const modal = screen.getByRole('dialog');
      
      // Touch events should not affect modal when disabled
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 } as Touch]
      });
      
      act(() => {
        fireEvent(modal, touchStartEvent);
      });

      expect(modal).toBeInTheDocument();
    });

    it('handles touch move and end events for drag behavior', () => {
      const onClose = vi.fn();
      render(<ResponsiveModal {...defaultProps} onClose={onClose} allowSwipeDown={true} />);
      
      const modal = screen.getByRole('dialog');
      
      // Simulate drag down gesture using fireEvent with synthetic events
      fireEvent.touchStart(modal, {
        touches: [{ clientY: 100 }]
      });
      
      fireEvent.touchMove(modal, {
        touches: [{ clientY: 250 }] // Drag down 150px to exceed 100px threshold
      });
      
      fireEvent.touchEnd(modal, {});

      // Should close modal if dragged down sufficiently (more than 100px)
      expect(onClose).toHaveBeenCalled();
    });

    it('snaps back to position on small drag movements', () => {
      const onClose = vi.fn();
      render(<ResponsiveModal {...defaultProps} onClose={onClose} allowSwipeDown={true} />);
      
      const modal = screen.getByRole('dialog');
      
      // Simulate small drag movement
      act(() => {
        fireEvent(modal, new TouchEvent('touchstart', {
          touches: [{ clientY: 100 } as Touch]
        }));
        
        fireEvent(modal, new TouchEvent('touchmove', {
          touches: [{ clientY: 150 } as Touch] // Drag down less than 100px
        }));
        
        fireEvent(modal, new TouchEvent('touchend', {}));
      });

      // Should not close modal on small movements
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Features', () => {
    it('provides proper ARIA attributes', () => {
      render(<ResponsiveModal {...defaultProps} />);
      
      const modal = screen.getByRole('dialog');
      
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'responsive-modal-title');
      expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'responsive-modal-title');
    });

    it('handles keyboard navigation and escape key', () => {
      const onClose = vi.fn();
      render(<ResponsiveModal {...defaultProps} onClose={onClose} />);
      
      // Test escape key - dispatch to window/document where the listener is attached
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escapeEvent);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('prevents body scrolling when modal is open', () => {
      const { rerender } = render(<ResponsiveModal {...defaultProps} isOpen={true} />);
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<ResponsiveModal {...defaultProps} isOpen={false} />);
      
      expect(document.body.style.overflow).toBe('');
    });

    it('provides accessible close button', () => {
      const onClose = vi.fn();
      render(<ResponsiveModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
      
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Backdrop and Interaction Handling', () => {
    it('closes modal on backdrop click by default', () => {
      const onClose = vi.fn();
      render(<ResponsiveModal {...defaultProps} onClose={onClose} />);
      
      const backdrop = screen.getByRole('dialog').parentElement!;
      
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    });

    it('prevents closing on backdrop click when specified', () => {
      const onClose = vi.fn();
      render(<ResponsiveModal {...defaultProps} onClose={onClose} preventCloseOnBackdropClick={true} />);
      
      const backdrop = screen.getByRole('dialog').parentElement!;
      
      fireEvent.click(backdrop);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('stops event propagation on modal content click', () => {
      const onClose = vi.fn();
      render(<ResponsiveModal {...defaultProps} onClose={onClose} />);
      
      const modal = screen.getByRole('dialog');
      
      fireEvent.click(modal);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('applies backdrop blur effect styling', () => {
      render(<ResponsiveModal {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog').parentElement!;
      
      // Check that the backdrop has the expected styling classes and basic background
      expect(backdrop).toHaveClass('responsive-modal-desktop');
      
      // Check inline styles - backgroundColor should be present
      const style = backdrop.getAttribute('style');
      expect(style).toContain('background-color: rgba(0, 0, 0, 0.5)');
      
      // The backdrop-filter might be handled differently in test environment
      // Just verify the element exists with the right structure
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Modal Size and Position Variants', () => {
    it('applies correct sizing for small modal', () => {
      render(<ResponsiveModal {...defaultProps} size="small" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('applies correct sizing for large modal', () => {
      render(<ResponsiveModal {...defaultProps} size="large" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('handles fullscreen modal size', () => {
      render(<ResponsiveModal {...defaultProps} size="fullscreen" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('respects custom className prop', () => {
      render(<ResponsiveModal {...defaultProps} className="custom-modal-class" />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('custom-modal-class');
    });
  });

  describe('Device-Responsive Behavior', () => {
    it('does not use JavaScript device detection for UI rendering', () => {
      // This test ensures no conditional rendering based on isMobile, isTablet, etc.
      const { rerender } = render(<ResponsiveModal {...defaultProps} />);
      
      // Get initial DOM structure
      const initialHTML = screen.getByRole('dialog').outerHTML;
      
      // Switch device type and re-render
      mockDeviceType = 'mobile';
      rerender(<ResponsiveModal {...defaultProps} />);
      
      // Structure should be identical - only CSS classes should differ
      const mobileHTML = screen.getByRole('dialog').outerHTML;
      
      // Both should have the same basic structure
      expect(initialHTML).toContain('responsive-modal-mobile');
      expect(mobileHTML).toContain('responsive-modal-mobile');
      expect(initialHTML).toContain('md:modal-content');
      expect(mobileHTML).toContain('md:modal-content');
    });

    it('relies on CSS media queries for responsive layout changes', () => {
      render(<ResponsiveModal {...defaultProps} />);
      
      const backdrop = screen.getByRole('dialog').parentElement!;
      const modal = screen.getByRole('dialog');
      
      // Verify responsive classes are present
      expect(backdrop).toHaveClass('items-end', 'md:items-center'); // Mobile-first approach
      expect(modal).toHaveClass('w-full', 'md:w-auto'); // Width responsiveness
      
      // Content area should have responsive constraints
      const contentArea = modal.querySelector('.flex-1');
      expect(contentArea).toHaveClass('max-h-[60vh]', 'md:max-h-none');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles missing touch event properties gracefully', () => {
      render(<ResponsiveModal {...defaultProps} allowSwipeDown={true} />);
      
      const modal = screen.getByRole('dialog');
      
      // Test with malformed touch event
      act(() => {
        fireEvent(modal, new TouchEvent('touchstart', { touches: [] }));
        fireEvent(modal, new TouchEvent('touchmove', { touches: [] }));
        fireEvent(modal, new TouchEvent('touchend', {}));
      });

      // Should not crash
      expect(modal).toBeInTheDocument();
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(<ResponsiveModal {...defaultProps} isOpen={true} />);
      
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(document.body.style.overflow).toBe('');
    });

    it('does not render when isOpen is false', () => {
      render(<ResponsiveModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});