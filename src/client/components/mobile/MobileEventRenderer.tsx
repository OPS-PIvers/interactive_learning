import React from 'react';
import { TimelineEventData, InteractionType } from '../../../shared/types';
import MobileSpotlightOverlay from './MobileSpotlightOverlay';
import MobilePanZoomHandler from './MobilePanZoomHandler';
import MobileTextModal from './MobileTextModal';
import MobileQuizModal from './MobileQuizModal';
import MobileImageModal from './MobileImageModal';
import MobileVideoModal from './MobileVideoModal';
import MobileAudioModal from './MobileAudioModal';

interface MobileEventRendererProps {
  events: TimelineEventData[];
  onEventComplete?: (eventId: string) => void;
  imageContainerRef: React.RefObject<HTMLElement>;
  isActive: boolean;
}

export const MobileEventRenderer: React.FC<MobileEventRendererProps> = ({
  events,
  onEventComplete,
  imageContainerRef,
  isActive
}) => {
  const renderEventType = (event: TimelineEventData) => {
    if (!isActive) return null;
    
    switch (event.type) {
      case InteractionType.SPOTLIGHT:
        return (
          <MobileSpotlightOverlay
            key={`spotlight-${event.id}`}
            event={event}
            containerRef={imageContainerRef}
            onComplete={() => onEventComplete?.(event.id)}
          />
        );
      
      case InteractionType.PAN_ZOOM:
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        return (
          <MobilePanZoomHandler
            key={`pan-zoom-${event.id}`}
            event={event}
            containerRef={imageContainerRef}
            onComplete={() => onEventComplete?.(event.id)}
          />
        );
      
      case InteractionType.SHOW_TEXT:
      case InteractionType.SHOW_MESSAGE:
        return (
          <MobileTextModal
            key={`text-${event.id}`}
            event={event}
            onComplete={() => onEventComplete?.(event.id)}
          />
        );
      
      case InteractionType.QUIZ:
        return (
          <MobileQuizModal
            key={`quiz-${event.id}`}
            event={event}
            onComplete={() => onEventComplete?.(event.id)}
          />
        );
      
      case InteractionType.SHOW_IMAGE:
      case InteractionType.SHOW_IMAGE_MODAL:
        return (
          <MobileImageModal
            key={`image-${event.id}`}
            event={event}
            onComplete={() => onEventComplete?.(event.id)}
          />
        );
      
      case InteractionType.SHOW_VIDEO:
      case InteractionType.SHOW_YOUTUBE:
      case InteractionType.PLAY_VIDEO:
        return (
          <MobileVideoModal
            key={`video-${event.id}`}
            event={event}
            onComplete={() => onEventComplete?.(event.id)}
          />
        );
      
      case InteractionType.SHOW_AUDIO_MODAL:
      case InteractionType.PLAY_AUDIO:
        return (
          <MobileAudioModal
            key={`audio-${event.id}`}
            event={event}
            onComplete={() => onEventComplete?.(event.id)}
          />
        );
      
      case InteractionType.PULSE_HOTSPOT:
      case InteractionType.HIGHLIGHT_HOTSPOT:
      case InteractionType.PULSE_HIGHLIGHT:
        return (
          <MobileSpotlightOverlay
            key={`highlight-${event.id}`}
            event={event}
            containerRef={imageContainerRef}
            onComplete={() => onEventComplete?.(event.id)}
          />
        );
      
      default:
        console.warn(`Unsupported mobile event type: ${event.type}`);
        return null;
    }
  };

  return (
    <div className="mobile-event-renderer">
      {events.map(event => (
        <div key={event.id} className="mobile-event-wrapper">
          {renderEventType(event)}
        </div>
      ))}
    </div>
  );
};

export default MobileEventRenderer;