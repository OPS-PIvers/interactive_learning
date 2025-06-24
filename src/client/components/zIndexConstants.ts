// Z-Index management constants for InteractiveModule.tsx

export const Z_INDEX = {
  // Base layer for the main image
  IMAGE_BASE: 1,

  // Transform indicator (zoom info, etc.)
  TRANSFORM_INDICATOR: 10,

  // Hotspots on the image
  HOTSPOT: 20,

  // Hotspot info panels and tooltips
  INFO_PANEL: 30,

  // Timeline at bottom of screen
  TIMELINE: 40,

  // Toolbar at top of screen
  TOOLBAR: 50,

  // Modal dialogs and overlays
  MODAL: 60,

  // Debug information panel
  DEBUG: 70,

  // Toast notifications and alerts
  TOAST: 80,

  // Critical system dialogs
  CRITICAL: 90
} as const;

// Usage example in your component:
// style={{ zIndex: Z_INDEX.HOTSPOT }}

// Type definition for better TypeScript support
export type ZIndexLayer = keyof typeof Z_INDEX;
