/**
 * Simplified Slide-Based Interactive Architecture Types
 */

// Background media types
export interface BackgroundMedia {
  type: 'image' | 'video' | 'color' | 'none';
  url?: string;
  color?: string;
}

// Core slide structure
export interface InteractiveSlide {
  id: string;
  title: string;
  backgroundMedia?: BackgroundMedia;
  elements: SlideElement[];
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
  x: number;
  y: number;
  width: number;
  height: number;
}

// Element content
export interface ElementContent {
  title?: string;
  description?: string;
  textContent?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
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
  type: 'pulse' | 'glow' | 'none';
  duration?: number;
}

// Interaction system
export interface ElementInteraction {
  id: string;
  trigger: 'click' | 'hover';
  effect: SlideEffect;
}

// Simplified Slide effects
export interface SlideEffect {
  id: string;
  type: 'spotlight' | 'text' | 'tooltip';
  parameters: SpotlightParameters | ShowTextParameters | TooltipParameters;
}

export interface SpotlightParameters {
  position: FixedPosition;
  shape: 'circle' | 'rectangle';
  message?: string;
}

export interface ShowTextParameters {
  text: string;
  position: FixedPosition;
}

export interface TooltipParameters {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

// Slide deck (collection of slides)
export interface SlideDeck {
  id: string;
  title: string;
  description?: string;
  slides: InteractiveSlide[];
  settings: DeckSettings;
  metadata: DeckMetadata;
  theme?: ProjectTheme;
}

export interface DeckSettings {
  allowNavigation: boolean;
  showControls: boolean;
}

export interface DeckMetadata {
  created: number;
  modified: number;
  author?: string;
  version: string;
  isPublic: boolean;
}

// Theme system
export interface ProjectTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
    hotspotDefault: string;
    hotspotHover: string;
    hotspotActive: string;
    hotspotPulse: string;
    modalBackground: string;
    modalOverlay: string;
    modalBorder: string;
  };
  typography: any;
  effects: any;
}

export type ThemePreset = 'professional' | 'vibrant' | 'dark' | 'custom';