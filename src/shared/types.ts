
import { Timestamp } from 'firebase/firestore';

export enum InteractionType {
  // Essential interaction types
  PAN_ZOOM = 'PAN_ZOOM',
  SHOW_IMAGE = 'SHOW_IMAGE',
  QUIZ = 'QUIZ',
  
  // === UNIFIED EVENT TYPES ===
  PLAY_VIDEO = 'PLAY_VIDEO',
  PLAY_AUDIO = 'PLAY_AUDIO',
  SHOW_TEXT = 'SHOW_TEXT',
  SPOTLIGHT = 'SPOTLIGHT',
  
  // DEPRECATED - These will be migrated to unified types:
  // PAN_ZOOM_TO_HOTSPOT = 'PAN_ZOOM_TO_HOTSPOT', // merge into PAN_ZOOM
  // PULSE_HIGHLIGHT = 'PULSE_HIGHLIGHT', // merge into PULSE_HOTSPOT
  // SHOW_VIDEO = 'SHOW_VIDEO', // merge into PLAY_VIDEO
  // SHOW_AUDIO_MODAL = 'SHOW_AUDIO_MODAL', // merge into PLAY_AUDIO
  // SHOW_YOUTUBE = 'SHOW_YOUTUBE', // merge into PLAY_VIDEO
  // SHOW_MESSAGE = 'SHOW_MESSAGE', // merge into SHOW_TEXT
  // HIGHLIGHT_HOTSPOT = 'HIGHLIGHT_HOTSPOT', // merge into SPOTLIGHT
}


export type HotspotSize = 'small' | 'medium' | 'large';
export type VideoSourceType = 'file' | 'youtube' | 'device' | 'url';
export type SpotlightShape = 'circle' | 'rectangle' | 'oval';
export type ImageDisplayMode = 'inline' | 'modal';

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
  displayHotspotInEvent?: boolean; // When true, hotspot remains visible when its events are active
  pulseWhenActive?: boolean; // When true, hotspot pulses when its events are active
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
  duration?: number; // in ms, for timed events like pulse
  
  // === UNIFIED VIDEO PROPERTIES ===
  videoSource?: VideoSourceType;
  videoUrl?: string;
  videoFile?: File;
  videoBlob?: Blob;
  youtubeVideoId?: string;
  youtubeStartTime?: number;
  youtubeEndTime?: number;
  videoDisplayMode?: 'inline' | 'modal' | 'overlay';
  videoShowControls?: boolean;
  videoPoster?: string;
  
  // === UNIFIED AUDIO PROPERTIES ===
  audioUrl?: string;
  audioDisplayMode?: 'background' | 'modal' | 'mini-player';
  audioShowControls?: boolean;
  audioTitle?: string;
  audioArtist?: string;
  
  // === UNIFIED TEXT PROPERTIES ===
  textContent?: string;
  textX?: number;        // Position X (percentage)
  textY?: number;        // Position Y (percentage)
  textWidth?: number;    // Width in pixels
  textHeight?: number;   // Height in pixels
  textPosition?: 'center' | 'custom';
  
  // === UNIFIED SPOTLIGHT PROPERTIES ===
  spotlightShape?: SpotlightShape;
  spotlightX?: number;           // Center X (percentage)
  spotlightY?: number;           // Center Y (percentage)
  spotlightWidth?: number;       // Width in pixels
  spotlightHeight?: number;      // Height in pixels
  backgroundDimPercentage?: number; // 0-100 (how much to dim background)
  spotlightOpacity?: number;     // Always 0 for spotlighted area
  
  // === UNIFIED PAN_ZOOM PROPERTIES ===
  zoomLevel?: number;    // Unified zoom level (consolidates zoomFactor and zoomLevel)
  smooth?: boolean;      // Smooth zoom animation
  
  // === COMMON PROPERTIES ===
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
  intensity?: number;    // For pulse effects
  
  // Quiz properties
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectAnswer?: number;
  quizExplanation?: string;
  quizShuffleOptions?: boolean;
  
  // Image properties
  imageUrl?: string;
  caption?: string;
  imageDisplayMode?: ImageDisplayMode;
  
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
  
  // Enhanced positioning system
  positioningVersion?: 'enhanced' | 'legacy';
  constraintsApplied?: boolean;
  
  // Legacy fields (keep for migration compatibility)
  message?: string;
  mediaType?: 'image' | 'youtube' | 'mp4' | 'audio';
  mediaUrl?: string;
  videoUrl?: string;
  poster?: string;
  artist?: string;
  zoomFactor?: number;   // Legacy - use zoomLevel instead
  highlightRadius?: number; // Legacy - use spotlightWidth/Height instead
  highlightShape?: 'circle' | 'rectangle' | 'oval'; // Legacy - use spotlightShape instead
  dimPercentage?: number; // Legacy - use backgroundDimPercentage instead
  radius?: number;       // Legacy pulse radius
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
  backgroundImage?: string; // URL for image or video
  backgroundType?: 'image' | 'video'; // Defaults to 'image' if undefined
  backgroundVideoType?: 'youtube' | 'mp4'; // Relevant if backgroundType is 'video'
  hotspots?: HotspotData[]; // Made optional for deferred loading
  timelineEvents?: TimelineEventData[]; // Made optional for deferred loading
  imageFitMode?: 'cover' | 'contain' | 'fill'; // Keep for images and potentially for video letter/pillarboxing
  viewerModes?: {
    explore?: boolean;
    selfPaced?: boolean;
    timed?: boolean;
  };
}

// Stored in simulated Drive (module_data.json within project folder)
export interface StoredInteractiveModuleData {
  hotspots: HotspotData[];
  timelineEvents: TimelineEventData[];
  backgroundImageFileId?: string; // Reference to the image file in simulated Drive
  imageFitMode?: 'cover' | 'contain' | 'fill'; // Image display mode
  schemaVersion?: string; // Track data schema version for migrations
}

export type UserId = string;

export interface Project {
  id: string;
  title: string;
  description: string;
  createdBy: string;        // User ID who created the project
  createdAt?: Date;         // When the project was created
  updatedAt?: Date;         // When the project was last updated
  thumbnailUrl?: string;    // URL for project thumbnail image
  interactiveData: InteractiveModuleState;
}

export interface UserProfile {
  uid: UserId;
  email: string;
  displayName?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  projectCount: number;
}

export interface ImageTransformState {
  scale: number;
  translateX: number;
  translateY: number;
  targetHotspotId?: string;
}

// === UTILITY FUNCTIONS ===

// Video source detection utility
export const detectVideoSource = (input: string): VideoSourceType => {
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of youtubePatterns) {
    if (pattern.test(input)) return 'youtube';
  }
  
  const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i;
  if (videoExtensions.test(input)) return 'file';
  
  return 'url';
};

// Extract YouTube video ID from various URL formats
export const extractYouTubeVideoId = (input: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
};
