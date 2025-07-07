
export enum InteractionType {
  // Existing types
  SHOW_HOTSPOT = 'SHOW_HOTSPOT',
  HIDE_HOTSPOT = 'HIDE_HOTSPOT',
  PULSE_HOTSPOT = 'PULSE_HOTSPOT',
  SHOW_MESSAGE = 'SHOW_MESSAGE',
  PAN_ZOOM_TO_HOTSPOT = 'PAN_ZOOM_TO_HOTSPOT',
  HIGHLIGHT_HOTSPOT = 'HIGHLIGHT_HOTSPOT',
  
  // Enhanced types
  SHOW_TEXT = 'SHOW_TEXT',
  SHOW_IMAGE = 'SHOW_IMAGE',
  PAN_ZOOM = 'PAN_ZOOM',
  SPOTLIGHT = 'SPOTLIGHT',
  QUIZ = 'QUIZ',
  PULSE_HIGHLIGHT = 'PULSE_HIGHLIGHT',
  PLAY_AUDIO = 'PLAY_AUDIO',
  PLAY_VIDEO = 'PLAY_VIDEO',
  
  // Media interaction types
  SHOW_VIDEO = 'SHOW_VIDEO',
  SHOW_AUDIO_MODAL = 'SHOW_AUDIO_MODAL',
  SHOW_IMAGE_MODAL = 'SHOW_IMAGE_MODAL',
  SHOW_YOUTUBE = 'SHOW_YOUTUBE'
}


export type HotspotSize = 'small' | 'medium' | 'large';

export interface HotspotData {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  title: string;
  description: string;
  color?: string; // e.g., 'bg-red-500'
  backgroundColor?: string; // e.g., 'bg-red-500' - alias for color for mobile editor compatibility
  size?: HotspotSize; // Size of the hotspot marker, defaults to 'medium'
  link?: string; // Optional link URL for hotspot
}

// Base Event interface
interface BaseEvent {
  id: string;
  hotspotId: string;
  type: 'spotlight' | 'pan-zoom' | 'text' | 'media' | 'goto' | 'question';
  title?: string;
}

// Position and Size interfaces
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Specific Event types for reference integration
export interface SpotlightEvent extends BaseEvent {
  type: 'spotlight';
  position: Position;
  size: Size;
  shape: 'circle' | 'rectangle';
  opacity?: number;
}

export interface PanZoomEvent extends BaseEvent {
  type: 'pan-zoom';
  targetX: number;
  targetY: number;
  zoom: number;
}

export interface TextEvent extends BaseEvent {
  type: 'text';
  content: string;
  modalPosition: Position | 'center';
  modalSize?: Size;
}

export interface MediaEvent extends BaseEvent {
  type: 'media';
  url: string;
  mediaType: 'image' | 'video' | 'youtube';
  modalPosition: Position | 'center';
  modalSize?: Size;
}

export interface GoToEvent extends BaseEvent {
  type: 'goto';
  targetHotspotId: string;
}

export interface QuestionEvent extends BaseEvent {
  type: 'question';
  question: string;
  options: string[];
  correctAnswer: number;
  modalPosition: Position | 'center';
  modalSize?: Size;
}

export type Event = SpotlightEvent | PanZoomEvent | TextEvent | MediaEvent | GoToEvent | QuestionEvent;

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
  highlightShape?: 'circle' | 'rectangle' | 'oval'; // Shape of the highlight area, defaults to 'circle'
  dimPercentage?: number; // Percentage of dimming for highlight overlay (0-100), defaults to 70
  spotlightX?: number; // Percentage position
  spotlightY?: number; // Percentage position
  spotlightWidth?: number; // Pixels
  spotlightHeight?: number; // Pixels
  
  // New properties for enhanced events
  textContent?: string;
  textPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  textX?: number; // Text box X position (percentage)
  textY?: number; // Text box Y position (percentage)
  textWidth?: number; // Text box width (pixels)
  textHeight?: number; // Text box height (pixels)
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectAnswer?: number;
  mediaType?: 'image' | 'youtube' | 'mp4' | 'audio';
  mediaUrl?: string;
  
  // Additional properties for new interaction types
  imageUrl?: string;
  caption?: string;
  zoomLevel?: number;
  smooth?: boolean;
  radius?: number;
  intensity?: number;
  audioUrl?: string;
  volume?: number;
  
  // Media modal properties
  videoUrl?: string;
  youtubeVideoId?: string;
  youtubeStartTime?: number;
  youtubeEndTime?: number;
  autoplay?: boolean;
  loop?: boolean;
  poster?: string;
  artist?: string;
  
  // Reference code integration properties
  shape?: 'circle' | 'rectangle';
  opacity?: number;
  position?: Position;
  size?: Size;
  targetX?: number;
  targetY?: number;
  zoom?: number;
  content?: string;
  modalPosition?: Position | 'center';
  modalSize?: Size;
  url?: string;
  targetHotspotId?: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
  
  // ADD these new properties for enhanced positioning system
  positioningVersion?: 'enhanced' | 'legacy'; // Track which positioning system was used
  constraintsApplied?: boolean; // Whether positioning constraints were applied
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
  hotspots?: HotspotData[]; // Made optional for deferred loading
  timelineEvents?: TimelineEventData[]; // Made optional for deferred loading
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

export interface ImageTransformState {
  scale: number;
  translateX: number;
  translateY: number;
  targetHotspotId?: string;
}
