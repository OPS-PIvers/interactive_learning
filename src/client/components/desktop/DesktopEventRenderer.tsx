import React, { useState, useMemo, useEffect } from 'react';
import { TimelineEventData, InteractionType } from '../../../shared/types';
import { Z_INDEX } from '../../constants/interactionConstants';
import DesktopTextModal from './DesktopTextModal';
import DesktopQuizModal from './DesktopQuizModal';
import DesktopImageModal from './DesktopImageModal';
import DesktopVideoModal from './DesktopVideoModal';
import DesktopAudioModal from './DesktopAudioModal';

interface DesktopEventRendererProps {
  events: TimelineEventData[];
  onEventComplete?: (eventId: string) => void;
  imageContainerRef: React.RefObject<HTMLElement>;
  isActive: boolean;
  currentTransform?: { scale: number; translateX: number; translateY: number };
  onTransformUpdate?: (transform: { scale: number; translateX: number; translateY: number }) => void;
  moduleState?: 'idle' | 'exploring' | 'learning';
  currentStep?: number;
  totalSteps?: number;
  currentStepIndex?: number;
  onPrevStep?: () => void;
  onNextStep?: () => void;
  onCompleteAllEvents?: () => void;
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

const VISUAL_OVERLAY_EVENTS = new Set([
  InteractionType.SPOTLIGHT,
  InteractionType.HIGHLIGHT_HOTSPOT,
  InteractionType.PULSE_HOTSPOT,
  InteractionType.PULSE_HIGHLIGHT,
  InteractionType.PAN_ZOOM,
  InteractionType.PAN_ZOOM_TO_HOTSPOT,
]);

export const DesktopEventRenderer: React.FC<DesktopEventRendererProps> = ({
  events,
  onEventComplete,
  imageContainerRef,
  isActive,
  currentTransform,
  onTransformUpdate,
  moduleState = 'learning',
  currentStep = 1,
  totalSteps = 1,
  currentStepIndex = 0,
  onPrevStep,
  onNextStep,
  onCompleteAllEvents
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
          // Queue is complete - handle based on viewer mode
          setModalQueue([]);
          setCurrentModalIndex(0);
          
          // For explore mode, call completion handler
          if (moduleState === 'exploring') {
            onCompleteAllEvents?.();
          }
          // For guided learning mode, modal just closes and user can navigate manually
        }
      }
    };
    
    // Add navigation controls for modal events when there are multiple in queue
    const isMultiModalQueue = modalQueue.length > 1;
    const canGoNext = currentModalIndex < modalQueue.length - 1;
    const canGoPrevious = currentModalIndex > 0;

    // Timeline step navigation (for guided learning mode)
    const canGoToNextStep = moduleState === 'learning' && currentStepIndex < totalSteps - 1;
    const canGoToPrevStep = moduleState === 'learning' && currentStepIndex > 0;
    
    // Determine what navigation to show
    const showTimelineNavigation = moduleState === 'learning' && !isMultiModalQueue;
    const showExploreButton = moduleState === 'exploring';
    const showMultiModalNavigation = isMultiModalQueue;

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

    const handleTimelineNext = () => {
      if (canGoToNextStep && onNextStep) {
        // Reset pan & zoom when moving to next step if currently active
        if (currentTransform && onTransformUpdate) {
          onTransformUpdate({ scale: 1, translateX: 0, translateY: 0 });
        }
        onNextStep();
      }
    };

    const handleTimelinePrevious = () => {
      if (canGoToPrevStep && onPrevStep) {
        // Reset pan & zoom when moving to previous step if currently active
        if (currentTransform && onTransformUpdate) {
          onTransformUpdate({ scale: 1, translateX: 0, translateY: 0 });
        }
        onPrevStep();
      }
    };

    const handleExploreComplete = () => {
      onCompleteAllEvents?.();
    };

    switch (event.type) {
      case InteractionType.SHOW_TEXT:
      case InteractionType.SHOW_MESSAGE:
        return (
          <DesktopTextModal
            key={`text-${event.id}`}
            event={event}
            onComplete={handleComplete}
            // Multi-modal navigation (within same step)
            showNavigation={showMultiModalNavigation}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
            onNext={handleNext}
            onPrevious={handlePrevious}
            currentIndex={currentModalIndex}
            totalCount={modalQueue.length}
            // Timeline step navigation
            showTimelineNavigation={showTimelineNavigation}
            canGoToNextStep={canGoToNextStep}
            canGoToPrevStep={canGoToPrevStep}
            onTimelineNext={handleTimelineNext}
            onTimelinePrevious={handleTimelinePrevious}
            currentStep={currentStep}
            totalSteps={totalSteps}
            // Explore mode
            showExploreButton={showExploreButton}
            onExploreComplete={handleExploreComplete}
            // Text event specific settings
            autoDismiss={event.autoDismiss}
            dismissDelay={event.dismissDelay}
            allowClickToClose={event.allowClickToClose}
          />
        );
      
      case InteractionType.QUIZ:
        return (
          <DesktopQuizModal
            key={`quiz-${event.id}`}
            event={event}
            onComplete={handleComplete}
            showNavigation={showMultiModalNavigation}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
            onNext={handleNext}
            onPrevious={handlePrevious}
            currentIndex={currentModalIndex}
            totalCount={modalQueue.length}
            showTimelineNavigation={showTimelineNavigation}
            canGoToNextStep={canGoToNextStep}
            canGoToPrevStep={canGoToPrevStep}
            onTimelineNext={handleTimelineNext}
            onTimelinePrevious={handleTimelinePrevious}
            currentStep={currentStep}
            totalSteps={totalSteps}
            showExploreButton={showExploreButton}
            onExploreComplete={handleExploreComplete}
          />
        );
      
      case InteractionType.SHOW_IMAGE:
      case InteractionType.SHOW_IMAGE_MODAL:
        return (
          <DesktopImageModal
            key={`image-${event.id}`}
            event={event}
            onComplete={handleComplete}
            showNavigation={showMultiModalNavigation}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
            onNext={handleNext}
            onPrevious={handlePrevious}
            currentIndex={currentModalIndex}
            totalCount={modalQueue.length}
            showTimelineNavigation={showTimelineNavigation}
            canGoToNextStep={canGoToNextStep}
            canGoToPrevStep={canGoToPrevStep}
            onTimelineNext={handleTimelineNext}
            onTimelinePrevious={handleTimelinePrevious}
            currentStep={currentStep}
            totalSteps={totalSteps}
            showExploreButton={showExploreButton}
            onExploreComplete={handleExploreComplete}
          />
        );
      
      case InteractionType.SHOW_VIDEO:
      case InteractionType.SHOW_YOUTUBE:
      case InteractionType.PLAY_VIDEO:
        return (
          <DesktopVideoModal
            key={`video-${event.id}`}
            event={event}
            onComplete={handleComplete}
            showNavigation={showMultiModalNavigation}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
            onNext={handleNext}
            onPrevious={handlePrevious}
            currentIndex={currentModalIndex}
            totalCount={modalQueue.length}
            showTimelineNavigation={showTimelineNavigation}
            canGoToNextStep={canGoToNextStep}
            canGoToPrevStep={canGoToPrevStep}
            onTimelineNext={handleTimelineNext}
            onTimelinePrevious={handleTimelinePrevious}
            currentStep={currentStep}
            totalSteps={totalSteps}
            showExploreButton={showExploreButton}
            onExploreComplete={handleExploreComplete}
          />
        );
      
      case InteractionType.SHOW_AUDIO_MODAL:
      case InteractionType.PLAY_AUDIO:
        return (
          <DesktopAudioModal
            key={`audio-${event.id}`}
            event={event}
            onComplete={handleComplete}
            showNavigation={showMultiModalNavigation}
            canGoNext={canGoNext}
            canGoPrevious={canGoPrevious}
            onNext={handleNext}
            onPrevious={handlePrevious}
            currentIndex={currentModalIndex}
            totalCount={modalQueue.length}
            showTimelineNavigation={showTimelineNavigation}
            canGoToNextStep={canGoToNextStep}
            canGoToPrevStep={canGoToPrevStep}
            onTimelineNext={handleTimelineNext}
            onTimelinePrevious={handleTimelinePrevious}
            currentStep={currentStep}
            totalSteps={totalSteps}
            showExploreButton={showExploreButton}
            onExploreComplete={handleExploreComplete}
          />
        );

      // For now, visual overlay events are not implemented for desktop
      // These would require more complex positioning logic
      case InteractionType.SPOTLIGHT:
      case InteractionType.PAN_ZOOM:
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
      case InteractionType.PULSE_HOTSPOT:
      case InteractionType.HIGHLIGHT_HOTSPOT:
      case InteractionType.PULSE_HIGHLIGHT:
        // For desktop, we'll just complete these events immediately
        // TODO: Implement desktop visual overlays in future
        setTimeout(handleComplete, 0); // Avoid setState during render
        return null;
      
      case InteractionType.HIDE_HOTSPOT:
        // Hide hotspot events are handled automatically by the parent component
        // Just complete the event immediately
        setTimeout(handleComplete, 0); // Avoid setState during render
        return null;
      
      default:
        console.warn(`Unsupported desktop event type: ${event.type}`);
        return null;
    }
  };

  return (
    <div className="desktop-event-renderer">
      {events.map((event, index) => {
        const isModal = MODAL_INTERACTIONS.has(event.type);
        const baseZIndex = Z_INDEX.MODAL + index;
        return (
          <div
            key={event.id}
            className="desktop-event-wrapper"
            style={{
              zIndex: isModal ? baseZIndex : Z_INDEX.MOBILE_OVERLAY + index,
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

export default DesktopEventRenderer;