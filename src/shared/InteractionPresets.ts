// src/shared/InteractionPresets.ts - NEW FILE
import { InteractionType } from './types';

export interface InteractionPreset {
  icon: string;
  name: string;
  color: string;
  settings: string[];
  description: string;
}

export const interactionPresets: Record<InteractionType, InteractionPreset> = {
  // Legacy types - keep for compatibility
  [InteractionType.SHOW_HOTSPOT]: {
    icon: '👁️',
    name: 'Show Hotspot',
    color: 'bg-green-500',
    settings: [],
    description: 'Make hotspot visible'
  },
  [InteractionType.HIDE_HOTSPOT]: {
    icon: '🚫',
    name: 'Hide Hotspot',
    color: 'bg-red-500',
    settings: [],
    description: 'Hide hotspot from view'
  },
  [InteractionType.PULSE_HOTSPOT]: {
    icon: '💓',
    name: 'Pulse Hotspot',
    color: 'bg-blue-500',
    settings: ['duration'],
    description: 'Animate hotspot with pulse'
  },
  [InteractionType.SHOW_MESSAGE]: {
    icon: '💬',
    name: 'Show Message',
    color: 'bg-blue-500',
    settings: ['message'],
    description: 'Display text message'
  },
  [InteractionType.PAN_ZOOM_TO_HOTSPOT]: {
    icon: '🔍',
    name: 'Pan & Zoom to Hotspot',
    color: 'bg-purple-500',
    settings: ['zoomFactor'],
    description: 'Focus on hotspot with zoom'
  },
  [InteractionType.HIGHLIGHT_HOTSPOT]: {
    icon: '✨',
    name: 'Highlight Hotspot',
    color: 'bg-yellow-500',
    settings: ['highlightRadius'],
    description: 'Spotlight effect on hotspot'
  },
  
  // New enhanced types
  [InteractionType.SHOW_TEXT]: {
    icon: '💬',
    name: 'Show Text',
    color: 'bg-blue-500',
    settings: ['content'],
    description: 'Display rich text content'
  },
  [InteractionType.SHOW_IMAGE]: {
    icon: '🖼️',
    name: 'Show Image',
    color: 'bg-purple-500',
    settings: ['imageUrl', 'caption'],
    description: 'Display image with optional caption'
  },
  [InteractionType.PAN_ZOOM]: {
    icon: '🔍',
    name: 'Pan & Zoom',
    color: 'bg-green-500',
    settings: ['zoomLevel', 'smooth'],
    description: 'Zoom to hotspot location'
  },
  [InteractionType.SPOTLIGHT]: {
    icon: '💡',
    name: 'Spotlight',
    color: 'bg-yellow-500',
    settings: ['radius', 'intensity'],
    description: 'Focus attention with spotlight'
  },
  [InteractionType.QUIZ]: {
    icon: '❓',
    name: 'Quiz Question',
    color: 'bg-red-500',
    settings: ['question', 'options', 'correctAnswer'],
    description: 'Interactive quiz question'
  },
  [InteractionType.PULSE_HIGHLIGHT]: {
    icon: '💓',
    name: 'Pulse Highlight',
    color: 'bg-pink-500',
    settings: ['duration', 'intensity'],
    description: 'Animated highlight effect'
  },
  [InteractionType.PLAY_AUDIO]: {
    icon: '🔊',
    name: 'Play Audio',
    color: 'bg-indigo-500',
    settings: ['audioUrl', 'volume'],
    description: 'Play audio narration'
  },
  [InteractionType.PLAY_VIDEO]: {
    icon: '🎞️',
    name: 'Play Video Inline',
    color: 'bg-orange-500',
    settings: ['videoUrl', 'autoplay', 'loop'],
    description: 'Play video directly in content (not modal)'
  },
  
  // Media modal interaction types
  [InteractionType.SHOW_VIDEO]: {
    icon: '📹',
    name: 'Show Video',
    color: 'bg-red-600',
    settings: ['videoUrl', 'poster', 'autoplay', 'loop'],
    description: 'Display video in modal with controls'
  },
  [InteractionType.SHOW_AUDIO_MODAL]: {
    icon: '🎵',
    name: 'Show Audio Player',
    color: 'bg-green-600',
    settings: ['audioUrl', 'title', 'artist', 'autoplay'],
    description: 'Display audio player in modal'
  },
  [InteractionType.SHOW_IMAGE_MODAL]: {
    icon: '🖼️',
    name: 'Show Image Modal',
    color: 'bg-cyan-600',
    settings: ['imageUrl', 'title', 'caption'],
    description: 'Display image in zoomable modal'
  },
  [InteractionType.SHOW_YOUTUBE]: {
    icon: '📺',
    name: 'Show YouTube Video',
    color: 'bg-red-500',
    settings: ['youtubeVideoId', 'youtubeStartTime', 'youtubeEndTime', 'autoplay'],
    description: 'Display YouTube video in modal'
  }
};