export const Z_INDEX = {
  IMAGE_BASE: 10,
  IMAGE_TRANSFORMED: 15,
  HOTSPOTS: 20,
  INFO_PANEL: 30,
  TIMELINE: 40,
  TOOLBAR: 50,
  MODAL: 60,
  DEBUG: 100
} as const;

export const INTERACTION_DEFAULTS = {
  zoomFactor: 2.0,
  highlightRadius: 60,
  pulseDuration: 2000,
  showingZoomSlider: false,
  showingHighlightSlider: false,
  showingPulseSlider: false
} as const;

export const ZOOM_LIMITS = {
  minScale: 0.5,
  maxScale: 5.0,
  doubleTapZoomFactor: 2.0
} as const;

export const PREVIEW_DEFAULTS = {
  SPOTLIGHT_X: 50,
  SPOTLIGHT_Y: 50,
  HIGHLIGHT_RADIUS: 60,
  DIM_PERCENTAGE: 70,
  TEXT_X: 50,
  TEXT_Y: 50,
  MAX_WIDTH: '200px',
  TARGET_X: 50,
  TARGET_Y: 50,
  ZOOM_PREVIEW_WIDTH_PERCENT: 20,
  ZOOM_PREVIEW_HEIGHT_PERCENT: 20,
} as const;
