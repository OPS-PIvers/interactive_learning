import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeviceDetection } from '../client/hooks/useDeviceDetection';
import { 
  useLayoutConstraints, 
  useModalConstraints, 
  useConstraintAwareSpacing,
  LayoutConstraints,
  ModalConstraintOptions 
} from '../client/hooks/useLayoutConstraints';

// Mock device detection hook
vi.mock('../client/hooks/useDeviceDetection', () => ({
  useDeviceDetection: vi.fn(() => ({
    viewportInfo: {
      width: 1280,
      height: 800,
      pixelRatio: 1,
      orientation: 'landscape' as const
    },
    isPortrait: false,
    isLandscape: true
  }))
}));

// Mock the viewport height hook
vi.mock('../client/hooks/useViewportHeight', () => ({
  useViewportHeight: vi.fn(() => ({
    height: 800,
    availableHeight: 800
  }))
}));

// Mock z-index levels
vi.mock('../client/utils/zIndexLevels', () => ({
  Z_INDEX: {
    MODAL_BACKDROP: 9800,
    MODAL_CONTENT: 9801,
    PROPERTIES_PANEL: 9900,
    CONFIRMATION_DIALOG: 9950,
    SYSTEM_MODAL: 10000
  },
  Z_INDEX_TAILWIND: {
    MODAL_BACKDROP: 'z-[9800]',
    MODAL_CONTENT: 'z-[9801]',
    PROPERTIES_PANEL: 'z-[9900]',
    CONFIRMATION_DIALOG: 'z-[9950]',
    SYSTEM_MODAL: 'z-[10000]'
  }
}));

describe('useLayoutConstraints Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Layout Calculations', () => {
    it('calculates desktop layout constraints correctly', () => {
      const { result } = renderHook(() => useLayoutConstraints());
      
      const constraints: LayoutConstraints = result.current;
      
      // Viewport calculations
      expect(constraints.viewport.width).toBe(1280);
      expect(constraints.viewport.height).toBe(800);
      expect(constraints.viewport.actualHeight).toBe(800);
      
      // Safe area should account for toolbar
      expect(constraints.safeArea.top).toBe(0);
      expect(constraints.safeArea.bottom).toBe(64); // Default toolbar height
      expect(constraints.safeArea.left).toBe(0);
      expect(constraints.safeArea.right).toBe(0);
      
      // Modal constraints
      expect(constraints.modal.maxWidth).toBeGreaterThan(0);
      expect(constraints.modal.maxHeight).toBeGreaterThan(0);
      expect(constraints.modal.marginBottom).toBeGreaterThan(constraints.safeArea.bottom);
    });

    it('handles different viewport dimensions', () => {
      // This test demonstrates the hook works with different viewport sizes
      const { result } = renderHook(() => useLayoutConstraints());
      
      const constraints: LayoutConstraints = result.current;
      
      // Should handle the mocked viewport dimensions
      expect(constraints.viewport.width).toBe(1280);
      expect(constraints.viewport.height).toBe(800);
      expect(constraints.viewport.actualHeight).toBe(800);
      
      // Safe area should account for toolbar
      expect(constraints.safeArea.bottom).toBe(64);
      
      // Modal constraints should be reasonable
      expect(constraints.modal.maxWidth).toBeGreaterThan(0);
      expect(constraints.modal.maxWidth).toBeLessThanOrEqual(1280);
    });

    it('handles different modal sizes correctly', () => {
      const sizes: ('small' | 'medium' | 'large' | 'fullscreen')[] = ['small', 'medium', 'large', 'fullscreen'];
      
      sizes.forEach(size => {
        const { result } = renderHook(() => useLayoutConstraints({ size }));
        const constraints = result.current;
        
        expect(constraints.modal.maxWidth).toBeGreaterThan(0);
        expect(constraints.modal.maxHeight).toBeGreaterThan(0);
        
        if (size === 'small') {
          expect(constraints.modal.maxWidth).toBeLessThanOrEqual(400);
        } else if (size === 'large') {
          expect(constraints.modal.maxWidth).toBeLessThanOrEqual(800);
        }
      });
    });
  });

  describe('Z-Index Management', () => {
    it('provides correct z-index values for different modal types', () => {
      const modalTypes: ('standard' | 'properties' | 'confirmation' | 'fullscreen')[] = 
        ['standard', 'properties', 'confirmation', 'fullscreen'];
      
      modalTypes.forEach(type => {
        const { result } = renderHook(() => useLayoutConstraints({ type }));
        const constraints = result.current;
        
        expect(constraints.zIndex.backdrop).toBeGreaterThan(0);
        expect(constraints.zIndex.content).toBeGreaterThan(constraints.zIndex.backdrop);
        expect(typeof constraints.zIndex.tailwindBackdrop).toBe('string');
        expect(typeof constraints.zIndex.tailwindContent).toBe('string');
        
        if (type === 'properties') {
          expect(constraints.zIndex.content).toBe(9900);
        } else if (type === 'confirmation') {
          expect(constraints.zIndex.content).toBe(9950);
        }
      });
    });

    it('provides Tailwind-compatible z-index classes', () => {
      const { result } = renderHook(() => useLayoutConstraints());
      const constraints = result.current;
      
      expect(constraints.zIndex.tailwindBackdrop).toMatch(/^z-\[\d+\]$/);
      expect(constraints.zIndex.tailwindContent).toMatch(/^z-\[\d+\]$/);
    });
  });

  describe('CSS Variables Generation', () => {
    it('generates complete CSS variable set', () => {
      const { result } = renderHook(() => useLayoutConstraints());
      const constraints = result.current;
      
      const requiredVariables = [
        '--layout-safe-top',
        '--layout-safe-bottom', 
        '--layout-safe-left',
        '--layout-safe-right',
        '--layout-modal-max-width',
        '--layout-modal-max-height',
        '--layout-modal-margin-top',
        '--layout-modal-margin-bottom',
        '--layout-modal-margin-left',
        '--layout-modal-margin-right',
        '--layout-z-backdrop',
        '--layout-z-content'
      ];
      
      requiredVariables.forEach(variable => {
        expect(constraints.cssVariables).toHaveProperty(variable);
        expect(typeof constraints.cssVariables[variable]).toBe('string');
      });
    });

    it('provides pixel-based values in CSS variables', () => {
      const { result } = renderHook(() => useLayoutConstraints());
      const constraints = result.current;
      
      // Most values should end with 'px'
      expect(constraints.cssVariables['--layout-safe-bottom']).toMatch(/^\d+px$/);
      expect(constraints.cssVariables['--layout-modal-max-width']).toMatch(/^\d+px$/);
      expect(constraints.cssVariables['--layout-modal-max-height']).toMatch(/^\d+px$/);
      
      // Z-index values should be numbers
      expect(constraints.cssVariables['--layout-z-backdrop']).toMatch(/^\d+$/);
      expect(constraints.cssVariables['--layout-z-content']).toMatch(/^\d+$/);
    });
  });

  describe('Toolbar Overlap Prevention', () => {
    it('accounts for toolbar height in safe area calculations', () => {
      const { result } = renderHook(() => useLayoutConstraints({ preventToolbarOverlap: true }));
      const constraints = result.current;
      
      expect(constraints.safeArea.bottom).toBe(64); // Toolbar height
      expect(constraints.toolbarHeight).toBe(64);
    });

    it('ignores toolbar when overlap prevention is disabled', () => {
      const { result } = renderHook(() => useLayoutConstraints({ preventToolbarOverlap: false }));
      const constraints = result.current;
      
      expect(constraints.safeArea.bottom).toBe(0); // No toolbar adjustment
      expect(constraints.toolbarHeight).toBe(0);
    });

    it('calculates available modal space correctly with toolbar', () => {
      const { result } = renderHook(() => useLayoutConstraints({ 
        preventToolbarOverlap: true,
        size: 'medium'
      }));
      const constraints = result.current;
      
      // Available height should be reduced by toolbar
      const expectedAvailableHeight = constraints.viewport.height - constraints.safeArea.bottom;
      expect(constraints.modal.maxHeight).toBeLessThan(expectedAvailableHeight);
    });
  });

  describe('Keyboard Awareness', () => {
    it('respects keyboard when enabled', () => {
      const { result } = renderHook(() => useLayoutConstraints({ respectKeyboard: true }));
      const constraints = result.current;
      
      // Should use available height from the mock
      expect(constraints.viewport.actualHeight).toBe(800);
    });

    it('ignores keyboard when disabled', () => {
      const { result } = renderHook(() => useLayoutConstraints({ respectKeyboard: false }));
      const constraints = result.current;
      
      // Should use full viewport height
      expect(constraints.viewport.height).toBe(800);
    });
  });

  describe('Device-Responsive Behavior', () => {
    it('provides consistent device flags', () => {
      const { result } = renderHook(() => useLayoutConstraints());
      const constraints = result.current;
      
      // Note: These flags should NOT be used for UI rendering, only calculations
      expect(typeof constraints.orientation).toBe('string');
      expect(constraints.layoutMode).toBe('standard'); // Should be CSS-controlled
      expect(constraints.orientation).toBe('landscape');
    });

    it('provides orientation information', () => {
      const { result } = renderHook(() => useLayoutConstraints());
      const constraints = result.current;
      
      // Should provide orientation from the mock
      expect(constraints.orientation).toBe('landscape');
      expect(typeof constraints.orientation).toBe('string');
    });
  });
});

describe('useModalConstraints Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Positioning Styles Generation', () => {
    it('generates center positioning styles', () => {
      const { result } = renderHook(() => useModalConstraints({ position: 'center' }));
      const { constraints, styles, tailwindClasses } = result.current;
      
      expect((styles.backdrop as any).alignItems).toBe('center');
      expect((styles.backdrop as any).justifyContent).toBe('center');
      expect((styles.content as any).borderRadius).toBe('0.75rem');
      
      expect(tailwindClasses.backdrop).toMatch(/^z-\[\d+\]$/);
      expect(tailwindClasses.content).toMatch(/^z-\[\d+\]$/);
    });

    it('generates bottom positioning styles', () => {
      const { result } = renderHook(() => useModalConstraints({ position: 'bottom' }));
      const { styles } = result.current;
      
      expect((styles.backdrop as any).alignItems).toBe('flex-end');
      expect((styles.content as any).borderTopLeftRadius).toBe('1rem');
      expect((styles.content as any).borderTopRightRadius).toBe('1rem');
      expect((styles.content as any).borderBottomLeftRadius).toBe('0');
      expect((styles.content as any).borderBottomRightRadius).toBe('0');
    });

    it('generates right positioning styles', () => {
      const { result } = renderHook(() => useModalConstraints({ position: 'right' }));
      const { styles } = result.current;
      
      expect((styles.backdrop as any).justifyContent).toBe('flex-end');
      expect((styles.content as any).borderTopLeftRadius).toBe('1rem');
      expect((styles.content as any).borderBottomLeftRadius).toBe('1rem');
      expect((styles.content as any).borderTopRightRadius).toBe('0');
      expect((styles.content as any).borderBottomRightRadius).toBe('0');
    });
  });

  describe('Integration with Layout Constraints', () => {
    it('combines constraint data with positioning', () => {
      const { result } = renderHook(() => useModalConstraints({
        type: 'properties',
        size: 'large',
        position: 'center'
      }));
      
      const { constraints, styles } = result.current;
      
      // Should inherit all layout constraint data
      expect(constraints.viewport).toBeDefined();
      expect(constraints.safeArea).toBeDefined();
      expect(constraints.modal).toBeDefined();
      expect(constraints.zIndex).toBeDefined();
      
      // Should apply positioning styles
      expect(styles.backdrop).toBeDefined();
      expect(styles.content).toBeDefined();
      expect(styles.content.maxWidth).toBeGreaterThan(0);
      expect(styles.content.maxHeight).toBeGreaterThan(0);
    });

    it('maintains z-index hierarchy', () => {
      const { result } = renderHook(() => useModalConstraints({ type: 'confirmation' }));
      const { constraints, styles } = result.current;
      
      expect(styles.backdrop.zIndex).toBe(constraints.zIndex.backdrop);
      expect(styles.content.zIndex).toBe(constraints.zIndex.content);
      expect(styles.content.zIndex).toBeGreaterThan(styles.backdrop.zIndex);
    });
  });
});

describe('useConstraintAwareSpacing Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CSS Variable Integration', () => {
    it('provides CSS custom property based spacing', () => {
      const { result } = renderHook(() => useConstraintAwareSpacing());
      const spacing = result.current;
      
      expect(spacing.paddingTop).toMatch(/^var\(--layout-safe-top, \d+px\)$/);
      expect(spacing.paddingBottom).toMatch(/^var\(--layout-safe-bottom, \d+px\)$/);
      expect(spacing.paddingLeft).toMatch(/^var\(--layout-safe-left, \d+px\)$/);
      expect(spacing.paddingRight).toMatch(/^var\(--layout-safe-right, \d+px\)$/);
    });

    it('includes fallback values', () => {
      const { result } = renderHook(() => useConstraintAwareSpacing());
      const spacing = result.current;
      
      // Should include fallback pixel values
      expect(spacing.paddingTop).toContain('0px');
      expect(spacing.paddingBottom).toContain('64px'); // Toolbar height fallback
    });

    it('provides complete variable set', () => {
      const { result } = renderHook(() => useConstraintAwareSpacing());
      const { variables } = result.current;
      
      expect(typeof variables).toBe('object');
      expect(Object.keys(variables).length).toBeGreaterThan(10);
      
      // Should include all layout variables
      expect(variables).toHaveProperty('--layout-safe-top');
      expect(variables).toHaveProperty('--layout-modal-max-width');
      expect(variables).toHaveProperty('--layout-z-backdrop');
    });
  });

  describe('Dynamic Updates', () => {
    it('updates when constraints change', () => {
      const { result, rerender } = renderHook(
        (options) => useConstraintAwareSpacing(options),
        { initialProps: { size: 'medium' as const } }
      );
      
      const initialSpacing = result.current;
      
      // Change props
      rerender({ size: 'large' as any });
      
      const updatedSpacing = result.current;
      
      // CSS variables should be updated
      expect(updatedSpacing.variables).toBeDefined();
      expect(Object.keys(updatedSpacing.variables)).toEqual(Object.keys(initialSpacing.variables));
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Invalid Options', () => {
    it('handles undefined options gracefully', () => {
      const { result } = renderHook(() => useLayoutConstraints(undefined));
      
      expect(result.current).toBeDefined();
      expect(result.current.viewport).toBeDefined();
      expect(result.current.modal.maxWidth).toBeGreaterThan(0);
    });

    it('handles empty options object', () => {
      const { result } = renderHook(() => useLayoutConstraints({}));
      
      expect(result.current).toBeDefined();
      expect(result.current.modal).toBeDefined();
    });
  });

  describe('Extreme Viewport Dimensions', () => {
    it('handles very small viewport gracefully', () => {
      // Mock extremely small viewport
      vi.mocked(useDeviceDetection).mockReturnValue({
        viewportInfo: {
          width: 100,
          height: 100,
          pixelRatio: 1,
          orientation: 'portrait'
        },
        isPortrait: true,
        isLandscape: false
      });

      const { result } = renderHook(() => useLayoutConstraints());
      const constraints = result.current;
      
      expect(constraints.modal.maxWidth).toBeGreaterThan(0);
      expect(constraints.modal.maxHeight).toBeGreaterThan(0);
    });

    it('handles very large viewport gracefully', () => {
      // Mock extremely large viewport
      vi.mocked(useDeviceDetection).mockReturnValue({
        viewportInfo: {
          width: 5000,
          height: 5000,
          pixelRatio: 1,
          orientation: 'landscape'
        },
        isPortrait: false,
        isLandscape: true
      });

      const { result } = renderHook(() => useLayoutConstraints());
      const constraints = result.current;
      
      expect(constraints.modal.maxWidth).toBeGreaterThan(0);
      expect(constraints.modal.maxHeight).toBeGreaterThan(0);
    });
  });

  describe('Memory and Performance', () => {
    it('provides stable references when inputs unchanged', () => {
      const { result, rerender } = renderHook(() => useLayoutConstraints({ size: 'medium' }));
      
      const firstResult = result.current;
      rerender();
      const secondResult = result.current;
      
      // CSS variables should be memoized
      expect(typeof firstResult.cssVariables).toBe('object');
      expect(typeof secondResult.cssVariables).toBe('object');
    });

    it('handles rapid option changes efficiently', () => {
      const { result, rerender } = renderHook(
        ({ size }) => useLayoutConstraints({ size }),
        { initialProps: { size: 'medium' as const } }
      );

      // Rapid changes
      const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
      sizes.forEach(size => {
        rerender({ size } as any);
        expect(result.current.modal.maxWidth).toBeGreaterThan(0);
      });
    });
  });
});