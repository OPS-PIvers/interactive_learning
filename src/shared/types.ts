
// Local Timestamp interface to avoid importing Firebase at top level
export interface Timestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}
import { InteractionType } from './InteractionPresets';
import { SlideDeck } from './slideTypes';
import { TimelineEventData, MediaQuizTrigger } from './type-defs';

// Re-export types that other modules need
export type { TimelineEventData, MediaQuizTrigger };


export type HotspotSize = 'x-small' | 'small' | 'medium' | 'large';
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
  pulseAnimation?: boolean; // When true, pulse animation is enabled
  pulseType?: 'loop' | 'timed'; // Type of pulse animation
  pulseDuration?: number; // Duration of the pulse animation in seconds
  positioningVersion?: 'enhanced' | 'legacy';
  constraintsApplied?: boolean;
  customProperties?: Record<string, unknown>;
  // Style preset properties
  opacity?: number; // Opacity value 0-1
  borderWidth?: number; // Border width in pixels
  borderColor?: string; // Border color
  textColor?: string; // Text color for labels
}

// Base Event interface
interface BaseEvent {
  id: string;
  hotspotId: string;
  type: 'spotlight' | 'pan-zoom' | 'text' | 'media' | 'goto' | 'question';
  title?: string;
}

// Specific Event types for reference integration
export interface SpotlightEvent extends BaseEvent {
  type: 'spotlight';
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
}

export interface MediaEvent extends BaseEvent {
  type: 'media';
  url: string;
  mediaType: 'image' | 'video' | 'youtube';
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
}

export type Event = SpotlightEvent | PanZoomEvent | TextEvent | MediaEvent | GoToEvent | QuestionEvent;

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
  isPublished?: boolean;       // Whether the module is publicly accessible
  interactiveData: InteractiveModuleState;
  projectType?: 'hotspot' | 'slide';
  slideDeck?: SlideDeck;
  theme?: string;           // Theme preset ID for this project
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
    if (match) return match[1] || null;
  }
  return null;
};
