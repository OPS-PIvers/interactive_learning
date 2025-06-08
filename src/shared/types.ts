
export enum InteractionType {
  SHOW_HOTSPOT = 'SHOW_HOTSPOT',
  HIDE_HOTSPOT = 'HIDE_HOTSPOT',
  PULSE_HOTSPOT = 'PULSE_HOTSPOT',
  SHOW_MESSAGE = 'SHOW_MESSAGE',
  PAN_ZOOM_TO_HOTSPOT = 'PAN_ZOOM_TO_HOTSPOT',
  HIGHLIGHT_HOTSPOT = 'HIGHLIGHT_HOTSPOT',
  // Future: SHOW_OVERLAY, HIDE_OVERLAY, RESET_VIEW
}

export interface HotspotData {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  title: string;
  description: string;
  color?: string; // e.g., 'bg-red-500'
}

export interface TimelineEventData {
  id: string;
  step: number; // Sequence number, 1-indexed
  name: string;
  type: InteractionType;
  targetId?: string; // ID of HotspotData
  message?: string;
  duration?: number; // in ms, for timed events like pulse
  zoomFactor?: number; // For PAN_ZOOM_TO_HOTSPOT, e.g., 2 for 2x zoom, defaults to 2
  highlightRadius?: number; // For HIGHLIGHT_HOTSPOT, in pixels on original image for clear area, defaults to 60
}

export interface InteractiveModuleState {
  backgroundImage?: string; // Base64 string of the image when loaded, or undefined
  hotspots: HotspotData[];
  timelineEvents: TimelineEventData[];
}

// Stored in simulated Drive (module_data.json within project folder)
export interface StoredInteractiveModuleData {
  hotspots: HotspotData[];
  timelineEvents: TimelineEventData[];
  backgroundImageFileId?: string; // Reference to the image file in simulated Drive
}

export interface Project {
  id: string; // Corresponds to the Drive Folder ID
  title: string;
  description: string;
  thumbnailUrl?: string; // Base64 string of the background image, for card display
  interactiveData: InteractiveModuleState; // Contains resolved backgroundImage (base64)
}
