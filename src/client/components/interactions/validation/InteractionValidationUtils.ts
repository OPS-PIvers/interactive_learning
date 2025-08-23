import { TimelineEventData, InteractionType } from '../../../../shared/type-defs';

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
}

// Parameter validation functions
export const validateTextParameters = (event: TimelineEventData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!event.textContent?.trim()) {
    errors.push({ field: 'textContent', message: 'Text content is required' });
  }

  if (event.textPosition === 'custom') {
    if (typeof event.textX !== 'number' || event.textX < 0 || event.textX > 100) {
      errors.push({ field: 'textX', message: 'X position must be between 0 and 100' });
    }
    if (typeof event.textY !== 'number' || event.textY < 0 || event.textY > 100) {
      errors.push({ field: 'textY', message: 'Y position must be between 0 and 100' });
    }
  }

  if (event.textWidth && (event.textWidth < 50 || event.textWidth > 1200)) {
    errors.push({ field: 'textWidth', message: 'Width must be between 50 and 1200 pixels' });
  }

  if (event.textHeight && (event.textHeight < 20 || event.textHeight > 800)) {
    errors.push({ field: 'textHeight', message: 'Height must be between 20 and 800 pixels' });
  }

  return errors;
};

export const validateAudioParameters = (event: TimelineEventData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!event.audioUrl?.trim()) {
    errors.push({ field: 'audioUrl', message: 'Audio URL is required' });
  } else {
    try {
      const url = new URL(event.audioUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push({ field: 'audioUrl', message: 'Audio URL must use HTTP or HTTPS' });
      }
    } catch {
      errors.push({ field: 'audioUrl', message: 'Invalid audio URL format' });
    }
  }

  if (event.volume !== undefined && (event.volume < 0 || event.volume > 100)) {
    errors.push({ field: 'volume', message: 'Volume must be between 0 and 100' });
  }

  return errors;
};

export const validateVideoParameters = (event: TimelineEventData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!event.videoUrl?.trim()) {
    errors.push({ field: 'videoUrl', message: 'Video URL is required' });
  } else {
    try {
      const url = new URL(event.videoUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push({ field: 'videoUrl', message: 'Video URL must use HTTP or HTTPS' });
      }
    } catch {
      errors.push({ field: 'videoUrl', message: 'Invalid video URL format' });
    }
  }

  return errors;
};

export const validatePanZoomParameters = (event: TimelineEventData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (event.zoomLevel !== undefined && (event.zoomLevel < 0.1 || event.zoomLevel > 10)) {
    errors.push({ field: 'zoomLevel', message: 'Zoom level must be between 0.1 and 10' });
  }

  if (event.targetX !== undefined && (event.targetX < 0 || event.targetX > 100)) {
    errors.push({ field: 'targetX', message: 'Target X must be between 0 and 100' });
  }

  if (event.targetY !== undefined && (event.targetY < 0 || event.targetY > 100)) {
    errors.push({ field: 'targetY', message: 'Target Y must be between 0 and 100' });
  }

  return errors;
};

export const validateSpotlightParameters = (event: TimelineEventData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (event.backgroundDimPercentage !== undefined && (event.backgroundDimPercentage < 0 || event.backgroundDimPercentage > 100)) {
    errors.push({ field: 'backgroundDimPercentage', message: 'Dim percentage must be between 0 and 100' });
  }

  if (event.spotlightWidth !== undefined && (event.spotlightWidth < 10 || event.spotlightWidth > 1000)) {
    errors.push({ field: 'spotlightWidth', message: 'Spotlight width must be between 10 and 1000 pixels' });
  }

  if (event.spotlightHeight !== undefined && (event.spotlightHeight < 10 || event.spotlightHeight > 1000)) {
    errors.push({ field: 'spotlightHeight', message: 'Spotlight height must be between 10 and 1000 pixels' });
  }

  return errors;
};

export const validateQuizParameters = (event: TimelineEventData): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!event.quizQuestion?.trim()) {
    errors.push({ field: 'quizQuestion', message: 'Quiz question is required' });
  }

  if (!event.quizOptions || event.quizOptions.length < 2) {
    errors.push({ field: 'quizOptions', message: 'At least 2 quiz options are required' });
  } else {
    event.quizOptions.forEach((option, index) => {
      if (!option?.trim()) {
        errors.push({ field: `quizOption${index}`, message: `Option ${index + 1} cannot be empty` });
      }
    });
  }

  if (event.quizCorrectAnswer === undefined ||
      event.quizCorrectAnswer < 0 ||
      event.quizCorrectAnswer >= (event.quizOptions?.length || 0)) {
    errors.push({ field: 'quizCorrectAnswer', message: 'Valid correct answer must be selected' });
  }

  return errors;
};

// Main validation function
export const validateEventParameters = (event: TimelineEventData): ValidationError[] => {
  switch (event.type) {
    case InteractionType.TEXT:
      return validateTextParameters(event);
    case InteractionType.AUDIO:
      return validateAudioParameters(event);
    case InteractionType.VIDEO:
      return validateVideoParameters(event);
    case InteractionType.PAN_ZOOM:
      return validatePanZoomParameters(event);
    case InteractionType.SPOTLIGHT:
      return validateSpotlightParameters(event);
    case InteractionType.QUIZ:
      return validateQuizParameters(event);
    default:
      return [];
  }
};
