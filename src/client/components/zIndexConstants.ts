// Z-Index management constants for InteractiveModule.tsx

export const Z_INDEX = {
  // Base layer for the main image
  IMAGE_BASE: 10,

  // Transform indicator (zoom info, etc.)
  TRANSFORM_INDICATOR: 20,

  // Hotspots on the image
  HOTSPOT: 30,

  // Preview of a hotspot being placed
  HOTSPOT_PREVIEW: 35,

  // Hotspot info panels and tooltips
  INFO_PANEL: 40,

  // Timeline at bottom of screen
  TIMELINE: 50,

  // Toolbar at top of screen
  TOOLBAR: 60,

  // Modal dialogs and overlays
  MODAL: 70,

  // Debug information panel
  DEBUG: 80,

  // Toast notifications and alerts
  TOAST: 90,

  // Critical system dialogs
  CRITICAL: 100
} as const;

// Usage example in your component:
// style={{ zIndex: Z_INDEX.HOTSPOT }}

// Type definition for better TypeScript support
export type ZIndexLayer = keyof typeof Z_INDEX;
