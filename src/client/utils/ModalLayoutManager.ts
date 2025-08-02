/**
 * Modal Layout Manager
 * 
 * Centralized utility class for managing modal positioning, constraints,
 * and z-index coordination across the application. Provides consistent
 * modal behavior and prevents toolbar overlap issues.
 */

import { Z_INDEX, Z_INDEX_TAILWIND } from './zIndexLevels';

export interface ModalDimensions {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
}

export interface ModalPosition {
  x: number;
  y: number;
  anchor: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface ModalConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export interface LayoutBoundaries {
  viewport: {
    width: number;
    height: number;
  };
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  toolbar: {
    height: number;
    position: 'top' | 'bottom' | 'none';
  };
  available: {
    width: number;
    height: number;
  };
}

export type ModalType = 'standard' | 'properties' | 'confirmation' | 'fullscreen' | 'drawer';
export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen' | 'auto';
export type ModalPlacement = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface ModalConfig {
  type: ModalType;
  size: ModalSize;
  placement: ModalPlacement;
  allowResize?: boolean;
  preventOverlap?: boolean;
  respectKeyboard?: boolean;
  isMobile?: boolean;
}

/**
 * Modal Layout Manager Class
 * 
 * Handles all modal positioning, sizing, and constraint calculations
 * with device-aware responsive behavior.
 */
export class ModalLayoutManager {
  private boundaries: LayoutBoundaries;
  private config: ModalConfig;

  constructor(boundaries: LayoutBoundaries, config: ModalConfig) {
    this.boundaries = boundaries;
    this.config = config;
  }

  /**
   * Calculate optimal modal constraints based on configuration
   */
  calculateConstraints(): ModalConstraints {
    const { available, safeArea, toolbar } = this.boundaries;
    const { size, placement, isMobile, preventOverlap } = this.config;

    // Base constraints from available space
    let maxWidth = available.width;
    let maxHeight = available.height;
    
    // Apply toolbar constraints if preventing overlap
    if (preventOverlap && toolbar.height > 0) {
      if (toolbar.position === 'bottom') {
        maxHeight -= toolbar.height;
      } else if (toolbar.position === 'top') {
        maxHeight -= toolbar.height;
      }
    }

    // Size-based adjustments
    const sizeMultipliers = this.getSizeMultipliers(size, isMobile);
    maxWidth = Math.floor(maxWidth * sizeMultipliers.width);
    maxHeight = Math.floor(maxHeight * sizeMultipliers.height);

    // Minimum constraints
    const minWidth = isMobile ? 280 : 320;
    const minHeight = isMobile ? 200 : 240;

    // Calculate margins based on placement and safe areas
    const margins = this.calculateMargins(placement, safeArea, isMobile);

    return {
      minWidth,
      maxWidth: Math.max(minWidth, maxWidth),
      minHeight,
      maxHeight: Math.max(minHeight, maxHeight),
      ...margins
    };
  }

  /**
   * Calculate optimal modal position within constraints
   */
  calculatePosition(dimensions: ModalDimensions): ModalPosition {
    const { placement, isMobile } = this.config;
    const { available, safeArea } = this.boundaries;

    const effectivePlacement = placement === 'auto' 
      ? this.getAutoPlacement(isMobile) 
      : placement;

    switch (effectivePlacement) {
      case 'center':
        return {
          x: (available.width - dimensions.width) / 2,
          y: (available.height - dimensions.height) / 2,
          anchor: 'center'
        };

      case 'top':
        return {
          x: (available.width - dimensions.width) / 2,
          y: safeArea.top + 20,
          anchor: 'top-left'
        };

      case 'bottom':
        return {
          x: (available.width - dimensions.width) / 2,
          y: available.height - dimensions.height - safeArea.bottom - 20,
          anchor: 'top-left'
        };

      case 'left':
        return {
          x: safeArea.left + 20,
          y: (available.height - dimensions.height) / 2,
          anchor: 'top-left'
        };

      case 'right':
        return {
          x: available.width - dimensions.width - safeArea.right - 20,
          y: (available.height - dimensions.height) / 2,
          anchor: 'top-left'
        };

      default:
        return this.calculatePosition({ ...dimensions }); // Fallback to center
    }
  }

  /**
   * Get appropriate z-index values for modal type and device
   */
  getZIndexValues(): { backdrop: number; content: number; tailwind: { backdrop: string; content: string } } {
    const { type, isMobile } = this.config;

    let backdrop: number;
    let content: number;

    switch (type) {
      case 'properties':
        backdrop = Z_INDEX.MODAL_BACKDROP;
        content = Z_INDEX.PROPERTIES_PANEL;
        break;

      case 'confirmation':
        backdrop = Z_INDEX.MODAL_BACKDROP;
        content = Z_INDEX.CONFIRMATION_DIALOG;
        break;

      case 'fullscreen':
        backdrop = Z_INDEX.MODAL_BACKDROP;
        content = Z_INDEX.SYSTEM_MODAL;
        break;

      case 'drawer':
        backdrop = Z_INDEX.MODAL_BACKDROP;
        content = Z_INDEX.MODAL_CONTENT;
        break;

      case 'standard':
      default:
        backdrop = Z_INDEX.MODAL_BACKDROP;
        content = Z_INDEX.MODAL_CONTENT;
        break;
    }

    return {
      backdrop,
      content,
      tailwind: {
        backdrop: `z-[${backdrop}]`,
        content: `z-[${content}]`
      }
    };
  }

  /**
   * Generate CSS styles for modal positioning
   */
  generateStyles(): {
    backdrop: React.CSSProperties;
    content: React.CSSProperties;
    container: React.CSSProperties;
  } {
    const constraints = this.calculateConstraints();
    const zIndex = this.getZIndexValues();
    const { placement, isMobile } = this.config;

    const backdropStyles: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      zIndex: zIndex.backdrop,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: this.getFlexAlignment(placement),
      justifyContent: this.getFlexJustification(placement),
      padding: this.getBackdropPadding(constraints, isMobile),
    };

    const contentStyles: React.CSSProperties = {
      position: 'relative',
      zIndex: zIndex.content,
      minWidth: constraints.minWidth,
      maxWidth: constraints.maxWidth,
      minHeight: constraints.minHeight,
      maxHeight: constraints.maxHeight,
      borderRadius: this.getBorderRadius(placement),
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    };

    const containerStyles: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    };

    return {
      backdrop: backdropStyles,
      content: contentStyles,
      container: containerStyles,
    };
  }

  /**
   * Check if modal would overlap with system elements
   */
  validatePlacement(dimensions: ModalDimensions): {
    isValid: boolean;
    issues: string[];
    suggestions: ModalPlacement[];
  } {
    const position = this.calculatePosition(dimensions);
    const { viewport, safeArea, toolbar } = this.boundaries;
    const issues: string[] = [];
    const suggestions: ModalPlacement[] = [];

    // Check viewport bounds
    if (position.x < 0 || position.x + dimensions.width > viewport.width) {
      issues.push('Modal extends beyond horizontal viewport bounds');
      suggestions.push('center');
    }

    if (position.y < 0 || position.y + dimensions.height > viewport.height) {
      issues.push('Modal extends beyond vertical viewport bounds');
      suggestions.push('center');
    }

    // Check safe area violations
    if (position.x < safeArea.left || position.x + dimensions.width > viewport.width - safeArea.right) {
      issues.push('Modal overlaps with safe area horizontal bounds');
    }

    if (position.y < safeArea.top || position.y + dimensions.height > viewport.height - safeArea.bottom) {
      issues.push('Modal overlaps with safe area vertical bounds');
    }

    // Check toolbar overlap
    if (this.config.preventOverlap && toolbar.height > 0) {
      if (toolbar.position === 'bottom' && 
          position.y + dimensions.height > viewport.height - toolbar.height) {
        issues.push('Modal overlaps with bottom toolbar');
        suggestions.push('top', 'center');
      }

      if (toolbar.position === 'top' && position.y < toolbar.height) {
        issues.push('Modal overlaps with top toolbar');
        suggestions.push('bottom', 'center');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions: [...new Set(suggestions)] // Remove duplicates
    };
  }

  // Private helper methods

  private getSizeMultipliers(size: ModalSize, isMobile?: boolean): { width: number; height: number } {
    const mobile = isMobile ?? false;

    switch (size) {
      case 'small':
        return mobile ? { width: 0.9, height: 0.6 } : { width: 0.4, height: 0.5 };
      case 'large':
        return mobile ? { width: 0.95, height: 0.9 } : { width: 0.8, height: 0.8 };
      case 'fullscreen':
        return { width: 1.0, height: 1.0 };
      case 'auto':
        return mobile ? { width: 0.9, height: 0.8 } : { width: 0.6, height: 0.7 };
      case 'medium':
      default:
        return mobile ? { width: 0.9, height: 0.75 } : { width: 0.6, height: 0.6 };
    }
  }

  private calculateMargins(placement: ModalPlacement, safeArea: LayoutBoundaries['safeArea'], isMobile?: boolean): {
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
  } {
    const basePadding = isMobile ? 16 : 24;

    return {
      marginTop: safeArea.top + basePadding,
      marginBottom: safeArea.bottom + basePadding,
      marginLeft: safeArea.left + basePadding,
      marginRight: safeArea.right + basePadding,
    };
  }

  private getAutoPlacement(isMobile?: boolean): ModalPlacement {
    const { type } = this.config;
    
    if (isMobile) {
      return type === 'properties' ? 'bottom' : 'center';
    } else {
      return type === 'properties' ? 'right' : 'center';
    }
  }

  private getFlexAlignment(placement: ModalPlacement): string {
    switch (placement) {
      case 'top': return 'flex-start';
      case 'bottom': return 'flex-end';
      case 'center':
      case 'left':
      case 'right':
      default: return 'center';
    }
  }

  private getFlexJustification(placement: ModalPlacement): string {
    switch (placement) {
      case 'left': return 'flex-start';
      case 'right': return 'flex-end';
      case 'center':
      case 'top':
      case 'bottom':
      default: return 'center';
    }
  }

  private getBackdropPadding(constraints: ModalConstraints, isMobile?: boolean): string {
    const { marginTop, marginRight, marginBottom, marginLeft } = constraints;
    return `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`;
  }

  private getBorderRadius(placement: ModalPlacement): string {
    switch (placement) {
      case 'bottom': return '1rem 1rem 0 0';
      case 'top': return '0 0 1rem 1rem';
      case 'left': return '0 1rem 1rem 0';
      case 'right': return '1rem 0 0 1rem';
      case 'center':
      default: return '0.75rem';
    }
  }
}

/**
 * Factory function for creating modal layout managers
 */
export function createModalLayoutManager(
  boundaries: LayoutBoundaries,
  config: ModalConfig
): ModalLayoutManager {
  return new ModalLayoutManager(boundaries, config);
}

/**
 * Helper function to create layout boundaries from DOM measurements
 */
export function createLayoutBoundaries(
  toolbarHeight: number = 0,
  toolbarPosition: 'top' | 'bottom' | 'none' = 'none',
  safeAreaInsets: { top: number; bottom: number; left: number; right: number } = { top: 0, bottom: 0, left: 0, right: 0 }
): LayoutBoundaries {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const safeArea = {
    top: safeAreaInsets.top,
    bottom: safeAreaInsets.bottom + (toolbarPosition === 'bottom' ? toolbarHeight : 0),
    left: safeAreaInsets.left,
    right: safeAreaInsets.right,
  };

  if (toolbarPosition === 'top') {
    safeArea.top += toolbarHeight;
  }

  return {
    viewport,
    safeArea,
    toolbar: {
      height: toolbarHeight,
      position: toolbarPosition,
    },
    available: {
      width: viewport.width - safeArea.left - safeArea.right,
      height: viewport.height - safeArea.top - safeArea.bottom,
    },
  };
}