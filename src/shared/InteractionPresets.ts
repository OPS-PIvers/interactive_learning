// src/shared/InteractionPresets.ts - NEW FILE  
import { InteractionType } from './enums';

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
  [InteractionType.PAN_ZOOM_TO_HOTSPOT]: {
    icon: '🎯',
    name: 'Zoom to Hotspot',
    color: 'bg-teal-500',
    settings: ['targetId', 'zoomLevel', 'smooth'],
    description: 'Pan and zoom to a specific hotspot'
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
  [InteractionType.SHOW_VIDEO]: {
    icon: '🎬',
    name: 'Show Video',
    color: 'bg-rose-500',
    settings: ['videoUrl', 'videoDisplayMode'],
    description: 'Show a video in a modal or inline'
  },
  [InteractionType.SHOW_AUDIO_MODAL]: {
    icon: '🎶',
    name: 'Show Audio',
    color: 'bg-purple-500',
    settings: ['audioUrl', 'audioTitle', 'audioArtist'],
    description: 'Show an audio player in a modal'
  },
  [InteractionType.SHOW_YOUTUBE]: {
    icon: '📺',
    name: 'Show YouTube',
    color: 'bg-red-600',
    settings: ['youtubeVideoId', 'youtubeStartTime', 'youtubeEndTime'],
    description: 'Embed a YouTube video'
  },
  
  // === UNIFIED TEXT AND SPOTLIGHT ===
  [InteractionType.SHOW_MESSAGE]: {
    icon: '💬',
    name: 'Show Message',
    color: 'bg-sky-500',
    settings: ['textContent', 'textPosition'],
    description: 'Display a simple text message'
  },
  [InteractionType.SHOW_TEXT]: {
    icon: '📝',
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
  
  // === SLIDE-BASED INTERACTION TYPES ===
  [InteractionType.MODAL]: {
    icon: '📋',
    name: 'Modal Dialog',
    color: 'bg-blue-500',
    settings: ['title', 'message'],
    description: 'Show information in a popup dialog'
  },
  
  [InteractionType.TRANSITION]: {
    icon: '➡️',
    name: 'Slide Transition',
    color: 'bg-green-500',
    settings: ['type', 'slideIndex'],
    description: 'Navigate to another slide or section'
  },
  
  [InteractionType.SOUND]: {
    icon: '🔊',
    name: 'Play Sound',
    color: 'bg-purple-500',
    settings: ['url', 'volume'],
    description: 'Play an audio file or sound effect'
  },
  
  [InteractionType.TOOLTIP]: {
    icon: '💬',
    name: 'Tooltip',
    color: 'bg-orange-500',
    settings: ['text', 'position'],
    description: 'Show contextual information on hover or click'
  },
};