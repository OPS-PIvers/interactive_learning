import React, { useState, useMemo } from 'react';
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

const MODAL_INTERACTIONS = new Set([
  InteractionType.SHOW_TEXT,
  InteractionType.SHOW_MESSAGE,
  InteractionType.QUIZ,
  InteractionType.SHOW_IMAGE,
  InteractionType.SHOW_IMAGE_MODAL,
  InteractionType.SHOW_VIDEO,
  InteractionType.SHOW_YOUTUBE,
  InteractionType.PLAY_VIDEO,
  InteractionType.SHOW_AUDIO_MODAL,
  InteractionType.PLAY_AUDIO,
]);

export const MobileEventRenderer: React.FC<MobileEventRendererProps> = ({
  events,
  onEventComplete,
  imageContainerRef,
  isActive
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const activeEvents = useMemo(() => {
    if (!isActive) return [];

    const modalEvent = events.find(e => MODAL_INTERACTIONS.has(e.type));
    if (modalEvent) {
      if (activeModal !== modalEvent.id) {
        setActiveModal(modalEvent.id);
      }
      return [modalEvent];
    }

    // If no modal events, allow all non-modal events to be active
    setActiveModal(null);
    return events.filter(e => !MODAL_INTERACTIONS.has(e.type));
  }, [events, isActive, activeModal]);

  const renderEventType = (event: TimelineEventData) => {
    const isEventActive = activeEvents.some(e => e.id === event.id);
    if (!isEventActive) return null;

    const handleComplete = () => {
      onEventComplete?.(event.id);
      if (MODAL_INTERACTIONS.has(event.type)) {
        setActiveModal(null);
      }
    };
    
    switch (event.type) {
      case InteractionType.SPOTLIGHT:
        return (
          <MobileSpotlightOverlay
            key={`spotlight-${event.id}`}
            event={event}
            containerRef={imageContainerRef}
            onComplete={handleComplete}
          />
        );
      
      case InteractionType.PAN_ZOOM:
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        return (
          <MobilePanZoomHandler
            key={`pan-zoom-${event.id}`}
            event={event}
            containerRef={imageContainerRef}
            onComplete={handleComplete}
          />
        );
      
      case InteractionType.SHOW_TEXT:
      case InteractionType.SHOW_MESSAGE:
        return (
          <MobileTextModal
            key={`text-${event.id}`}
            event={event}
            onComplete={handleComplete}
          />
        );
      
      case InteractionType.QUIZ:
        return (
          <MobileQuizModal
            key={`quiz-${event.id}`}
            event={event}
            onComplete={handleComplete}
          />
        );
      
      case InteractionType.SHOW_IMAGE:
      case InteractionType.SHOW_IMAGE_MODAL:
        return (
          <MobileImageModal
            key={`image-${event.id}`}
            event={event}
            onComplete={handleComplete}
          />
        );
      
      case InteractionType.SHOW_VIDEO:
      case InteractionType.SHOW_YOUTUBE:
      case InteractionType.PLAY_VIDEO:
        return (
          <MobileVideoModal
            key={`video-${event.id}`}
            event={event}
            onComplete={handleComplete}
          />
        );
      
      case InteractionType.SHOW_AUDIO_MODAL:
      case InteractionType.PLAY_AUDIO:
        return (
          <MobileAudioModal
            key={`audio-${event.id}`}
            event={event}
            onComplete={handleComplete}
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
            onComplete={handleComplete}
          />
        );
      
      default:
        console.warn(`Unsupported mobile event type: ${event.type}`);
        return null;
    }
  };

  return (
    <div className="mobile-event-renderer">
      {events.map((event, index) => {
        const isModal = MODAL_INTERACTIONS.has(event.type);
        const zIndex = 100 + index;
        return (
          <div
            key={event.id}
            className="mobile-event-wrapper"
            style={{
              zIndex: isModal ? 1000 : zIndex,
              position: 'relative',
            }}
          >
            {renderEventType(event)}
          </div>
        );
      })}
    </div>
  );
};

export default MobileEventRenderer;