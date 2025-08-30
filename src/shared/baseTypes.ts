/**
 * Base types for the interactive hotspot application.
 * Originally derived from the simplified slide-based architecture.
 */

// Background media types
export interface BackgroundMedia {
  type: 'image' | 'video' | 'youtube' | 'audio' | 'color' | 'none';
  url?: string;
  color?: string;
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

// Generic element content
export interface ElementContent {
  title?: string;
  description?: string;
  textContent?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
}

// Generic element styling
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
  effect: Effect;
}

// Simplified Effects (used by EffectExecutor)
export interface Effect {
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
}

export type ThemePreset = 'professional' | 'vibrant' | 'dark' | 'custom';