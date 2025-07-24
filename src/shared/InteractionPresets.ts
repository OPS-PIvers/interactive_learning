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
};