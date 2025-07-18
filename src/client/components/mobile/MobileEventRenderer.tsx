import React, { useState, useMemo, useEffect } from 'react';
import { TimelineEventData, InteractionType } from '../../../shared/types';
import { Z_INDEX } from '../../constants/interactionConstants';
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
  // Add these for coordination
  currentTransform?: { scale: number; translateX: number; translateY: number };
  onTransformUpdate?: (transform: { scale: number; translateX: number; translateY: number }) => void;
  isGestureActive?: boolean;
  isVisible?: boolean; // Controls visibility without affecting hook execution
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

// Separate visual overlay events from modal events
const VISUAL_OVERLAY_EVENTS = new Set([
  InteractionType.SPOTLIGHT,
  InteractionType.HIGHLIGHT_HOTSPOT,
  InteractionType.PULSE_HOTSPOT,
  InteractionType.PULSE_HIGHLIGHT,
  InteractionType.PAN_ZOOM,
  InteractionType.PAN_ZOOM_TO_HOTSPOT,
]);

export const MobileEventRenderer: React.FC<MobileEventRendererProps> = ({
  events,
  onEventComplete,
  imageContainerRef,
  isActive,
  currentTransform,
  onTransformUpdate,
  isGestureActive
}) => {
  const [modalQueue, setModalQueue] = useState<TimelineEventData[]>([]);
  const [currentModalIndex, setCurrentModalIndex] = useState<number>(0);

  // Update modal queue when events change
  useEffect(() => {
    if (!isActive) {
      setModalQueue([]);
      setCurrentModalIndex(0);
      return;
    }

    const modalEvents = events.filter(e => MODAL_INTERACTIONS.has(e.type));
    if (modalEvents.length > 0) {
      setModalQueue(modalEvents);
      setCurrentModalIndex(0);
    } else {
      setModalQueue([]);
      setCurrentModalIndex(0);
    }
  }, [events, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setModalQueue([]);
      setCurrentModalIndex(0);
    };
  }, []);

  const activeEvents = useMemo(() => {
    if (!isActive) return [];

    // Get visual events that should always be active
    const visualEvents = events.filter(e => 
      VISUAL_OVERLAY_EVENTS.has(e.type) || !MODAL_INTERACTIONS.has(e.type)
    );

    // If we have modal events in queue, include both the current modal AND visual events
    if (modalQueue.length > 0) {
      const currentModal = modalQueue[currentModalIndex];
      if (currentModal) {
        // Return both visual events and the current modal (avoid duplicates)
        const modalIsAlreadyInVisualEvents = visualEvents.some(e => e.id === currentModal.id);
        return modalIsAlreadyInVisualEvents ? visualEvents : [...visualEvents, currentModal];
      }
    }

    // Return only visual events if no modal is active
    return visualEvents;
  }, [events, isActive, modalQueue, currentModalIndex]);

  const renderEventType = (event: TimelineEventData) => {
    const isEventActive = activeEvents.some(e => e.id === event.id);
    if (!isEventActive) return null;

    const handleComplete = () => {
      onEventComplete?.(event.id);
      if (MODAL_INTERACTIONS.has(event.type)) {
        // Advance to next modal in queue or clear if this was the last one
        if (currentModalIndex < modalQueue.length - 1) {
          setCurrentModalIndex(currentModalIndex + 1);
        } else {
          // Queue is complete
          setModalQueue([]);
          setCurrentModalIndex(0);
        }
      }
    };
    
    // Add navigation controls for modal events when there are multiple in queue
    const isMultiModalQueue = modalQueue.length > 1;
    const canGoNext = currentModalIndex < modalQueue.length - 1;
    const canGoPrevious = currentModalIndex > 0;

    const handleNext = () => {
      if (canGoNext) {
        setCurrentModalIndex(currentModalIndex + 1);
      }
    };

    const handlePrevious = () => {
      if (canGoPrevious) {
        setCurrentModalIndex(currentModalIndex - 1);
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
            currentTransform={currentTransform}
            onTransformUpdate={onTransformUpdate}
          />
        );
      
      case InteractionType.SHOW_TEXT:
      case InteractionType.SHOW_MESSAGE:
        return (
          <MobileTextModal
            key={`text-${event.id}`}
            event={event}
            onComplete={handleComplete}
            showNavigation={isMultiModalQueue}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
            onNext={handleNext}
            onPrevious={handlePrevious}
            currentIndex={currentModalIndex}
            totalCount={modalQueue.length}
          />
        );
      
      case InteractionType.QUIZ:
        return (
          <MobileQuizModal
            key={`quiz-${event.id}`}
            event={event}
            onComplete={handleComplete}
            {...(isMultiModalQueue && {
              showNavigation: true,
              canGoNext,
              canGoPrevious,
              onNext: handleNext,
              onPrevious: handlePrevious,
              currentIndex: currentModalIndex,
              totalCount: modalQueue.length
            })}
          />
        );
      
      case InteractionType.SHOW_IMAGE:
      case InteractionType.SHOW_IMAGE_MODAL:
        return (
          <MobileImageModal
            key={`image-${event.id}`}
            event={event}
            onComplete={handleComplete}
            {...(isMultiModalQueue && {
              showNavigation: true,
              canGoNext,
              canGoPrevious,
              onNext: handleNext,
              onPrevious: handlePrevious,
              currentIndex: currentModalIndex,
              totalCount: modalQueue.length
            })}
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
            {...(isMultiModalQueue && {
              showNavigation: true,
              canGoNext,
              canGoPrevious,
              onNext: handleNext,
              onPrevious: handlePrevious,
              currentIndex: currentModalIndex,
              totalCount: modalQueue.length
            })}
          />
        );
      
      case InteractionType.SHOW_AUDIO_MODAL:
      case InteractionType.PLAY_AUDIO:
        return (
          <MobileAudioModal
            key={`audio-${event.id}`}
            event={event}
            onComplete={handleComplete}
            {...(isMultiModalQueue && {
              showNavigation: true,
              canGoNext,
              canGoPrevious,
              onNext: handleNext,
              onPrevious: handlePrevious,
              currentIndex: currentModalIndex,
              totalCount: modalQueue.length
            })}
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
      
      case InteractionType.HIDE_HOTSPOT:
        // For mobile, hide hotspot events are handled automatically by the parent component
        // Just complete the event immediately
        handleComplete();
        return null;
      
      default:
        console.warn(`Unsupported mobile event type: ${event.type}`);
        return null;
    }
  };

  return (
    <div className="mobile-event-renderer">
      {events.map((event, index) => {
        const isModal = MODAL_INTERACTIONS.has(event.type);
        const baseZIndex = Z_INDEX.MOBILE_OVERLAY + index;
        return (
          <div
            key={event.id}
            className="mobile-event-wrapper"
            style={{
              zIndex: isModal ? Z_INDEX.MOBILE_MODAL : baseZIndex,
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