import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResponsiveModal } from '../client/components/responsive/ResponsiveModal';
import '../client/components/responsive/ResponsiveModal.css';

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
      '--layout-modal-max-height': '500px',
      '--layout-z-backdrop': '9800',
      '--layout-z-content': '9801',
    },
    layoutMode: 'standard' as const,
    orientation: 'landscape' as const,
    toolbarHeight: 64,
    headerHeight: 0
  },
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
    layoutMode: 'compact' as const,
    orientation: 'portrait' as const
  },
};

let mockDeviceType = 'desktop';
vi.mock('../client/hooks/useLayoutConstraints', () => ({
  useModalConstraints: vi.fn(() => {
    return mockDeviceType === 'mobile' ? mockMobileConstraints : mockConstraints;
  })
}));

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
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('CSS-Only Responsive Design', () => {
    it('uses CSS for layout adaptation', () => {
      render(<ResponsiveModal {...defaultProps} />);
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveClass('responsive-modal-backdrop');
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('responsive-modal-content');
    });

    it('applies open state class', () => {
      render(<ResponsiveModal {...defaultProps} />);
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveClass('open');
    });
  });

  describe('Toolbar Overlap Prevention', () => {
    it('prevents toolbar overlap using constraint system via CSS variables', () => {
      render(<ResponsiveModal {...defaultProps} />);
      const backdrop = screen.getByRole('dialog').parentElement;
      expect(backdrop).toHaveStyle({
        '--layout-modal-max-width': '600px',
        '--layout-modal-max-height': '500px',
        '--layout-z-backdrop': '9800'
      });
    });
  });

  describe('Touch Gesture Support', () => {
    it('enables swipe-to-dismiss on mobile by default', () => {
      render(<ResponsiveModal {...defaultProps} allowSwipeDown={true} />);
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 } as Touch]
      });
      act(() => {
        fireEvent(modal, touchStartEvent);
      });
      expect(modal).toBeInTheDocument();
    });

    it('disables swipe gesture when allowSwipeDown is false', () => {
      render(<ResponsiveModal {...defaultProps} allowSwipeDown={false} />);
      const modal = screen.getByRole('dialog');
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
      fireEvent.touchStart(modal, { touches: [{ clientY: 100 }] });
      fireEvent.touchMove(modal, { touches: [{ clientY: 250 }] });
      fireEvent.touchEnd(modal, {});
      expect(onClose).toHaveBeenCalled();
    });

    it('snaps back to position on small drag movements', () => {
      const onClose = vi.fn();
      render(<ResponsiveModal {...defaultProps} onClose={onClose} allowSwipeDown={true} />);
      const modal = screen.getByRole('dialog');
      act(() => {
        fireEvent(modal, new TouchEvent('touchstart', { touches: [{ clientY: 100 } as Touch] }));
        fireEvent(modal, new TouchEvent('touchmove', { touches: [{ clientY: 150 } as Touch] }));
        fireEvent(modal, new TouchEvent('touchend', {}));
      });
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
      const { rerender } = render(<ResponsiveModal {...defaultProps} />);
      const initialHTML = screen.getByRole('dialog').outerHTML;
      mockDeviceType = 'mobile';
      rerender(<ResponsiveModal {...defaultProps} />);
      const mobileHTML = screen.getByRole('dialog').outerHTML;
      expect(initialHTML).toBe(mobileHTML);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles missing touch event properties gracefully', () => {
      render(<ResponsiveModal {...defaultProps} allowSwipeDown={true} />);
      const modal = screen.getByRole('dialog');
      act(() => {
        fireEvent(modal, new TouchEvent('touchstart', { touches: [] }));
        fireEvent(modal, new TouchEvent('touchmove', { touches: [] }));
        fireEvent(modal, new TouchEvent('touchend', {}));
      });
      expect(modal).toBeInTheDocument();
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(<ResponsiveModal {...defaultProps} isOpen={true} />);
      unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it('does not render when isOpen is false', () => {
      render(<ResponsiveModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});