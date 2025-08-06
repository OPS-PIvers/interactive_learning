/**
 * iOS Safari Z-Index Management Utility
 * 
 * Manages z-index values to ensure proper layering of UI elements
 * that need to appear above iOS Safari browser UI elements.
 */
import React from 'react';

// Z-index constants for iOS Safari compatibility
export const IOS_Z_INDEX = {
  // Base content levels
  CONTENT: 1,
  ELEVATED_CONTENT: 10,
  
  // Floating elements
  FLOATING_MENU: 100,
  FLOATING_BUTTON: 110,
  
  // Modal and overlay levels
  BACKDROP: 1000,
  MODAL: 1100,
  DROPDOWN: 1200,
  TOOLTIP: 1300,
  
  // Critical UI that must appear above iOS Safari UI
  PROPERTIES_PANEL: 9000,
  CRITICAL_MODAL: 9100,
  NOTIFICATION: 9200,
  ERROR_OVERLAY: 9300,
  
  // Maximum z-index for emergency overrides
  MAXIMUM: 9999
} as const;

/**
 * Check if the current device is likely iOS Safari
 */
export function isIOSSafari(): boolean {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
  
  // Also check for iOS Safari specific features
  const hasVisualViewport = 'visualViewport' in window;
  const hasSafeAreaSupport = CSS.supports('padding', 'env(safe-area-inset-top)');
  
  return isIOS && (isSafari || hasVisualViewport || hasSafeAreaSupport);
}

/**
 * Get appropriate z-index for an element type on iOS Safari
 */
export function getIOSZIndex(elementType: keyof typeof IOS_Z_INDEX): number {
  return IOS_Z_INDEX[elementType];
}

/**
 * Get z-index style object for iOS Safari compatibility
 */
export function getIOSZIndexStyle(elementType: keyof typeof IOS_Z_INDEX): React.CSSProperties {
  return {
    zIndex: getIOSZIndex(elementType),
    // Ensure proper stacking context
    position: 'relative',
    // Enable hardware acceleration for better performance
    willChange: 'transform',
    // Ensure proper layer composition
    isolation: 'isolate'
  };
}

/**
 * Get safe area aware positioning for iOS Safari
 */
export function getIOSSafeAreaStyle(options: {
  includeTop?: boolean;
  includeBottom?: boolean;
  includeLeft?: boolean;
  includeRight?: boolean;
  additionalPadding?: number;
} = {}): React.CSSProperties {
  const {
    includeTop = false,
    includeBottom = true,
    includeLeft = false,
    includeRight = false,
    additionalPadding = 0
  } = options;

  const style: React.CSSProperties = {};

  if (includeTop) {
    style.paddingTop = `max(env(safe-area-inset-top), ${additionalPadding}px)`;
  }
  
  if (includeBottom) {
    style.paddingBottom = `max(env(safe-area-inset-bottom), ${additionalPadding}px)`;
  }
  
  if (includeLeft) {
    style.paddingLeft = `max(env(safe-area-inset-left), ${additionalPadding}px)`;
  }
  
  if (includeRight) {
    style.paddingRight = `max(env(safe-area-inset-right), ${additionalPadding}px)`;
  }

  return style;
}

/**
 * Get dynamic viewport height style for iOS Safari
 */
export function getIOSViewportStyle(options: {
  useAvailableHeight?: boolean;
  fallbackOffset?: number;
} = {}): React.CSSProperties {
  const { useAvailableHeight = false, fallbackOffset = 0 } = options;

  return {
    // Modern dynamic viewport units
    height: useAvailableHeight ? 'calc(var(--available-vh, 1vh) * 100)' : '100dvh',
    minHeight: '-webkit-fill-available',
    
    // iOS Safari specific fixes
    maxHeight: useAvailableHeight ? 'calc(var(--available-vh, 1vh) * 100)' : '100dvh',
    overflow: 'hidden',
    position: 'relative'
  };
}

/**
 * Get floating element positioning for iOS Safari
 */
export function getIOSFloatingStyle(options: {
  bottom?: number;
  adjustForTimeline?: boolean;
  timelineHeight?: number;
} = {}): React.CSSProperties {
  const { 
    bottom = 16, 
    adjustForTimeline = false, 
    timelineHeight = 56 
  } = options;

  const baseBottom = adjustForTimeline ? bottom + timelineHeight : bottom;

  return {
    position: 'fixed',
    bottom: `max(${baseBottom}px, calc(env(safe-area-inset-bottom) + 8px))`,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: getIOSZIndex('FLOATING_MENU'),
    // Ensure proper stacking
    isolation: 'isolate'
  };
}

/**
 * Get modal positioning for iOS Safari
 */
export function getIOSModalStyle(options: {
  maxHeightPercent?: number;
  fromBottom?: boolean;
} = {}): React.CSSProperties {
  const { maxHeightPercent = 85, fromBottom = true } = options;

  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: getIOSZIndex('CRITICAL_MODAL'),
    width: '100%',
    boxSizing: 'border-box',
    isolation: 'isolate'
  };

  if (fromBottom) {
    return {
      ...baseStyle,
      bottom: 'env(safe-area-inset-bottom, 0px)',
      left: 'env(safe-area-inset-left, 0px)',
      right: 'env(safe-area-inset-right, 0px)',
      maxHeight: `min(${maxHeightPercent}dvh, calc(100vh - env(safe-area-inset-top, 44px) - 32px))`,
      borderRadius: '16px 16px 0 0',
      overflow: 'hidden'
    };
  }

  return {
    ...baseStyle,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxHeight: `${maxHeightPercent}dvh`,
    maxWidth: `min(90vw, 400px)`,
    borderRadius: '16px'
  };
}

/**
 * Apply comprehensive iOS Safari fixes to an element
 */
export function applyIOSSafariFixes(element: HTMLElement, options: {
  elementType: keyof typeof IOS_Z_INDEX;
  includeViewportFix?: boolean;
  includeSafeArea?: boolean;
  safeAreaOptions?: Parameters<typeof getIOSSafeAreaStyle>[0];
} = { elementType: 'CONTENT' }): void {
  if (!isIOSSafari()) return;

  const { 
    elementType, 
    includeViewportFix = false, 
    includeSafeArea = false, 
    safeAreaOptions = {} 
  } = options;

  // Apply z-index
  element.style.zIndex = getIOSZIndex(elementType).toString();
  element.style.isolation = 'isolate';

  // Apply viewport fixes
  if (includeViewportFix) {
    const viewportStyle = getIOSViewportStyle();
    Object.assign(element.style, viewportStyle);
  }

  // Apply safe area
  if (includeSafeArea) {
    const safeAreaStyle = getIOSSafeAreaStyle(safeAreaOptions);
    Object.assign(element.style, safeAreaStyle);
  }
}