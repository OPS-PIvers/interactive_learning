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
