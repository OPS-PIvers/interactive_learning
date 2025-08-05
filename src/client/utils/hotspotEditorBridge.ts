/**
 * Hotspot Editor Bridge
 * 
 * Provides conversion utilities between the modern slide-based architecture
 * and the legacy HotspotEditorModal interface. This enables seamless integration
 * of the existing hotspot editor with the new unified slide system.
 */

import { SlideElement, SlideDeck, InteractiveSlide, DeviceType, FixedPosition, ElementInteraction, SlideEffect, EffectParameters, SpotlightParameters, ZoomParameters, ShowTextParameters, PlayMediaParameters, TextStyle, SlideEffectType } from '../../shared/slideTypes';
import { HotspotData, TimelineEventData, HotspotSize } from '../../shared/types';
import { InteractionType } from '../../shared/InteractionPresets';
import { defaultHotspotSize, getHotspotPixelDimensions } from '../../shared/hotspotStylePresets';

/**
 * Convert slide element to legacy hotspot data for the editor
 */
export function slideElementToHotspotData(
  element: SlideElement,
  deviceType: DeviceType,
  canvasDimensions: { width: number; height: number }
): HotspotData {
  if (element.type !== 'hotspot') {
    throw new Error('Only hotspot elements can be converted to HotspotData');
  }

  const position = element.position[deviceType];
  
  // Convert pixel position back to percentage for legacy editor
  const x = Math.round((position.x / canvasDimensions.width) * 100);
  const y = Math.round((position.y / canvasDimensions.height) * 100);

  // Extract hotspot properties from element
  const hotspotData: HotspotData = {
    id: element.id,
    x: Math.max(0, Math.min(100, x)), // Clamp to 0-100
    y: Math.max(0, Math.min(100, y)), // Clamp to 0-100
    title: element.content?.title || 'Hotspot',
    description: element.content?.description || '',
    color: element.style?.backgroundColor || '#3b82f6',
    size: (element.style?.size || 'medium') as HotspotSize,
    displayHotspotInEvent: element.style?.displayInEvent || false,
    pulseAnimation: element.style?.pulseAnimation || false,
    pulseType: element.style?.pulseType || 'loop',
    ...(element.style?.pulseDuration && { pulseDuration: element.style.pulseDuration }),
    ...(element.content?.link && { link: element.content.link }),
  };

  return hotspotData;
}

/**
 * Convert legacy hotspot data back to slide element
 */
export function hotspotDataToSlideElement(
  hotspotData: HotspotData,
  deviceType: DeviceType,
  canvasDimensions: { width: number; height: number },
  existingElement?: SlideElement
): SlideElement {
  // Calculate pixel position from percentage
  const isMobile = deviceType === 'mobile';
  const dimensions = getHotspotPixelDimensions(hotspotData.size || defaultHotspotSize, isMobile);
  
  const pixelX = Math.round((hotspotData.x / 100) * canvasDimensions.width - dimensions.width / 2);
  const pixelY = Math.round((hotspotData.y / 100) * canvasDimensions.height - dimensions.height / 2);

  const newPosition: FixedPosition = {
    x: Math.max(0, pixelX),
    y: Math.max(0, pixelY),
    width: dimensions.width,
    height: dimensions.height,
  };

  // Create new element or update existing one
  const element: SlideElement = {
    id: hotspotData.id,
    type: 'hotspot',
    position: existingElement?.position || {
      desktop: newPosition,
      tablet: newPosition,
      mobile: newPosition,
    },
    content: {
      title: hotspotData.title,
      description: hotspotData.description,
      ...(hotspotData.link && { link: hotspotData.link }),
    },
    style: {
      ...(hotspotData.color && { backgroundColor: hotspotData.color }),
      size: (hotspotData.size === 'x-small' ? 'small' : hotspotData.size) as 'small' | 'medium' | 'large',
      ...(hotspotData.displayHotspotInEvent && { displayInEvent: hotspotData.displayHotspotInEvent }),
      ...(hotspotData.pulseAnimation && { pulseAnimation: hotspotData.pulseAnimation }),
      ...(hotspotData.pulseType && { pulseType: hotspotData.pulseType }),
      ...(hotspotData.pulseDuration && { pulseDuration: hotspotData.pulseDuration }),
    },
    interactions: existingElement?.interactions || [],
    isVisible: existingElement?.isVisible !== false,
  };

  // Update position for the specific device type
  element.position[deviceType] = newPosition;

  return element;
}

/**
 * Extract timeline events related to a hotspot from slide element interactions
 */
export function extractTimelineEventsFromElement(
  element: SlideElement,
  currentStep: number = 1
): TimelineEventData[] {
  if (!element.interactions || element.interactions.length === 0) {
    return [];
  }

  const events: TimelineEventData[] = [];

  element.interactions.forEach((interaction, index) => {
    const effect = interaction.effect;
    
    let event: TimelineEventData = {
      id: effect.id,
      step: currentStep + index,
      name: `${element.content?.title || 'Hotspot'} - ${effect.type}`,
      type: mapEffectTypeToInteractionType(effect.type),
      targetId: element.id,
      duration: effect.duration,
    };

    // Map effect parameters to event properties based on effect type
    switch (effect.type) {
      case 'spotlight':
        const spotlightParams = effect.parameters as SpotlightParameters;
        if (spotlightParams.position && typeof spotlightParams.position === 'object') {
          const pos = spotlightParams.position as FixedPosition;
          event = {
            ...event,
            spotlightShape: spotlightParams.shape || 'circle',
            spotlightX: pos.x,
            spotlightY: pos.y,
            spotlightWidth: pos.width,
            spotlightHeight: pos.height,
            backgroundDimPercentage: (spotlightParams.intensity || 0.8) * 100,
          };
        }
        break;

      case 'zoom':
        const zoomParams = effect.parameters as ZoomParameters;
        if (zoomParams.targetPosition) {
          event = {
            ...event,
            zoomLevel: zoomParams.zoomLevel || 2,
            targetX: zoomParams.targetPosition.x,
            targetY: zoomParams.targetPosition.y,
            smooth: true, // `smooth` is not on ZoomParameters, but is on TimelineEventData.
          };
        }
        break;

      case 'show_text':
        const showTextParams = effect.parameters as ShowTextParameters;
        event = {
          ...event,
          textContent: showTextParams.text || '',
          textPosition: 'custom',
        };
        if (typeof showTextParams.position === 'object') {
          const pos = showTextParams.position as FixedPosition;
          event.textX = pos.x;
          event.textY = pos.y;
          event.textWidth = pos.width;
          event.textHeight = pos.height;
        }
        break;

      case 'play_media':
        const playMediaParams = effect.parameters as PlayMediaParameters;
        event = {
          ...event,
          type: playMediaParams.mediaType === 'video' ? InteractionType.PLAY_VIDEO : InteractionType.PLAY_AUDIO,
          autoplay: playMediaParams.autoplay !== false,
          loop: false,
          volume: playMediaParams.volume || 1.0,
        };
        
        if (playMediaParams.mediaType === 'video') {
          event.videoUrl = playMediaParams.mediaUrl;
          event.videoShowControls = playMediaParams.controls !== false;
          event.videoDisplayMode = 'modal';
        } else {
          event.audioUrl = playMediaParams.mediaUrl;
          event.audioShowControls = playMediaParams.controls !== false;
          event.audioDisplayMode = 'background';
        }
        break;
    }

    events.push(event);
  });

  return events;
}

/**
 * Map slide effect type to interaction type
 */
function mapEffectTypeToInteractionType(effectType: SlideEffectType): InteractionType {
  switch (effectType) {
    case 'spotlight':
      return InteractionType.SPOTLIGHT;
    case 'zoom':
    case 'pan_zoom':
      return InteractionType.PAN_ZOOM;
    case 'show_text':
      return InteractionType.SHOW_TEXT;
    case 'play_media':
      return InteractionType.PLAY_VIDEO; // Default to video, will be refined by parameters
    case 'play_video':
      return InteractionType.PLAY_VIDEO;
    case 'play_audio':
      return InteractionType.PLAY_AUDIO;
    default:
      return InteractionType.SHOW_TEXT; // Fallback
  }
}

/**
 * Convert timeline event to slide interaction
 */
export function timelineEventToSlideInteraction(event: TimelineEventData): ElementInteraction {
  const baseInteraction: ElementInteraction = {
    id: event.id,
    trigger: 'click' as const,
    effect: {
      id: `effect_${event.id}`,
      type: mapInteractionTypeToEffectType(event.type),
      duration: event.duration || 3000,
      parameters: {} as any,
    },
  };

  // Map event properties to effect parameters
  const defaultTextStyle: TextStyle = {
    fontSize: 16,
    color: '#000000',
  };

  switch (event.type) {
    case InteractionType.SPOTLIGHT:
      baseInteraction.effect.parameters = {
        shape: event.spotlightShape || 'circle',
        position: {
          x: event.spotlightX || 0,
          y: event.spotlightY || 0,
          width: event.spotlightWidth || 100,
          height: event.spotlightHeight || 100,
        },
        intensity: (event.backgroundDimPercentage || 80) / 100,
        fadeEdges: false,
      } as SpotlightParameters;
      break;

    case InteractionType.PAN_ZOOM:
      baseInteraction.effect.parameters = {
        targetPosition: {
          x: event.targetX || 0,
          y: event.targetY || 0,
          width: 100,
          height: 100,
        },
        zoomLevel: event.zoomLevel || 2,
        centerOnTarget: true,
      } as ZoomParameters;
      break;

    case InteractionType.SHOW_TEXT:
      let position: FixedPosition;
      if (event.textPosition === 'center') {
        position = { x: 45, y: 45, width: 10, height: 10 }; // Default centered position
      } else {
        position = {
          x: event.textX || 0,
          y: event.textY || 0,
          width: event.textWidth || 300,
          height: event.textHeight || 100,
        };
      }
      baseInteraction.effect.parameters = {
        text: event.textContent || '',
        position: position,
        style: defaultTextStyle,
      } as ShowTextParameters;
      break;

    case InteractionType.PLAY_VIDEO:
      baseInteraction.effect.parameters = {
        mediaUrl: event.videoUrl || '',
        mediaType: 'video',
        autoplay: event.autoplay !== false,
        controls: event.videoShowControls !== false,
        loop: event.loop || false,
      } as PlayMediaParameters;
      break;

    case InteractionType.PLAY_AUDIO:
      baseInteraction.effect.parameters = {
        mediaUrl: event.audioUrl || '',
        mediaType: 'audio',
        autoplay: event.autoplay !== false,
        controls: event.audioShowControls !== false,
        loop: event.loop || false,
      } as PlayMediaParameters;
      break;
  }

  return baseInteraction;
}

/**
 * Map interaction type to effect type
 */
function mapInteractionTypeToEffectType(interactionType: InteractionType): SlideEffectType {
  switch (interactionType) {
    case InteractionType.SPOTLIGHT:
      return 'spotlight';
    case InteractionType.PAN_ZOOM:
      return 'zoom';
    case InteractionType.SHOW_TEXT:
      return 'show_text';
    case InteractionType.PLAY_VIDEO:
      return 'play_media';
    case InteractionType.PLAY_AUDIO:
      return 'play_media';
    default:
      return 'show_text';
  }
}

/**
 * Get all hotspot elements from a slide
 */
export function getHotspotsFromSlide(slide: InteractiveSlide): SlideElement[] {
  return slide.elements?.filter(element => element.type === 'hotspot') || [];
}

/**
 * Get canvas dimensions from slide layout
 */
export function getCanvasDimensionsFromSlide(
  slide: InteractiveSlide,
  containerDimensions: { width: number; height: number }
): { width: number; height: number } {
  const aspectRatio = slide.layout?.aspectRatio || '16:9';
  
  // Parse aspect ratio
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
  const ratio = widthRatio / heightRatio;
  
  // Calculate canvas dimensions maintaining aspect ratio
  let canvasWidth = containerDimensions.width;
  let canvasHeight = containerDimensions.width / ratio;
  
  if (canvasHeight > containerDimensions.height) {
    canvasHeight = containerDimensions.height;
    canvasWidth = containerDimensions.height * ratio;
  }
  
  return {
    width: Math.round(canvasWidth),
    height: Math.round(canvasHeight),
  };
}