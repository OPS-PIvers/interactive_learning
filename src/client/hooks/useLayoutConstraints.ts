/**
 * Unified Layout Constraints Hook
 * 
 * Provides safe positioning calculations for modals and overlays to prevent
 * overlap with fixed toolbars and system UI elements across all device types.
 * 
 * Built upon the unified responsive system using useDeviceDetection and useViewportHeight.
 */

import { useMemo } from 'react';
import { Z_INDEX, Z_INDEX_TAILWIND } from '../utils/zIndexLevels';
import { useDeviceDetection } from './useDeviceDetection';
import { useViewportHeight } from './useViewportHeight';

export interface LayoutConstraints {
  // Available space calculations
  viewport: {
    width: number;
    height: number;
    actualHeight: number;
  };
  
  // Safe area boundaries (accounts for toolbars and system UI)
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Modal positioning constraints
  modal: {
    maxWidth: number;
    maxHeight: number;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
  };
  
  // Z-index values for different modal types
  zIndex: {
    backdrop: number;
    content: number;
    tailwindBackdrop: string;
    tailwindContent: string;
  };
  
  // CSS variables for dynamic styling
  cssVariables: Record<string, string>;
  
  // Device-specific flags
  isMobile: boolean;
  layoutMode: 'compact' | 'standard' | 'expanded';
  orientation: 'portrait' | 'landscape';

  // Key UI element dimensions
  toolbarHeight: number;
  headerHeight: number;
}

export interface ModalConstraintOptions {
  type?: 'standard' | 'properties' | 'fullscreen' | 'confirmation';
  position?: 'center' | 'bottom' | 'right' | 'auto';
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  preventToolbarOverlap?: boolean;
  respectKeyboard?: boolean;
}

/**
 * Main hook for calculating layout constraints
 */
export function useLayoutConstraints(options: ModalConstraintOptions = {}): LayoutConstraints {
  const {
    type = 'standard',
    position = 'auto', 
    size = 'medium',
    preventToolbarOverlap = true,
    respectKeyboard = true
  } = options;

  const { deviceType, viewportInfo, isMobile } = useDeviceDetection();
  const { height: viewportHeight, availableHeight } = useViewportHeight();

  // Define key UI element heights for consistent calculations
  const headerHeight = 0; // This should be handled by CSS safe-area-insets
  const toolbarHeight = preventToolbarOverlap ? 64 : 0; // Use a single value

  // Calculate safe area boundaries based on device type and viewport
  const safeArea = useMemo(() => {
    // Base safe area from CSS env() variables or defaults
    const base = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    };

    // The safe area should be determined by CSS env() variables, not device detection.
    // These values can be read from CSS custom properties if needed.

    // Account for toolbar height if overlap prevention is on
    base.bottom += toolbarHeight;

    return base;
  }, [toolbarHeight]);

  // Calculate modal constraints based on safe area
  const modal = useMemo(() => {
    const availableWidth = viewportInfo.width - safeArea.left - safeArea.right;
    const usableHeight = respectKeyboard ? availableHeight : viewportHeight;
    const availableModalHeight = usableHeight - safeArea.top - safeArea.bottom;

    // Size-based constraints
    let maxWidth: number;
    let maxHeight: number;

    if (size === 'fullscreen') {
      maxWidth = availableWidth;
      maxHeight = availableModalHeight;
    } else {
      // Unified sizing, adaptable with CSS
      const widthRatio = 0.9;
      const heightRatio = 0.85;

      switch (size) {
        case 'small':
          maxWidth = Math.min(availableWidth * widthRatio, 400);
          maxHeight = Math.min(availableModalHeight * heightRatio, 300);
          break;
        case 'large':
          maxWidth = Math.min(availableWidth * widthRatio, 800);
          maxHeight = Math.min(availableModalHeight * heightRatio, 600);
          break;
        case 'medium':
        default:
          maxWidth = Math.min(availableWidth * widthRatio, 600);
          maxHeight = Math.min(availableModalHeight * heightRatio, 500);
          break;
      }
    }

    // Unified margin, adaptable with CSS
    const baseMargin = 16;
    
    return {
      maxWidth,
      maxHeight,
      marginTop: safeArea.top + baseMargin,
      marginBottom: safeArea.bottom + baseMargin,
      marginLeft: safeArea.left + baseMargin,
      marginRight: safeArea.right + baseMargin
    };
  }, [viewportInfo, availableHeight, viewportHeight, safeArea, size, respectKeyboard]);

  // Z-index management based on modal type using unified system
  const zIndex = useMemo(() => {
    let backdrop: number;
    let content: number;
    let tailwindBackdrop: string;
    let tailwindContent: string;

    switch (type) {
      case 'properties':
        backdrop = Z_INDEX.MODAL_BACKDROP;
        content = Z_INDEX.PROPERTIES_PANEL;
        tailwindBackdrop = Z_INDEX_TAILWIND.MODAL_BACKDROP;
        tailwindContent = Z_INDEX_TAILWIND.PROPERTIES_PANEL;
        break;
      case 'confirmation':
        backdrop = Z_INDEX.MODAL_BACKDROP;
        content = Z_INDEX.CONFIRMATION_DIALOG;
        tailwindBackdrop = Z_INDEX_TAILWIND.MODAL_BACKDROP;
        tailwindContent = Z_INDEX_TAILWIND.CONFIRMATION_DIALOG;
        break;
      case 'fullscreen':
        backdrop = Z_INDEX.MODAL_BACKDROP;
        content = Z_INDEX.SYSTEM_MODAL;
        tailwindBackdrop = Z_INDEX_TAILWIND.MODAL_BACKDROP;
        tailwindContent = Z_INDEX_TAILWIND.SYSTEM_MODAL;
        break;
      case 'standard':
      default:
        backdrop = Z_INDEX.MODAL_BACKDROP;
        content = Z_INDEX.MODAL_CONTENT;
        tailwindBackdrop = Z_INDEX_TAILWIND.MODAL_BACKDROP;
        tailwindContent = Z_INDEX_TAILWIND.MODAL_CONTENT;
        break;
    }

    return {
      backdrop,
      content,
      tailwindBackdrop,
      tailwindContent,
    };
  }, [type]);

  // Generate CSS variables for consistent styling
  const cssVariables = useMemo(() => ({
    '--layout-safe-top': `${safeArea.top}px`,
    '--layout-safe-bottom': `${safeArea.bottom}px`,
    '--layout-safe-left': `${safeArea.left}px`,
    '--layout-safe-right': `${safeArea.right}px`,
    '--layout-modal-max-width': `${modal.maxWidth}px`,
    '--layout-modal-max-height': `${modal.maxHeight}px`,
    '--layout-modal-margin-top': `${modal.marginTop}px`,
    '--layout-modal-margin-bottom': `${modal.marginBottom}px`,
    '--layout-modal-margin-left': `${modal.marginLeft}px`,
    '--layout-modal-margin-right': `${modal.marginRight}px`,
    '--layout-z-backdrop': `${zIndex.backdrop}`,
    '--layout-z-content': `${zIndex.content}`,
  }), [safeArea, modal, zIndex]);

  return {
    viewport: {
      width: viewportInfo.width,
      height: viewportInfo.height,
      actualHeight: availableHeight,
    },
    safeArea,
    modal,
    zIndex,
    cssVariables,
    isMobile: false, // This should not be used for rendering
    layoutMode: 'standard', // This should be handled by CSS
    orientation: viewportInfo.orientation,
    toolbarHeight,
    headerHeight,
  };
}

/**
 * Specialized hook for modal positioning with automatic constraint application
 */
export function useModalConstraints(options: ModalConstraintOptions = {}) {
  const constraints = useLayoutConstraints(options);
  
  // Generate positioning styles for direct application
  const positioningStyles = useMemo(() => {
    const { position = 'auto' } = options;
    const effectivePosition = position;

    const baseStyles = {
      maxWidth: constraints.modal.maxWidth,
      maxHeight: constraints.modal.maxHeight,
      zIndex: constraints.zIndex.content,
    };

    const backdropStyles = {
      zIndex: constraints.zIndex.backdrop,
    };

    // Position-specific adjustments
    switch (effectivePosition) {
      case 'bottom':
        return {
          backdrop: {
            ...backdropStyles,
            alignItems: 'flex-end',
            paddingBottom: `${constraints.safeArea.bottom}px`,
          },
          content: {
            ...baseStyles,
            marginBottom: constraints.modal.marginBottom,
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem',
            borderBottomLeftRadius: '0',
            borderBottomRightRadius: '0',
          }
        };
      
      case 'right':
        return {
          backdrop: {
            ...backdropStyles,
            justifyContent: 'flex-end',
            paddingRight: `${constraints.safeArea.right}px`,
          },
          content: {
            ...baseStyles,
            marginRight: constraints.modal.marginRight,
            borderTopLeftRadius: '1rem',
            borderBottomLeftRadius: '1rem',
            borderTopRightRadius: '0',
            borderBottomRightRadius: '0',
          }
        };
      
      case 'center':
      default:
        return {
          backdrop: {
            ...backdropStyles,
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${constraints.modal.marginTop}px ${constraints.modal.marginRight}px ${constraints.modal.marginBottom}px ${constraints.modal.marginLeft}px`,
          },
          content: {
            ...baseStyles,
            borderRadius: '0.75rem',
          }
        };
    }
  }, [constraints, options]);

  return {
    constraints,
    styles: positioningStyles,
    tailwindClasses: {
      backdrop: constraints.zIndex.tailwindBackdrop,
      content: constraints.zIndex.tailwindContent,
    }
  };
}

/**
 * Utility hook for components that need to respect layout constraints
 */
export function useConstraintAwareSpacing(options: ModalConstraintOptions = {}) {
  const constraints = useLayoutConstraints(options);
  
  return {
    paddingTop: `var(--layout-safe-top, ${constraints.safeArea.top}px)`,
    paddingBottom: `var(--layout-safe-bottom, ${constraints.safeArea.bottom}px)`,
    paddingLeft: `var(--layout-safe-left, ${constraints.safeArea.left}px)`,
    paddingRight: `var(--layout-safe-right, ${constraints.safeArea.right}px)`,
    variables: constraints.cssVariables,
  };
}