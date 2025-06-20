
export enum InteractionType {
  // Existing types
  SHOW_HOTSPOT = 'SHOW_HOTSPOT',
  HIDE_HOTSPOT = 'HIDE_HOTSPOT',
  PULSE_HOTSPOT = 'PULSE_HOTSPOT',
  SHOW_MESSAGE = 'SHOW_MESSAGE',
  PAN_ZOOM_TO_HOTSPOT = 'PAN_ZOOM_TO_HOTSPOT',
  HIGHLIGHT_HOTSPOT = 'HIGHLIGHT_HOTSPOT',
  
  // New types
  SHOW_TEXT = 'SHOW_TEXT',
  QUIZ = 'QUIZ',
  MEDIA = 'MEDIA'
}


export type HotspotSize = 'small' | 'medium' | 'large';

export interface HotspotData {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  title: string;
  description: string;
  color?: string; // e.g., 'bg-red-500'
  size?: HotspotSize; // Size of the hotspot marker, defaults to 'medium'
}

export interface TimelineEventData {
  id: string;
  step: number; // Sequence number, 1-indexed
  name: string;
  type: InteractionType;
  
  targetId?: string; // ID of HotspotData
  message?: string;
  duration?: number; // in ms, for timed events like pulse
  
  // Enhanced zoom properties
  zoomFactor?: number; // For PAN_ZOOM_TO_HOTSPOT, e.g., 2 for 2x zoom, defaults to 2
  
  // Enhanced spotlight properties
  highlightRadius?: number; // For HIGHLIGHT_HOTSPOT, in pixels on original image for clear area, defaults to 60
  highlightShape?: 'circle' | 'rectangle'; // Shape of the highlight area, defaults to 'circle'
  dimPercentage?: number; // Percentage of dimming for highlight overlay (0-100), defaults to 70
  spotlightX?: number; // Percentage position
  spotlightY?: number; // Percentage position
  spotlightWidth?: number; // Pixels
  spotlightHeight?: number; // Pixels
  
  // New properties for enhanced events
  textContent?: string;
  textPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectAnswer?: number;
  mediaType?: 'image' | 'youtube' | 'mp4' | 'audio';
  mediaUrl?: string;
}

// New interface for managing multiple simultaneous events
export interface HotspotEventGroup {
  id: string;
  step: number;
  name: string;
  targetId: string;
  events: TimelineEventData[]; // Multiple events that happen simultaneously
}

export interface InteractiveModuleState {
  backgroundImage?: string; // Base64 string of the image when loaded, or undefined
  hotspots: HotspotData[];
  timelineEvents: TimelineEventData[];
  imageFitMode?: 'cover' | 'contain' | 'fill'; // Image display mode
}

// Stored in simulated Drive (module_data.json within project folder)
export interface StoredInteractiveModuleData {
  hotspots: HotspotData[];
  timelineEvents: TimelineEventData[];
  backgroundImageFileId?: string; // Reference to the image file in simulated Drive
  imageFitMode?: 'cover' | 'contain' | 'fill'; // Image display mode
}

export interface Project {
  id: string; // Corresponds to the Drive Folder ID
  title: string;
  description: string;
  thumbnailUrl?: string; // Base64 string of the background image, for card display
  interactiveData: InteractiveModuleState; // Contains resolved backgroundImage (base64)
}
