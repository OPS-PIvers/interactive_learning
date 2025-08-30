/**
 * Slide-based types for the EffectExecutor system
 * This file provides compatibility types for the existing EffectExecutor
 */

export interface SlideEffect {
  id: string;
  type: 'spotlight' | 'text' | 'tooltip' | 'video' | 'audio' | 'quiz' | 'pan_zoom';
  duration?: number;
  parameters: any; // Generic parameters object
}

// Effect parameter types
export interface SpotlightParameters {
  shape?: 'circle' | 'rectangle';
  intensity?: number;
  message?: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ShowTextParameters {
  text: string;
  position?: {
    x: number;
    y: number;
  };
  duration?: number;
  style?: {
    fontSize?: string;
    color?: string;
    backgroundColor?: string;
    padding?: string;
    borderRadius?: string;
  };
}

export interface TooltipParameters {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  delay?: number;
}

export interface PlayVideoParameters {
  videoUrl: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export interface PlayAudioParameters {
  audioUrl: string;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
}

export interface QuizParameters {
  question: string;
  choices: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface PanZoomParameters {
  targetX: number;
  targetY: number;
  scale: number;
  duration?: number;
}

// Re-export types from baseTypes for compatibility
export type { 
  BackgroundMedia,
  ResponsivePosition,
  FixedPosition,
  ElementContent,
  ElementStyle,
  ElementAnimation,
  ElementInteraction 
} from './baseTypes';