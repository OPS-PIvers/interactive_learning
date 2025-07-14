/**
 * Shared style constants for the interactive module components
 */

// Z-index layer management
export const Z_INDEX = {
  IMAGE_BASE: 10,
  IMAGE_TRANSFORMED: 15,
  HOTSPOTS: 20,
  PREVIEW_SPOTLIGHT: 20,
  PREVIEW_ZOOM: 25,
  PREVIEW_TEXT: 30,
  INFO_PANEL: 30,
  TIMELINE: 40,
  TOOLBAR: 50,
  MODAL: 60,
  DEBUG: 100
} as const;

// Type for Z_INDEX values
export type ZIndexLayer = typeof Z_INDEX[keyof typeof Z_INDEX];