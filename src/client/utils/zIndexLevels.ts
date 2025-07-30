/**
 * Centralized Z-Index Management System
 * 
 * This file provides a single source of truth for all z-index values across the application.
 * Organized hierarchically to prevent layering conflicts and ensure consistent behavior.
 * 
 * Usage:
 * ```typescript
 * import { Z_INDEX } from '../utils/zIndexLevels';
 * 
 * // In component styles
 * style={{ zIndex: Z_INDEX.MODAL }}
 * 
 * // In Tailwind classes
 * className={`fixed inset-0 ${Z_INDEX.MODAL_TAILWIND}`}
 * ```
 */

/**
 * Z-Index hierarchy levels organized by functional layers
 */
export const Z_INDEX = {
  // Base content layer (0-99)
  BASE: 0,
  SLIDE_CONTENT: 10,
  HOTSPOTS: 20,
  SLIDE_ELEMENTS: 30,

  // Interactive elements (100-999)
  TOOLTIPS: 100,
  DROPDOWNS: 200,
  POPOVERS: 300,
  SELECTED_ELEMENTS: 400,
  DRAG_PREVIEW: 500,

  // Navigation and UI chrome (1000-4999)
  NAVIGATION: 1000,
  STICKY_HEADERS: 1500,
  FLOATING_CONTROLS: 2000,
  OVERLAY_CONTENT: 2500,

  // Notifications and feedback (5000-7999)
  TOAST: 5000,
  LOADING_INDICATORS: 6000,
  ERROR_OVERLAYS: 7000,

  // Modals and dialogs (8000-9999)
  MODAL_BACKDROP: 8000,
  MODAL_CONTENT: 8500,
  NESTED_MODAL: 9000,
  CONFIRMATION_DIALOG: 9500,

  // Critical system UI (10000+)
  MOBILE_TOOLBAR: 9999,           // iOS Safari compatibility requirement
  MOBILE_MODAL_SYSTEM: 10000,     // Above mobile toolbar
  MOBILE_PROPERTIES_PANEL: 10100, // Above modal system
  DEBUG_OVERLAY: 10500,           // Development/debugging
  EMERGENCY_OVERLAY: 11000,       // Absolute highest priority
} as const;

/**
 * Tailwind CSS class mappings for z-index values
 * Use these for Tailwind-based styling
 */
export const Z_INDEX_TAILWIND = {
  BASE: 'z-0',
  SLIDE_CONTENT: 'z-10',
  HOTSPOTS: 'z-20',
  SLIDE_ELEMENTS: 'z-30',
  TOOLTIPS: 'z-[100]',
  DROPDOWNS: 'z-[200]',
  POPOVERS: 'z-[300]',
  SELECTED_ELEMENTS: 'z-[400]',
  DRAG_PREVIEW: 'z-[500]',
  NAVIGATION: 'z-[1000]',
  STICKY_HEADERS: 'z-[1500]',
  FLOATING_CONTROLS: 'z-[2000]',
  OVERLAY_CONTENT: 'z-[2500]',
  TOAST: 'z-[5000]',
  LOADING_INDICATORS: 'z-[6000]',
  ERROR_OVERLAYS: 'z-[7000]',
  MODAL_BACKDROP: 'z-[8000]',
  MODAL_CONTENT: 'z-[8500]',
  NESTED_MODAL: 'z-[9000]',
  CONFIRMATION_DIALOG: 'z-[9500]',
  MOBILE_TOOLBAR: 'z-[9999]',
  MOBILE_MODAL_SYSTEM: 'z-[10000]',
  MOBILE_PROPERTIES_PANEL: 'z-[10100]',
  DEBUG_OVERLAY: 'z-[10500]',
  EMERGENCY_OVERLAY: 'z-[11000]',
} as const;

/**
 * Mobile-specific z-index hierarchy
 * Special considerations for iOS Safari and mobile interactions
 */
export const MOBILE_Z_INDEX = {
  // Mobile base layers
  SLIDE_CANVAS: Z_INDEX.BASE,
  TOUCH_OVERLAY: Z_INDEX.SLIDE_ELEMENTS,
  GESTURE_FEEDBACK: Z_INDEX.SELECTED_ELEMENTS,

  // Mobile UI components
  BOTTOM_TOOLBAR: Z_INDEX.MOBILE_TOOLBAR,
  PROPERTIES_MODAL: Z_INDEX.MOBILE_PROPERTIES_PANEL,
  SHARE_MODAL: Z_INDEX.MOBILE_MODAL_SYSTEM,
  CONFIRMATION_MODAL: Z_INDEX.NESTED_MODAL,

  // iOS Safari specific (must exceed browser UI)
  IOS_SAFE_MINIMUM: 9999,
  IOS_UI_OVERRIDE: Z_INDEX.MOBILE_MODAL_SYSTEM,
} as const;

/**
 * Desktop-specific z-index hierarchy
 * Optimized for mouse interactions and larger screens
 */
export const DESKTOP_Z_INDEX = {
  // Desktop base layers
  SIDEBAR: Z_INDEX.NAVIGATION,
  PROPERTIES_PANEL: Z_INDEX.FLOATING_CONTROLS,
  TOOLBAR: Z_INDEX.STICKY_HEADERS,

  // Desktop modals
  MODAL_OVERLAY: Z_INDEX.MODAL_BACKDROP,
  MODAL_DIALOG: Z_INDEX.MODAL_CONTENT,
  CONTEXT_MENU: Z_INDEX.DROPDOWNS,
  TOOLTIP: Z_INDEX.TOOLTIPS,
} as const;

/**
 * Layer validation utilities
 */
export const validateZIndex = (value: number, context: string = 'unknown'): number => {
  if (value < 0) {
    console.warn(`Invalid z-index ${value} in context: ${context}. Using 0 instead.`);
    return 0;
  }
  
  if (value > Z_INDEX.EMERGENCY_OVERLAY) {
    console.warn(`Extremely high z-index ${value} in context: ${context}. Consider using predefined constants.`);
  }
  
  return value;
};

/**
 * Dynamic z-index calculation for responsive behavior
 */
export const getResponsiveZIndex = (
  baseLevel: keyof typeof Z_INDEX,
  isMobile: boolean = false
): number => {
  const baseValue = Z_INDEX[baseLevel];
  
  // Mobile adjustments for iOS Safari compatibility
  if (isMobile && baseValue >= Z_INDEX.MODAL_BACKDROP) {
    return Math.max(baseValue, MOBILE_Z_INDEX.IOS_SAFE_MINIMUM);
  }
  
  return baseValue;
};

/**
 * Z-index conflict detection (development only)
 */
export const detectZIndexConflicts = (): void => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const usedValues = new Set<number>();
  const conflicts: Array<{ level: string; value: number }> = [];
  
  Object.entries(Z_INDEX).forEach(([level, value]) => {
    if (usedValues.has(value)) {
      conflicts.push({ level, value });
    }
    usedValues.add(value);
  });
  
  if (conflicts.length > 0) {
    console.warn('Z-index conflicts detected:', conflicts);
  }
};

// Development-only conflict detection
if (process.env.NODE_ENV === 'development') {
  detectZIndexConflicts();
}

/**
 * Common z-index patterns for specific use cases
 */
export const Z_INDEX_PATTERNS = {
  // Standard modal pattern
  STANDARD_MODAL: {
    backdrop: Z_INDEX.MODAL_BACKDROP,
    content: Z_INDEX.MODAL_CONTENT,
    closeButton: Z_INDEX.MODAL_CONTENT + 1,
  },
  
  // Mobile properties panel pattern
  MOBILE_PROPERTIES: {
    backdrop: Z_INDEX.MOBILE_MODAL_SYSTEM,
    panel: Z_INDEX.MOBILE_PROPERTIES_PANEL,
    controls: Z_INDEX.MOBILE_PROPERTIES_PANEL + 1,
  },
  
  // Drag and drop pattern
  DRAG_DROP: {
    original: Z_INDEX.SLIDE_ELEMENTS,
    dragging: Z_INDEX.DRAG_PREVIEW,
    dropZone: Z_INDEX.OVERLAY_CONTENT,
  },
} as const;

export type ZIndexLevel = keyof typeof Z_INDEX;
export type ZIndexPattern = keyof typeof Z_INDEX_PATTERNS;