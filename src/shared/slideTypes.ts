/**
 * Slide-Based Interactive Architecture Types
 * 
 * This replaces the complex coordinate system with predictable slide-based positioning
 */

// Core slide structure
export interface InteractiveSlide {
  id: string;
  title: string;
  backgroundImage?: string;
  backgroundColor?: string;
  elements: SlideElement[];
  transitions: SlideTransition[];
  layout: SlideLayout;
  metadata?: {
    created: number;
    modified: number;
    version: string;
  };
}

// Slide elements (hotspots, text, media)
export interface SlideElement {
  id: string;
  type: 'hotspot' | 'text' | 'media' | 'shape';
  position: ResponsivePosition;
  content: ElementContent;
  interactions: ElementInteraction[];
  style: ElementStyle;
  isVisible: boolean;
}

// Fixed positioning with responsive breakpoints
export interface ResponsivePosition {
  desktop: FixedPosition;
  tablet: FixedPosition;
  mobile: FixedPosition;
}

export interface FixedPosition {
  x: number; // Exact pixel position from left
  y: number; // Exact pixel position from top
  width: number; // Element width in pixels
  height: number; // Element height in pixels
}

// Element content
export interface ElementContent {
  title?: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  customProperties?: Record<string, any>;
}

// Element styling
export interface ElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  zIndex?: number;
  animation?: ElementAnimation;
}

export interface ElementAnimation {
  type: 'pulse' | 'glow' | 'bounce' | 'fade' | 'none';
  duration?: number;
  delay?: number;
  iterationCount?: number | 'infinite';
}

// Interaction system
export interface ElementInteraction {
  id: string;
  trigger: InteractionTrigger;
  effect: SlideEffect;
  conditions?: InteractionCondition[];
}

export type InteractionTrigger = 
  | 'click' 
  | 'hover' 
  | 'timeline' 
  | 'auto';

export interface InteractionCondition {
  type: 'device' | 'viewport' | 'custom';
  value: string;
}

// Slide effects
export interface SlideEffect {
  id: string;
  type: SlideEffectType;
  duration: number;
  easing?: string;
  parameters: EffectParameters;
}

export type SlideEffectType = 
  | 'spotlight' 
  | 'zoom' 
  | 'transition' 
  | 'animate'
  | 'show_text'
  | 'play_media';

// Effect parameters
export type EffectParameters = 
  | SpotlightParameters 
  | ZoomParameters 
  | TransitionParameters 
  | AnimateParameters
  | ShowTextParameters
  | PlayMediaParameters;

export interface SpotlightParameters {
  position: FixedPosition; // Exact spotlight position
  shape: 'circle' | 'rectangle' | 'oval';
  intensity: number; // 0-100
  fadeEdges: boolean;
  message?: string;
}

export interface ZoomParameters {
  targetPosition: FixedPosition; // Exact area to zoom to
  zoomLevel: number; // 1.0 = no zoom, 2.0 = 2x zoom
  centerOnTarget: boolean;
}

export interface TransitionParameters {
  targetSlideId: string;
  direction: 'next' | 'previous' | 'specific';
  transitionType: 'slide' | 'fade' | 'zoom' | 'flip';
}

export interface AnimateParameters {
  targetElementId?: string;
  animationType: 'move' | 'resize' | 'rotate' | 'fade';
  fromPosition?: FixedPosition;
  toPosition?: FixedPosition;
  transformOrigin?: string;
}

export interface ShowTextParameters {
  text: string;
  position: FixedPosition;
  style: TextStyle;
  displayDuration?: number;
}

export interface PlayMediaParameters {
  mediaUrl: string;
  mediaType: 'audio' | 'video';
  autoplay: boolean;
  controls: boolean;
  volume?: number;
}

export interface TextStyle {
  fontSize: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color: string;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  textAlign?: 'left' | 'center' | 'right';
}

// Slide transitions
export interface SlideTransition {
  id: string;
  fromSlideId: string;
  toSlideId: string;
  trigger: TransitionTrigger;
  effect: TransitionEffect;
  conditions?: TransitionCondition[];
}

export type TransitionTrigger = 
  | 'manual' 
  | 'timer' 
  | 'interaction_complete'
  | 'user_input';

export interface TransitionEffect {
  type: 'slide' | 'fade' | 'zoom' | 'flip' | 'cube';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  easing?: string;
}

export interface TransitionCondition {
  type: 'completion' | 'timeout' | 'user_choice';
  value?: any;
}

// Slide layout
export interface SlideLayout {
  containerWidth: number;
  containerHeight: number;
  aspectRatio: string; // '16:9', '4:3', '1:1', etc.
  scaling: 'fit' | 'fill' | 'stretch' | 'none';
  backgroundSize: 'cover' | 'contain' | 'auto';
  backgroundPosition: string; // 'center', 'top left', etc.
}

// Slide deck (collection of slides)
export interface SlideDeck {
  id: string;
  title: string;
  description?: string;
  slides: InteractiveSlide[];
  settings: DeckSettings;
  metadata: DeckMetadata;
}

export interface DeckSettings {
  autoAdvance: boolean;
  autoAdvanceDelay?: number;
  allowNavigation: boolean;
  showProgress: boolean;
  showControls: boolean;
  keyboardShortcuts: boolean;
  touchGestures: boolean;
  fullscreenMode: boolean;
}

export interface DeckMetadata {
  created: number;
  modified: number;
  author?: string;
  version: string;
  tags?: string[];
  isPublic: boolean;
}

// Viewer state
export interface SlideViewerState {
  currentSlideId: string;
  currentSlideIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  history: string[]; // Stack of visited slide IDs
  userInteractions: UserInteractionLog[];
}

export interface UserInteractionLog {
  timestamp: number;
  slideId: string;
  elementId?: string;
  interactionType: string;
  details?: Record<string, any>;
}

// Device and viewport detection
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ViewportInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
}

// Migration from legacy format
export interface LegacyMigrationMap {
  hotspotToElement: (hotspot: any) => SlideElement;
  eventToInteraction: (event: any) => ElementInteraction;
  projectToSlideDeck: (project: any) => SlideDeck;
}