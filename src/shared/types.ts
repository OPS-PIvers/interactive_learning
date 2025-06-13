
export enum InteractionType {
  // Keep existing ones
  SHOW_HOTSPOT = 'SHOW_HOTSPOT',
  HIDE_HOTSPOT = 'HIDE_HOTSPOT',
  PULSE_HOTSPOT = 'PULSE_HOTSPOT',
  SHOW_MESSAGE = 'SHOW_MESSAGE',
  PAN_ZOOM_TO_HOTSPOT = 'PAN_ZOOM_TO_HOTSPOT',
  HIGHLIGHT_HOTSPOT = 'HIGHLIGHT_HOTSPOT',
  
  // Add new interaction types
  SHOW_TEXT = 'SHOW_TEXT',
  SHOW_IMAGE = 'SHOW_IMAGE',
  PAN_ZOOM = 'PAN_ZOOM',
  SPOTLIGHT = 'SPOTLIGHT',
  QUIZ = 'QUIZ',
  PULSE_HIGHLIGHT = 'PULSE_HIGHLIGHT',
  PLAY_AUDIO = 'PLAY_AUDIO'
}

// New interaction system - ADDITIVE to existing
export interface InteractionData {
  id: string;
  type: InteractionType;
  // Text interactions
  content?: string;
  // Image interactions  
  imageUrl?: string;
  caption?: string;
  // Pan/Zoom interactions
  zoomLevel?: number;
  smooth?: boolean;
  // Spotlight interactions
  radius?: number;
  intensity?: number;
  // Quiz interactions
  question?: string;
  options?: string[];
  correctAnswer?: number;
  // Audio interactions
  audioUrl?: string;
  volume?: number;
  // Pulse interactions
  duration?: number;
}

export type HotspotSize = 'small' | 'medium' | 'large';

export interface HotspotData {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  title: string;
  description: string;
  color?: HotspotColorClass; // e.g., 'bg-red-500'
  size?: HotspotSize; // Size of the hotspot marker, defaults to 'medium'
  
  // NEW: Add default pulse setting (optional)
  defaultPulse?: boolean;
}

export interface TimelineEventData {
  id: string;
  step: number; // Sequence number, 1-indexed
  name: string;
  type: InteractionType;
  
  // Keep existing properties for backward compatibility
  targetId?: string; // ID of HotspotData
  message?: string;
  duration?: number; // in ms, for timed events like pulse
  zoomFactor?: number; // For PAN_ZOOM_TO_HOTSPOT, e.g., 2 for 2x zoom, defaults to 2
  highlightRadius?: number; // For HIGHLIGHT_HOTSPOT, in pixels on original image for clear area, defaults to 60
  
  // NEW: Add interactions array (optional for backward compatibility)
  interactions?: InteractionData[];
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

export const HOTSPOT_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-gray-500",
] as const;

export type HotspotColorClass = typeof HOTSPOT_COLORS[number];
