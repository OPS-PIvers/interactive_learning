// src/shared/InteractionPresets.ts - CANONICAL INTERACTION TYPES ONLY
// Clean implementation with 7 canonical types
import { TimelineEventData, InteractionType } from './type-defs';

// Default export for maximum compatibility
export default InteractionType;

export interface InteractionPreset {
  icon: string;
  name: string;
  color: string;
  settings: (keyof TimelineEventData)[];
  description: string;
}

// Canonical interaction presets - only the 7 core types users will see
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
      'textHeight'
    ],
    description: 'Display text content with flexible positioning and styling'
  },
  
  [InteractionType.TOOLTIP]: {
    icon: '💬',
    name: 'Tooltip',
    color: 'bg-orange-500',
    settings: ['textContent', 'textPosition'],
    description: 'Show contextual information on hover or click'
  },
  
  [InteractionType.AUDIO]: {
    icon: '🔊',
    name: 'Audio',
    color: 'bg-indigo-500',
    settings: [
      'audioUrl', 
      'audioDisplayMode', 
      'audioShowControls', 
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
      'youtubeVideoId', 
      'videoDisplayMode', 
      'videoShowControls', 
      'videoPoster', 
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
    settings: ['targetX', 'targetY', 'zoomLevel', 'duration'],
    description: 'Pan and zoom to specific coordinates with smooth animation'
  },
  
  [InteractionType.SPOTLIGHT]: {
    icon: '💡',
    name: 'Spotlight',
    color: 'bg-yellow-500',
    settings: [
      'spotlightShape',
      'spotlightWidth', 
      'spotlightHeight',
      'intensity',
      'backgroundDimPercentage',
      'message'
    ],
    description: 'Focus attention with customizable spotlight effects'
  },
  
  [InteractionType.QUIZ]: {
    icon: '❓',
    name: 'Quiz',
    color: 'bg-purple-500',
    settings: [
      'quizQuestion',
      'quizOptions',
      'quizCorrectAnswer',
      'quizExplanation',
      'questionType',
      'quizShuffleOptions'
    ],
    description: 'Create interactive quiz questions with multiple choice or fill-in-the-blank'
  }
};

// Export canonical presets as the main interaction presets
export const interactionPresets: Record<string, InteractionPreset> = canonicalInteractionPresets;