/**
 * Slide-Based Interactive Architecture Types
 * 
 * This replaces the complex coordinate system with predictable slide-based positioning
 */

// Background media types
export interface BackgroundMedia {
  type: 'image' | 'video' | 'youtube' | 'audio' | 'none' | 'color';
  url?: string;
  color?: string;
  youtubeId?: string;
  volume?: number;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  startTime?: number;
  endTime?: number;
  overlay?: BackgroundOverlay;
  settings?: BackgroundSettings;
}

export interface BackgroundOverlay {
  enabled: boolean;
  color?: string;
  opacity?: number;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    direction?: string;
  };
}

export interface BackgroundSettings {
  size: 'cover' | 'contain' | 'auto' | 'stretch';
  position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  attachment: 'scroll' | 'fixed' | 'local';
}

// Core slide structure
export interface InteractiveSlide {
  id: string;
  title: string;
  backgroundImage?: string; // Deprecated: use backgroundMedia
  backgroundColor?: string;
  backgroundMedia?: BackgroundMedia;
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
  customProperties?: Record<string, unknown>;
  // Enhanced content from previous build
  link?: string; // External link for hotspot
  message?: string; // Event message/description
  displayMode?: 'inline' | 'modal' | 'overlay'; // How content is displayed
  // Quiz content
  question?: string;
  questionType?: 'multiple-choice' | 'fill-in-the-blank' | 'true-false';
  choices?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  hint?: string;
  // Video content
  videoSource?: 'file' | 'youtube' | 'device' | 'url';
  youtubeVideoId?: string;
  youtubeStartTime?: number;
  youtubeEndTime?: number;
  // Audio content
  audioUrl?: string;
  startTime?: number;
  endTime?: number;
  // Text content
  textContent?: string;
  richText?: boolean;
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
  // Enhanced styling from previous build
  size?: 'x-small' | 'small' | 'medium' | 'large';
  color?: string; // Legacy hotspot color support
  shadowColor?: string;
  shadowSize?: number;
  shadowOpacity?: number;
  pulseAnimation?: boolean;
  pulseType?: 'loop' | 'timed';
  pulseDuration?: number; // in seconds
  displayInEvent?: boolean; // Show hotspot during event
  customShape?: 'circle' | 'square' | 'diamond' | 'star';
  iconUrl?: string; // Custom icon for hotspot
  textColor?: string; // For text elements
  fontSize?: number; // For text elements
  fontWeight?: 'normal' | 'bold' | 'light';
  fontFamily?: string;
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
  | 'double-click'
  | 'long-press'
  | 'touch-start'
  | 'touch-end'
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
  delay?: number;
  easing?: string;
  parameters: EffectParameters;
}

export type SlideEffectType = 
  | 'text'
  | 'tooltip' 
  | 'audio'
  | 'video'
  | 'pan_zoom'
  | 'spotlight'
  | 'quiz';

// Effect parameters
export type EffectParameters = 
  | SpotlightParameters 
  | ZoomParameters 
  | TransitionParameters 
  | AnimateParameters
  | ShowTextParameters
  | PlayMediaParameters
  | PlayVideoParameters
  | PlayAudioParameters
  | QuizParameters
  | PanZoomParameters
  | ModalParameters
  | SoundParameters
  | TooltipParameters;

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
  displayMode?: 'inline' | 'modal' | 'tooltip' | 'banner' | 'overlay' | 'background' | 'mini-player';
  modalWidth?: number;
  modalMaxHeight?: number;
  modalPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'element';
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export interface PlayMediaParameters {
  mediaUrl: string;
  mediaType: 'audio' | 'video';
  autoplay: boolean;
  controls: boolean;
  volume?: number;
  loop?: boolean;
}

export interface PlayVideoParameters {
  videoSource: 'file' | 'youtube' | 'device' | 'url';
  videoUrl?: string;
  videoFile?: File;
  videoBlob?: Blob;
  youtubeVideoId?: string;
  youtubeStartTime?: number;
  youtubeEndTime?: number;
  displayMode: 'inline' | 'modal' | 'overlay';
  showControls: boolean;
  autoplay: boolean;
  loop?: boolean;
  muted?: boolean;
  volume?: number;
  poster?: string;
}

export interface PlayAudioParameters {
  audioUrl: string;
  audioFile?: File;
  audioBlob?: Blob;
  displayMode: 'background' | 'modal' | 'mini-player';
  showControls: boolean;
  autoplay: boolean;
  loop?: boolean;
  volume?: number;
  startTime?: number;
  endTime?: number;
}

export interface QuizParameters {
  question: string;
  questionType: 'multiple-choice' | 'fill-in-the-blank' | 'true-false';
  choices?: string[]; // For multiple choice
  correctAnswer: string | number;
  explanation?: string;
  showHint?: boolean;
  hint?: string;
  allowMultipleAttempts: boolean;
  resumeAfterCompletion: boolean;
  timeLimit?: number; // in seconds
  points?: number;
}

export interface PanZoomParameters {
  targetPosition: FixedPosition;
  zoomLevel: number; // 1.0 = no zoom, 2.0 = 2x zoom
  duration: number; // Animation duration in ms
  easing?: string;
  returnToOriginal?: boolean; // Return to original position after duration
  returnDelay?: number; // Delay before returning
}

export interface ModalParameters {
  title?: string;
  content: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  width?: number;
  height?: number;
  showCloseButton?: boolean;
  backdrop?: boolean;
  animation?: 'fade' | 'slide' | 'zoom';
}

export interface SoundParameters {
  audioUrl: string;
  volume?: number;
  loop?: boolean;
  fadeIn?: boolean;
  fadeOut?: boolean;
  startTime?: number;
  endTime?: number;
}

export interface TooltipParameters {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  width?: number;
  maxWidth?: number;
  arrow?: boolean;
  delay?: number;
  duration?: number;
}

export interface TextStyle {
  fontSize: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
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
  value?: unknown;
}

// Slide layout
export interface SlideLayout {
  containerWidth?: number;
  containerHeight?: number;
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
  theme?: ProjectTheme; // Theme system for consistent styling
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
  currentSlideId?: string | null;
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
  details?: Record<string, unknown>;
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

// Theme system for color palettes and consistent styling
export interface ProjectTheme {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  effects: ThemeEffects;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  // Hotspot-specific colors
  hotspotDefault: string;
  hotspotHover: string;
  hotspotActive: string;
  hotspotPulse: string;
  // Modal colors
  modalBackground: string;
  modalOverlay: string;
  modalBorder: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  fontWeight: {
    light: number;
    normal: number;
    bold: number;
  };
  lineHeight: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface ThemeEffects {
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
  shadow: {
    small: string;
    medium: string;
    large: string;
  };
  animation: {
    duration: {
      fast: number;
      medium: number;
      slow: number;
    };
    easing: {
      ease: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

// Predefined theme presets
export type ThemePreset = 'professional' | 'vibrant' | 'earth' | 'dark' | 'custom';

export interface ThemePresetDefinition {
  id: ThemePreset;
  name: string;
  description: string;
  theme: ProjectTheme;
}

// Migration from legacy format
// This interface has been moved to src/shared/migration.ts to avoid circular dependencies.