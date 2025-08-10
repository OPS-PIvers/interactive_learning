import { InteractionType } from './InteractionPresets';
import { SlideDeck } from './slideTypes';


export type HotspotSize = 'x-small' | 'small' | 'medium' | 'large';
export type VideoSourceType = 'file' | 'youtube' | 'device' | 'url';
export type SpotlightShape = 'circle' | 'rectangle' | 'oval';
export type ImageDisplayMode = 'inline' | 'modal';

// Position and Size interfaces
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Enhanced media quiz interfaces
export type QuestionType = 'multiple-choice' | 'fill-in-the-blank';

export interface QuizQuestion {
  id: string;
  timestamp: number;
  questionType: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswer?: number | string; // index for multiple-choice, string for fill-in-the-blank
  showCorrectAnswer?: boolean;
}

export interface MediaQuizTrigger {
  id: string;
  timestamp: number; // seconds into media
  pauseMedia: boolean; // auto-pause at this point
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number | string;
    explanation?: string;
    showExplanation?: boolean;
    questionType?: 'multiple-choice' | 'fill-in-the-blank';
  };
  resumeAfterCompletion: boolean; // auto-resume when quiz complete
}

export interface TimelineEventData {
  id: string;
  step: number; // Sequence number, 1-indexed
  name: string;
  type: InteractionType;

  targetId?: string; // ID of HotspotData
  duration?: number; // in ms, for timed events like pulse

  // === UNIFIED VIDEO PROPERTIES ===
  videoSource?: VideoSourceType;
  videoUrl?: string;
  videoFile?: File;
  videoBlob?: Blob;
  youtubeVideoId?: string | null;
  youtubeStartTime?: number | null;
  youtubeEndTime?: number | null;
  videoDisplayMode?: 'inline' | 'modal' | 'overlay';
  videoShowControls?: boolean;
  videoPoster?: string;

  // === UNIFIED AUDIO PROPERTIES ===
  audioUrl?: string;
  audioDisplayMode?: 'background' | 'modal' | 'mini-player';
  audioShowControls?: boolean;
  audioStartTime?: number;
  audioEndTime?: number;
  audioTitle?: string;
  audioArtist?: string;
  autoStartPlayback?: boolean;
  allowPlaybackSpeedAdjustment?: boolean;
  showSubtitles?: boolean;
  includeQuiz?: boolean;
  questions?: QuizQuestion[];

  // === UNIFIED TEXT PROPERTIES ===
  textContent?: string;
  textX?: number;        // Position X (percentage)
  textY?: number;        // Position Y (percentage)
  textWidth?: number;    // Width in pixels
  textHeight?: number;   // Height in pixels
  textPosition?: 'center' | 'custom';

  // === UNIFIED SPOTLIGHT PROPERTIES ===
  spotlightShape?: SpotlightShape;
  spotlightX?: number;           // Center X (percentage) - optional, inherits from hotspot if not provided
  spotlightY?: number;           // Center Y (percentage) - optional, inherits from hotspot if not provided
  spotlightWidth?: number;       // Width in pixels
  spotlightHeight?: number;      // Height in pixels
  backgroundDimPercentage?: number; // 0-100 (how much to dim background)
  spotlightOpacity?: number;     // Always 0 for spotlighted area

  // === UNIFIED PAN_ZOOM PROPERTIES ===
  zoomLevel?: number;    // Zoom level for pan/zoom events (default: 2.0)
  zoom?: number;         // Alias for zoomLevel for backwards compatibility
  targetX?: number;      // Pan/zoom target X coordinate (0-100 percentage, defaults to hotspot center)
  targetY?: number;      // Pan/zoom target Y coordinate (0-100 percentage, defaults to hotspot center)
  smooth?: boolean;      // Smooth zoom animation (default: true)

  // === ENHANCED MEDIA QUIZ PROPERTIES ===
  quizTriggers?: MediaQuizTrigger[];
  allowSeeking?: boolean; // prevent skipping past incomplete quizzes
  enforceQuizCompletion?: boolean; // must complete all quizzes to continue
  quizMode?: 'overlay' | 'modal' | 'inline'; // how to display quiz

  // === COMMON PROPERTIES ===
  showTextBanner?: boolean; // New: Toggle for text banner display
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
  intensity?: number;    // For pulse effects

  // Quiz properties
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectAnswer?: number;
  quizExplanation?: string;
  quizShuffleOptions?: boolean;
  questionType?: QuestionType;
  isSubjective?: boolean;

  // Image properties
  imageUrl?: string;
  caption?: string;
  imageDisplayMode?: ImageDisplayMode;

  // Reference code integration properties
  shape?: 'circle' | 'rectangle';
  opacity?: number;
  position?: Position;
  size?: Size;
  content?: string;
  modalPosition?: Position | 'center';
  modalSize?: Size;
  url?: string;
  targetHotspotId?: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;

  // Enhanced positioning system
  positioningVersion?: 'enhanced' | 'legacy';
  constraintsApplied?: boolean;

  // Legacy fields (keep for migration compatibility)
  message?: string;
  mediaType?: 'image' | 'youtube' | 'mp4' | 'audio';
  mediaUrl?: string;
  poster?: string;
  artist?: string;
  zoomFactor?: number;   // Legacy - use zoomLevel instead
  highlightRadius?: number; // Legacy - use spotlightWidth/Height instead
  highlightShape?: 'circle' | 'rectangle' | 'oval'; // Legacy - use spotlightShape instead
  dimPercentage?: number; // Legacy - use backgroundDimPercentage instead
  radius?: number;       // Legacy pulse radius
}
