/**
 * Shared style constants for the interactive module components
 */

// Z-index layer management
export const Z_INDEX = {
  IMAGE_BASE: 10,
  IMAGE_TRANSFORMED: 15,
  HOTSPOTS: 20,
  PREVIEW_SPOTLIGHT: 25,
  PREVIEW_TEXT: 26,
  PREVIEW_ZOOM: 27,
  INFO_PANEL: 30,
  TIMELINE: 40,
  TOOLBAR: 50,
  MODAL: 60,
  DEBUG: 100
} as const;

// Type for Z_INDEX values
export type ZIndexLayer = typeof Z_INDEX[keyof typeof Z_INDEX];

// Touch target constants for mobile accessibility
export const TOUCH_TARGET = {
  MOBILE_MIN: '44px',          // WCAG AA minimum touch target size
  MOBILE_HOTSPOT: 'w-12 h-12 min-w-[44px] min-h-[44px]', // 48px classes with 44px fallback
  DESKTOP_HOTSPOT: 'w-5 h-5'   // 20px for desktop precision
} as const;

// Viewport breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  MOBILE_MAX: 767,  // Max width for mobile breakpoint
  TABLET_MIN: 768,  // Min width for tablet breakpoint
  DESKTOP_MIN: 1024 // Min width for desktop breakpoint
} as const;