/**
 * Unified Z-Index Management System
 * 
 * Single source of truth for all z-index values across the application.
 * Organized hierarchically to prevent layering conflicts. Works on all device types.
 * 
 * Usage:
 * ```typescript
 * import { Z_INDEX } from '../utils/zIndexLevels';
 * 
 * // In component styles
 * style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
 * 
 * // In Tailwind classes
 * className={`fixed inset-0 ${Z_INDEX_TAILWIND.MODAL_CONTENT}`}
 * ```
 */

/**
 * Unified Z-Index hierarchy for all devices and screen sizes
 */
export const Z_INDEX = {
  // Base content layer (0-99)
  BASE: 0,
  SLIDE_CONTENT: 10,
  HOTSPOTS: 20,
  SLIDE_ELEMENTS: 30,
  LOADING_OVERLAY: 60,

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
  MODAL_CONTENT_FLOATING_CONTROL: 8501,
  NESTED_MODAL: 9000,
  CONFIRMATION_DIALOG: 9500,

  // System UI (10000+) - High enough for all device types including iOS Safari
  TOOLBAR: 9999,              // Unified toolbar level (works on all devices)
  PROPERTIES_PANEL: 10000,    // Unified properties panel
  SYSTEM_MODAL: 10100,        // System-level modals
  DEBUG_OVERLAY: 10500,       // Development/debugging
  EMERGENCY_OVERLAY: 11000,   // Absolute highest priority
} as const;

/**
 * Tailwind CSS class mappings for z-index values
 */
export const Z_INDEX_TAILWIND = {
  BASE: 'z-0',
  SLIDE_CONTENT: 'z-10',
  HOTSPOTS: 'z-20',
  SLIDE_ELEMENTS: 'z-30',
  LOADING_OVERLAY: 'z-[60]',
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
  MODAL_CONTENT_FLOATING_CONTROL: 'z-[8501]',
  NESTED_MODAL: 'z-[9000]',
  CONFIRMATION_DIALOG: 'z-[9500]',
  TOOLBAR: 'z-[9999]',
  PROPERTIES_PANEL: 'z-[10000]',
  SYSTEM_MODAL: 'z-[10100]',
  DEBUG_OVERLAY: 'z-[10500]',
  EMERGENCY_OVERLAY: 'z-[11000]',
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
 * Z-index conflict detection (development only)
 */
export const detectZIndexConflicts = (): void => {
  if (process.env['NODE_ENV'] !== 'development') return;
  
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
if (process.env['NODE_ENV'] === 'development') {
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
  
  // Unified properties panel pattern
  PROPERTIES_PANEL: {
    backdrop: Z_INDEX.MODAL_BACKDROP,
    panel: Z_INDEX.PROPERTIES_PANEL,
    controls: Z_INDEX.PROPERTIES_PANEL + 1,
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