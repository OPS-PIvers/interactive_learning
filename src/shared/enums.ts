// Proper enum for production build compatibility (fixes TDZ issue)
export enum InteractionType {
  // Essential interaction types
  PAN_ZOOM = 'PAN_ZOOM',
  PAN_ZOOM_TO_HOTSPOT = 'PAN_ZOOM_TO_HOTSPOT',
  SHOW_IMAGE = 'SHOW_IMAGE',
  QUIZ = 'QUIZ',
  
  // === UNIFIED EVENT TYPES ===
  PLAY_VIDEO = 'PLAY_VIDEO',
  PLAY_AUDIO = 'PLAY_AUDIO',
  SHOW_TEXT = 'SHOW_TEXT',
  SHOW_MESSAGE = 'SHOW_MESSAGE',
  SPOTLIGHT = 'SPOTLIGHT',
  
  // === MEDIA INTERACTION TYPES ===
  SHOW_VIDEO = 'SHOW_VIDEO',
  SHOW_AUDIO_MODAL = 'SHOW_AUDIO_MODAL',
  SHOW_YOUTUBE = 'SHOW_YOUTUBE',
  
  // === SLIDE-BASED INTERACTION TYPES ===
  MODAL = 'modal',
  TRANSITION = 'transition', 
  SOUND = 'sound',
  TOOLTIP = 'tooltip',
  
  // === ADDITIONAL INTERACTION TYPES ===
  SHOW_TEXT_LOWERCASE = 'showText',
  HIDE_ELEMENT = 'hideElement',
  SHOW_ELEMENT = 'showElement', 
  HIGHLIGHT = 'highlight',
  ANIMATION = 'animation',
  QUIZ_LOWERCASE = 'quiz',
  JUMP = 'jump',
  PLAY_AUDIO_LOWERCASE = 'playAudio',
  PAUSE_AUDIO = 'pauseAudio',
  PAN_ZOOM_LOWERCASE = 'panZoom'
}

// Default export for maximum compatibility
export default InteractionType;