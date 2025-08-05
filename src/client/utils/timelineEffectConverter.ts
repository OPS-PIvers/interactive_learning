import { SlideEffect, SlideElement, SlideDeck } from '../../shared/slideTypes';
import { TimelineEventData } from '../../shared/types';
import { generateId } from './generateId';

/**
 * Converts timeline events to slide effects for proper animation rendering
 */

interface TimelineEventToEffectOptions {
  slideDeck: SlideDeck;
  currentSlideIndex: number;
  targetElement?: SlideElement;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

/**
 * Converts a timeline event to a proper SlideEffect
 */
export function convertTimelineEventToSlideEffect(
  timelineEvent: TimelineEventData,
  options: TimelineEventToEffectOptions
): SlideEffect | null {
  const { slideDeck, currentSlideIndex, targetElement, deviceType = 'desktop' } = options;
  const currentSlide = slideDeck.slides[currentSlideIndex];
  
  if (!currentSlide) {
    console.warn('[TimelineConverter] No current slide found');
    return null;
  }
  
  // Find target element if not provided
  let element = targetElement;
  if (!element && timelineEvent.targetId) {
    element = currentSlide.elements?.find(el => el.id === timelineEvent.targetId);
  }
  
  console.log('[TimelineConverter] Converting timeline event:', timelineEvent);
  console.log('[TimelineConverter] Target element:', element);
  console.log('[TimelineConverter] Device type:', deviceType);
  
  // Convert based on timeline event type
  switch (timelineEvent.type) {
    case 'SPOTLIGHT':
      return createSpotlightEffect(timelineEvent, element, deviceType);
      
    case 'PAN_ZOOM_TO_HOTSPOT':
    case 'PAN_ZOOM':
      return createPanZoomEffect(timelineEvent, element, deviceType);
      
    case 'SHOW_MESSAGE':
      return createShowTextEffect(timelineEvent, element, deviceType);
      
    case 'SHOW_VIDEO':
    case 'SHOW_AUDIO_MODAL':
      return createPlayMediaEffect(timelineEvent);
      
    case 'SHOW_YOUTUBE':
      return createPlayMediaEffect(timelineEvent, 'youtube');
      
    default:
      console.warn('[TimelineConverter] Unknown timeline event type:', timelineEvent.type);
      return createDefaultSpotlightEffect(timelineEvent, element, deviceType);
  }
}

/**
 * Creates a spotlight effect from timeline event
 */
function createSpotlightEffect(
  timelineEvent: TimelineEventData,
  element?: SlideElement,
  deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'
): SlideEffect {
  let position = {
    x: 300,
    y: 200,
    width: 200,
    height: 200
  };
  
  if (element) {
    // Use element position for the appropriate device and make it slightly larger for spotlight
    const elementPos = element.position[deviceType];
    position = {
      x: elementPos.x - 50,
      y: elementPos.y - 50,
      width: elementPos.width + 100,
      height: elementPos.height + 100
    };
  } else if (timelineEvent.spotlightX !== undefined && timelineEvent.spotlightY !== undefined) {
    // Use specific spotlight coordinates
    position = {
      x: timelineEvent.spotlightX - 100,
      y: timelineEvent.spotlightY - 100,
      width: 200,
      height: 200
    };
  }
  
  return {
    id: generateId(),
    type: 'spotlight',
    duration: 3000,
    parameters: {
      position,
      shape: 'circle' as const,
      intensity: 80,
      fadeEdges: true,
      message: timelineEvent.message
    },
    easing: 'easeInOut'
  };
}

/**
 * Creates a pan/zoom effect from timeline event
 */
function createPanZoomEffect(
  timelineEvent: TimelineEventData,
  element?: SlideElement,
  deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'
): SlideEffect {
  let targetPosition = {
    x: 300,
    y: 200,
    width: 400,
    height: 300
  };
  let zoomLevel = 1.5;
  
  if (element) {
    // Use element position as target for the appropriate device
    const elementPos = element.position[deviceType];
    targetPosition = {
      x: elementPos.x - 100,
      y: elementPos.y - 100,
      width: elementPos.width + 200,
      height: elementPos.height + 200
    };
  } else if (timelineEvent.targetX !== undefined && timelineEvent.targetY !== undefined) {
    targetPosition = {
      x: timelineEvent.targetX - 200,
      y: timelineEvent.targetY - 150,
      width: 400,
      height: 300
    };
  }
  
  if (timelineEvent.zoomFactor) {
    zoomLevel = timelineEvent.zoomFactor;
  }
  
  return {
    id: generateId(),
    type: 'pan_zoom',
    duration: 2000,
    parameters: {
      targetPosition,
      zoomLevel,
      duration: 2000,
      easing: 'easeInOut',
      returnToOriginal: false
    },
    easing: 'easeInOut'
  };
}

/**
 * Creates a show text effect from timeline event
 */
function createShowTextEffect(
  timelineEvent: TimelineEventData,
  element?: SlideElement,
  deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'
): SlideEffect {
  const text = timelineEvent.message || element?.content?.title || element?.content?.description || 'Message';
  
  let position = {
    x: 200,
    y: 200,
    width: 400,
    height: 100
  };
  
  if (element) {
    const elementPos = element.position[deviceType];
    position = {
      x: elementPos.x,
      y: elementPos.y - 120, // Show above element
      width: Math.max(400, elementPos.width),
      height: 100
    };
  }
  
  return {
    id: generateId(),
    type: 'show_text',
    duration: 5000,
    parameters: {
      text,
      position,
      style: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: 20,
        borderRadius: 12,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center' as const
      }
    },
    easing: 'easeInOut'
  };
}

/**
 * Creates a play media effect from timeline event
 */
function createPlayMediaEffect(
  timelineEvent: TimelineEventData,
  mediaType?: 'youtube'
): SlideEffect {
  let mediaUrl = '';
  let actualMediaType = 'video';
  
  if (mediaType === 'youtube' && timelineEvent.youtubeVideoId) {
    mediaUrl = `https://www.youtube.com/embed/${timelineEvent.youtubeVideoId}`;
    actualMediaType = 'video';
  } else if (timelineEvent.videoUrl) {
    mediaUrl = timelineEvent.videoUrl;
    actualMediaType = 'video';
  } else if (timelineEvent.audioUrl) {
    mediaUrl = timelineEvent.audioUrl;
    actualMediaType = 'audio';
  }
  
  return {
    id: generateId(),
    type: 'play_media',
    duration: 0, // Duration depends on media
    parameters: {
      mediaType: actualMediaType as 'audio' | 'video',
      mediaUrl,
      autoplay: timelineEvent.autoplay || false,
      controls: true
    },
    easing: 'easeInOut'
  };
}

/**
 * Creates a default spotlight effect when timeline event type is unknown
 */
function createDefaultSpotlightEffect(
  timelineEvent: TimelineEventData,
  element?: SlideElement,
  deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'
): SlideEffect {
  console.log('[TimelineConverter] Creating default spotlight effect for unknown event type');
  return createSpotlightEffect(timelineEvent, element, deviceType);
}

/**
 * Creates a slide effect from an element's first interaction
 */
export function createSlideEffectFromElement(
  element: SlideElement, 
  deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop'
): SlideEffect | null {
  const clickInteraction = element.interactions?.find(
    interaction => interaction.trigger === 'click'
  );
  
  if (clickInteraction) {
    return clickInteraction.effect ?? null;
  }
  
  // Create default spotlight effect
  return createSpotlightEffect({
    id: generateId(),
    step: 1,
    name: element.content?.title || 'Element Effect',
    type: 'SPOTLIGHT'
  } as TimelineEventData, element, deviceType);
}