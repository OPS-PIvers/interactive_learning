import React, { useState, useMemo, useEffect, Fragment, useRef } from 'react';
import { TimelineEventData, InteractionType, HotspotData, ImageTransformState } from '../../../shared/types';
import { Z_INDEX, PAN_ZOOM_ANIMATION } from '../../constants/interactionConstants';
import { createResetTransform, calculatePanZoomTransform, transformsAreDifferent } from '../../utils/panZoomUtils';
import MobileSpotlightOverlay from './MobileSpotlightOverlay';
import MobileTextModal from './MobileTextModal';
import MobileQuizModal from './MobileQuizModal';
import MobileImageModal from './MobileImageModal';
import MobileVideoModal from './MobileVideoModal';
import MobileAudioModal from './MobileAudioModal';

interface MobileEventRendererProps {
  events: TimelineEventData[];
  hotspots: HotspotData[]; // ADD: hotspots prop for unified positioning
  imageElement: HTMLImageElement | null; // ADD: image element for positioning
  onEventComplete?: (eventId: string) => void;
  imageContainerRef: React.RefObject<HTMLElement>;
  isActive: boolean;
  // Transform coordination
  currentTransform?: ImageTransformState;
  onTransformUpdate?: (transform: ImageTransformState) => void;
  isGestureActive?: boolean;
  isVisible?: boolean; // Controls visibility without affecting hook execution
  // New props for enhanced timeline navigation
  moduleState?: 'idle' | 'exploring' | 'learning';
  currentStep?: number;
  totalSteps?: number;
  currentStepIndex?: number;
  isTimedMode?: boolean;
  autoProgressionDuration?: number;
  onPrevStep?: () => void;
  onNextStep?: () => void;
  onCompleteAllEvents?: () => void; // For explore mode
}

const MODAL_INTERACTIONS = new Set([
  InteractionType.SHOW_TEXT,
  InteractionType.SHOW_MESSAGE,
  InteractionType.QUIZ,
  InteractionType.SHOW_IMAGE,
  InteractionType.SHOW_VIDEO,
  InteractionType.SHOW_YOUTUBE,
  InteractionType.PLAY_VIDEO,
  InteractionType.SHOW_AUDIO_MODAL,
  InteractionType.PLAY_AUDIO,
]);

// Separate visual overlay events from modal events
const VISUAL_OVERLAY_EVENTS = new Set([
  InteractionType.SPOTLIGHT,
  InteractionType.PULSE_HOTSPOT,
  InteractionType.PULSE_HIGHLIGHT,
  InteractionType.PAN_ZOOM,
  InteractionType.PAN_ZOOM_TO_HOTSPOT,
]);

export const MobileEventRenderer: React.FC<MobileEventRendererProps> = ({
  events,
  hotspots, // ADD
  imageElement, // ADD
  onEventComplete,
  imageContainerRef,
  isActive,
  currentTransform,
  onTransformUpdate,
  isGestureActive,
  moduleState = 'learning',
  currentStep = 1,
  totalSteps = 1,
  currentStepIndex = 0,
  isTimedMode = false,
  autoProgressionDuration = 3000,
  onPrevStep,
  onNextStep,
  onCompleteAllEvents
}) => {
  const [modalQueue, setModalQueue] = useState<TimelineEventData[]>([]);
  const [currentModalIndex, setCurrentModalIndex] = useState<number>(0);
  const processedPanZoomEvents = useRef<Set<string>>(new Set());

  // Update modal queue when events change
  useEffect(() => {
    console.log('[MobileEventRenderer] Events changed:', {
      isActive,
      events: events.map(e => ({ id: e.id, type: e.type, name: e.name })),
      eventsLength: events.length
    });

    if (!isActive) {
      console.log('[MobileEventRenderer] Not active - clearing queue');
      setModalQueue([]);
      setCurrentModalIndex(0);
      return;
    }

    const modalEvents = events.filter(e => MODAL_INTERACTIONS.has(e.type));
    console.log('[MobileEventRenderer] Modal events found:', {
      modalEvents: modalEvents.map(e => ({ id: e.id, type: e.type, name: e.name })),
      modalEventsLength: modalEvents.length
    });
    
    if (modalEvents.length > 0) {
      setModalQueue(modalEvents);
      setCurrentModalIndex(0);
      console.log('[MobileEventRenderer] Set modal queue:', modalEvents.length, 'events');
    } else {
      setModalQueue([]);
      setCurrentModalIndex(0);
      console.log('[MobileEventRenderer] No modal events - clearing queue');
    }
  }, [events, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setModalQueue([]);
      setCurrentModalIndex(0);
    };
  }, []);

  // Process pan/zoom events once when they become active to prevent infinite loops
  useEffect(() => {
    if (!isActive || !onTransformUpdate || !imageContainerRef.current || !imageElement) {
      return;
    }

    const panZoomEvents = events.filter(e => 
      (e.type === InteractionType.PAN_ZOOM || e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT) &&
      !processedPanZoomEvents.current.has(e.id)
    );

    if (panZoomEvents.length === 0) {
      return;
    }

    // Process each new pan/zoom event once
    panZoomEvents.forEach(event => {
      console.log('[MobileEventRenderer] Processing pan/zoom event once:', event.id);
      
      const containerRect = imageContainerRef.current!.getBoundingClientRect();
      const transform = calculatePanZoomTransform(
        event,
        containerRect,
        imageElement,
        imageContainerRef.current,
        hotspots || []
      );
      
      // Only apply transform if it's significantly different from current transform
      if (transformsAreDifferent(currentTransform, transform, 2)) {
        console.log('[MobileEventRenderer] Applying new transform - significant change detected');
        onTransformUpdate(transform);
      } else {
        console.log('[MobileEventRenderer] Skipping transform update - no significant change');
      }
      
      // Mark as processed to prevent re-processing
      processedPanZoomEvents.current.add(event.id);
      
      // Complete event after animation
      setTimeout(() => {
        onEventComplete?.(event.id);
      }, PAN_ZOOM_ANIMATION.duration);
    });
  }, [events, isActive, onTransformUpdate, imageElement, hotspots, onEventComplete, currentTransform]);

  // Clear processed events when events change (new step/timeline)
  useEffect(() => {
    processedPanZoomEvents.current.clear();
  }, [events]);

  const activeEvents = useMemo(() => {
    if (!isActive) {
      console.log('[MobileEventRenderer] Not active - no active events');
      return [];
    }

    // Get visual events that should always be active
    const visualEvents = events.filter(e => 
      VISUAL_OVERLAY_EVENTS.has(e.type) || !MODAL_INTERACTIONS.has(e.type)
    );

    console.log('[MobileEventRenderer] activeEvents calculation:', {
      visualEvents: visualEvents.map(e => ({ id: e.id, type: e.type })),
      modalQueueLength: modalQueue.length,
      currentModalIndex,
      currentModal: modalQueue[currentModalIndex] ? { id: modalQueue[currentModalIndex].id, type: modalQueue[currentModalIndex].type } : null
    });

    // If we have modal events in queue, include both the current modal AND visual events
    if (modalQueue.length > 0) {
      const currentModal = modalQueue[currentModalIndex];
      if (currentModal) {
        // Return both visual events and the current modal (avoid duplicates)
        const modalIsAlreadyInVisualEvents = visualEvents.some(e => e.id === currentModal.id);
        const result = modalIsAlreadyInVisualEvents ? visualEvents : [...visualEvents, currentModal];
        console.log('[MobileEventRenderer] Including modal in active events:', {
          currentModal: { id: currentModal.id, type: currentModal.type },
          modalIsAlreadyInVisualEvents,
          result: result.map(e => ({ id: e.id, type: e.type }))
        });
        return result;
      }
    }

    console.log('[MobileEventRenderer] Only visual events active:', visualEvents.map(e => ({ id: e.id, type: e.type })));
    // Return only visual events if no modal is active
    return visualEvents;
  }, [events, isActive, modalQueue, currentModalIndex]);

  // Check if there's an active pan & zoom event for modal positioning
  const activePanZoomEvent = useMemo(() => {
    return activeEvents.find(e => 
      e.type === InteractionType.PAN_ZOOM || e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT
    );
  }, [activeEvents]);

  // Calculate modal positioning based on current transform
  const modalPositioning = useMemo(() => {
    if (!activePanZoomEvent || !currentTransform || !imageContainerRef.current) {
      return null; // Use default modal positioning
    }

    // If we're in a pan & zoom state, calculate the visible viewport center
    const container = imageContainerRef.current.getBoundingClientRect();
    const { scale, translateX, translateY } = currentTransform;

    // Calculate the center of the current visible viewport in screen coordinates
    const viewportCenterX = container.left + container.width / 2;
    const viewportCenterY = container.top + container.height / 2;

    return {
      isPanZoomActive: true,
      viewportCenterX,
      viewportCenterY,
      scale,
      translateX,
      translateY,
      containerRect: container
    };
  }, [activePanZoomEvent, currentTransform, imageContainerRef]);

  const renderEventType = (event: TimelineEventData) => {
    const isEventActive = activeEvents.some(e => e.id === event.id);
    console.log('[MobileEventRenderer] renderEventType:', {
      eventId: event.id,
      eventType: event.type,
      isEventActive,
      activeEventsIds: activeEvents.map(e => e.id)
    });
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
          
          // Auto-progression for timed mode
          if (isTimedMode && moduleState === 'learning' && onNextStep) {
            setTimeout(() => {
              if (currentStepIndex < totalSteps - 1) {
                onNextStep();
              } else {
                // End of timeline in timed mode
                onCompleteAllEvents?.();
              }
            }, autoProgressionDuration);
          }
          // For explore mode, call completion handler
          else if (moduleState === 'exploring') {
            onCompleteAllEvents?.();
          }
          // For guided learning mode (non-timed), modal just closes and user can navigate manually
        }
      }
    };
    
    // Add navigation controls for modal events when there are multiple in queue
    const isMultiModalQueue = modalQueue.length > 1;
    const canGoNext = currentModalIndex < modalQueue.length - 1;
    const canGoPrevious = currentModalIndex > 0;

    // Timeline step navigation (for guided learning mode)
    const canGoToNextStep = moduleState === 'learning' && !isTimedMode && currentStepIndex < totalSteps - 1;
    const canGoToPrevStep = moduleState === 'learning' && !isTimedMode && currentStepIndex > 0;
    
    // Determine what navigation to show
    const showTimelineNavigation = moduleState === 'learning' && !isTimedMode && !isMultiModalQueue;
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
        console.log('[MobileEventRenderer] Timeline next clicked');
        // Reset pan & zoom when moving to next step if currently active
        if (activePanZoomEvent && onTransformUpdate) {
          console.log('[MobileEventRenderer] Resetting pan/zoom transform before next step');
          onTransformUpdate(createResetTransform());
        }
        // Clear modal queue to prevent events from previous step carrying over
        setModalQueue([]);
        setCurrentModalIndex(0);
        onNextStep();
      }
    };

    const handleTimelinePrevious = () => {
      if (canGoToPrevStep && onPrevStep) {
        console.log('[MobileEventRenderer] Timeline previous clicked');
        // Reset pan & zoom when moving to previous step if currently active
        if (activePanZoomEvent && onTransformUpdate) {
          console.log('[MobileEventRenderer] Resetting pan/zoom transform before previous step');
          onTransformUpdate(createResetTransform());
        }
        // Clear modal queue to prevent events from previous step carrying over
        setModalQueue([]);
        setCurrentModalIndex(0);
        onPrevStep();
      }
    };

    const handleExploreComplete = () => {
      onCompleteAllEvents?.();
    };

    switch (event.type) {
      case InteractionType.SPOTLIGHT:
        return (
          <MobileSpotlightOverlay
            key={`spotlight-${event.id}`}
            event={event}
            containerRef={imageContainerRef}
            hotspots={hotspots} // ADD: Pass hotspots for unified positioning
            imageElement={imageElement} // ADD: Pass image element for positioning
            onComplete={handleComplete}
          />
        );
      
      case InteractionType.PAN_ZOOM:
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        // Pan/zoom events are now processed once in useEffect to prevent infinite loops
        // This case just returns null as the event is handled by the useEffect
        return null;
      
      case InteractionType.SHOW_TEXT:
      case InteractionType.SHOW_MESSAGE:
        return (
          <MobileTextModal
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
            // Timed mode indicator
            isTimedMode={isTimedMode}
            autoProgressionDuration={autoProgressionDuration}
            // Text event specific settings
            autoDismiss={event.autoDismiss}
            dismissDelay={event.dismissDelay}
            allowClickToClose={event.allowClickToClose}
            // Pan & zoom positioning
            modalPositioning={modalPositioning}
          />
        );
      
      case InteractionType.QUIZ:
        return (
          <MobileQuizModal
            key={`quiz-${event.id}`}
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
            // Timed mode indicator
            isTimedMode={isTimedMode}
            autoProgressionDuration={autoProgressionDuration}
            // Pan & zoom positioning
            modalPositioning={modalPositioning}
          />
        );
      
      case InteractionType.SHOW_IMAGE:
        return (
          <MobileImageModal
            key={`image-${event.id}`}
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
            // Timed mode indicator
            isTimedMode={isTimedMode}
            autoProgressionDuration={autoProgressionDuration}
            // Pan & zoom positioning
            modalPositioning={modalPositioning}
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
            // Timed mode indicator
            isTimedMode={isTimedMode}
            autoProgressionDuration={autoProgressionDuration}
            // Pan & zoom positioning
            modalPositioning={modalPositioning}
          />
        );
      
      case InteractionType.SHOW_AUDIO_MODAL:
      case InteractionType.PLAY_AUDIO:
        return (
          <MobileAudioModal
            key={`audio-${event.id}`}
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
            // Timed mode indicator
            isTimedMode={isTimedMode}
            autoProgressionDuration={autoProgressionDuration}
            // Pan & zoom positioning
            modalPositioning={modalPositioning}
          />
        );
      
      case InteractionType.PULSE_HOTSPOT:
      case InteractionType.PULSE_HIGHLIGHT:
        return (
          <MobileSpotlightOverlay
            key={`highlight-${event.id}`}
            event={event}
            containerRef={imageContainerRef}
            hotspots={hotspots} // ADD: Pass hotspots for unified positioning
            imageElement={imageElement} // ADD: Pass image element for positioning
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
    <>
      {events.map((event, index) => {
        const isModal = MODAL_INTERACTIONS.has(event.type);
        const baseZIndex = Z_INDEX.MOBILE_OVERLAY + index;
        
        // For modal events, render directly without wrapper to avoid positioning issues
        if (isModal) {
          return (
            <React.Fragment key={event.id}>
              {renderEventType(event)}
            </React.Fragment>
          );
        }
        
        // For non-modal events (overlays), use wrapper with relative positioning
        return (
          <div
            key={event.id}
            className="mobile-event-wrapper"
            style={{
              zIndex: baseZIndex,
              position: 'relative',
            }}
          >
            {renderEventType(event)}
          </div>
        );
      })}
    </>
  );
};

export default MobileEventRenderer;