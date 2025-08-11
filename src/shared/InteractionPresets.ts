// src/shared/InteractionPresets.ts - CANONICAL INTERACTION TYPES
// Cleaned up to 6 canonical types as requested
export enum InteractionType {
  // === CANONICAL INTERACTION TYPES ===
  TEXT = 'text',
  TOOLTIP = 'tooltip', 
  AUDIO = 'audio',
  VIDEO = 'video',
  PAN_ZOOM = 'pan_zoom',
  SPOTLIGHT = 'spotlight',

  // === LEGACY TYPES (for migration support) ===
  // These will be automatically migrated to canonical types
  SHOW_TEXT = 'SHOW_TEXT',
  SHOW_MESSAGE = 'SHOW_MESSAGE',
  PLAY_AUDIO = 'PLAY_AUDIO',
  PLAY_VIDEO = 'PLAY_VIDEO',
  SHOW_VIDEO = 'SHOW_VIDEO',
  SHOW_AUDIO_MODAL = 'SHOW_AUDIO_MODAL',
  SHOW_YOUTUBE = 'SHOW_YOUTUBE',
  PAN_ZOOM_TO_HOTSPOT = 'PAN_ZOOM_TO_HOTSPOT',
  HIGHLIGHT = 'highlight'
}

// Default export for maximum compatibility
export default InteractionType;

import { TimelineEventData } from './type-defs';

export interface InteractionPreset {
  icon: string;
  name: string;
  color: string;
  settings: (keyof TimelineEventData)[];
  description: string;
}

// Canonical interaction presets - only the 6 core types users will see
export const canonicalInteractionPresets: Record<string, InteractionPreset> = {
  [InteractionType.TEXT]: {
    icon: '📝',
    name: 'Text',
    color: 'bg-blue-500',
    settings: [
      'textContent',
      'textPosition',
      'textX',
      'textY', 
      'textWidth',
      'textHeight',
      'displayMode'
    ],
    description: 'Display text content with flexible positioning and styling'
  },
  
  [InteractionType.TOOLTIP]: {
    icon: '💬',
    name: 'Tooltip',
    color: 'bg-orange-500',
    settings: ['textContent', 'position', 'arrow', 'delay'],
    description: 'Show contextual information on hover or click'
  },
  
  [InteractionType.AUDIO]: {
    icon: '🔊',
    name: 'Audio',
    color: 'bg-indigo-500',
    settings: [
      'audioUrl', 
      'audioFile',
      'displayMode', 
      'showControls', 
      'volume', 
      'autoplay', 
      'loop',
      'audioTitle'
    ],
    description: 'Play audio from file upload or URL with flexible display options'
  },
  
  [InteractionType.VIDEO]: {
    icon: '🎥',
    name: 'Video',
    color: 'bg-red-500',
    settings: [
      'videoSource',
      'videoUrl',
      'videoFile',
      'youtubeVideoId', 
      'displayMode', 
      'showControls', 
      'poster', 
      'autoplay', 
      'loop',
      'youtubeStartTime',
      'youtubeEndTime'
    ],
    description: 'Play video from file upload or YouTube URL with customizable playback'
  },
  
  [InteractionType.PAN_ZOOM]: {
    icon: '🔍',
    name: 'Pan & Zoom',
    color: 'bg-green-500',
    settings: ['targetX', 'targetY', 'zoomLevel', 'duration', 'easing'],
    description: 'Pan and zoom to specific coordinates with smooth animation'
  },
  
  [InteractionType.SPOTLIGHT]: {
    icon: '💡',
    name: 'Spotlight',
    color: 'bg-yellow-500',
    settings: [
      'position',
      'shape',
      'width', 
      'height',
      'intensity',
      'fadeEdges',
      'message'
    ],
    description: 'Focus attention with customizable spotlight effects'
  }
};

// Legacy type mappings for backward compatibility
export const legacyInteractionPresets: Record<string, InteractionPreset> = {
  [InteractionType.SHOW_TEXT]: canonicalInteractionPresets[InteractionType.TEXT],
  [InteractionType.SHOW_MESSAGE]: canonicalInteractionPresets[InteractionType.TEXT],
  [InteractionType.PLAY_AUDIO]: canonicalInteractionPresets[InteractionType.AUDIO],
  [InteractionType.PLAY_VIDEO]: canonicalInteractionPresets[InteractionType.VIDEO],
  [InteractionType.SHOW_VIDEO]: canonicalInteractionPresets[InteractionType.VIDEO],
  [InteractionType.SHOW_AUDIO_MODAL]: canonicalInteractionPresets[InteractionType.AUDIO],
  [InteractionType.SHOW_YOUTUBE]: canonicalInteractionPresets[InteractionType.VIDEO],
  [InteractionType.PAN_ZOOM_TO_HOTSPOT]: canonicalInteractionPresets[InteractionType.PAN_ZOOM],
  [InteractionType.HIGHLIGHT]: canonicalInteractionPresets[InteractionType.SPOTLIGHT]
};

// Combined presets for migration support
export const interactionPresets: Record<string, InteractionPreset> = {
  ...canonicalInteractionPresets,
  ...legacyInteractionPresets
};