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
  // Essential interaction types
  [InteractionType.PAN_ZOOM]: {
    icon: '🔍',
    name: 'Pan & Zoom',
    color: 'bg-green-500',
    settings: ['targetX', 'targetY', 'zoomLevel', 'smooth'],
    description: 'Pan and zoom to specific coordinates on the image'
  },
  [InteractionType.SHOW_IMAGE]: {
    icon: '🖼️',
    name: 'Show Image',
    color: 'bg-purple-500',
    settings: ['imageUrl', 'caption', 'displayMode'],
    description: 'Display image with optional caption and modal option'
  },
  [InteractionType.QUIZ]: {
    icon: '❓',
    name: 'Quiz Question',
    color: 'bg-red-500',
    settings: ['quizQuestion', 'quizOptions', 'quizCorrectAnswer', 'quizExplanation'],
    description: 'Interactive quiz question'
  },
  
  // === UNIFIED MEDIA TYPES ===
  [InteractionType.PLAY_VIDEO]: {
    icon: '🎥',
    name: 'Play Video',
    color: 'bg-red-500',
    settings: [
      'videoSource',
      'videoUrl', 
      'videoDisplayMode', 
      'videoShowControls', 
      'videoPoster', 
      'autoplay', 
      'loop',
      'youtubeStartTime',
      'youtubeEndTime'
    ],
    description: 'Play video from any source (file, YouTube, device recording, URL)'
  },
  
  [InteractionType.PLAY_AUDIO]: {
    icon: '🔊',
    name: 'Play Audio',
    color: 'bg-indigo-500',
    settings: [
      'audioUrl', 
      'audioDisplayMode', 
      'audioShowControls', 
      'volume', 
      'autoplay', 
      'loop',
      'audioTitle',
      'audioArtist'
    ],
    description: 'Play audio from any source with flexible display options'
  },
  
  // === UNIFIED TEXT AND SPOTLIGHT ===
  [InteractionType.SHOW_TEXT]: {
    icon: '💬',
    name: 'Show Text',
    color: 'bg-blue-500',
    settings: [
      'textContent',
      'textPosition',
      'textX',
      'textY', 
      'textWidth',
      'textHeight'
    ],
    description: 'Display text content with flexible positioning'
  },
  
  [InteractionType.SPOTLIGHT]: {
    icon: '💡',
    name: 'Spotlight',
    color: 'bg-yellow-500',
    settings: [
      'spotlightShape',
      'spotlightX',
      'spotlightY',
      'spotlightWidth', 
      'spotlightHeight',
      'backgroundDimPercentage'
    ],
    description: 'Focus attention with customizable spotlight effect'
  },
  
  // === LEGACY INTERACTION TYPES (for compatibility) ===
  [InteractionType.PULSE_HIGHLIGHT]: {
    icon: '✨',
    name: 'Legacy Pulse Highlight',
    color: 'bg-gray-400',
    settings: [],
    description: 'Legacy: Highlight a hotspot with a pulse effect.'
  },
  [InteractionType.PULSE_HOTSPOT]: {
    icon: '✨',
    name: 'Legacy Pulse Hotspot',
    color: 'bg-gray-400',
    settings: [],
    description: 'Legacy: Make a hotspot pulse.'
  },
  [InteractionType.SHOW_VIDEO]: {
    icon: '🎥',
    name: 'Legacy Show Video',
    color: 'bg-gray-4    00',
    settings: [],
    description: 'Legacy: Display a video (use Play Video instead).'
  },
  [InteractionType.SHOW_AUDIO_MODAL]: {
    icon: '🔊',
    name: 'Legacy Show Audio Modal',
    color: 'bg-gray-400',
    settings: [],
    description: 'Legacy: Display an audio modal (use Play Audio instead).'
  },
  [InteractionType.SHOW_YOUTUBE]: {
    icon: '▶️',
    name: 'Legacy Show YouTube',
    color: 'bg-gray-400',
    settings: [],
    description: 'Legacy: Display a YouTube video (use Play Video instead).'
  },
  [InteractionType.SHOW_MESSAGE]: {
    icon: '💬',
    name: 'Legacy Show Message',
    color: 'bg-gray-400',
    settings: [],
    description: 'Legacy: Display a message (use Show Text instead).'
  }
};