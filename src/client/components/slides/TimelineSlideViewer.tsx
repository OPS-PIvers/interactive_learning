/**
 * Timeline-Integrated Slide Viewer
 * 
 * Combines slide-based navigation with horizontal timeline for guided learning.
 * Supports both guided learning and auto-progression modes where hotspots
 * control the timeline navigation.
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { SlideDeck, SlideViewerState, SlideEffect, EffectParameters } from '../../../shared/slideTypes';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { SlideViewer, SlideViewerRef } from './SlideViewer';
import { convertTimelineEventToSlideEffect } from '../../utils/timelineEffectConverter';
import { TimelineEventData } from '../../../shared/types';
import { InteractionType } from '../../../shared/InteractionPresets';

interface TimelineSlideViewerProps {
  slideDeck: SlideDeck;
  viewerMode: 'explore' | 'guided' | 'auto-progression';
  onSlideChange?: (slideId: string, slideIndex: number) => void;
  onInteraction?: (interaction: any) => void;
  onClose?: () => void;
  className?: string;
}

interface TimelineSlideEvent {
  id: string;
  step: number;
  name: string;
  type: string;
  targetId?: string;
  slideId: string; // Maps timeline events to slides
  elementId?: string; // Maps to specific slide elements
  duration?: number;
  message?: string;
  timelineEventData?: TimelineEventData; // Original timeline event for converter
}

/**
 * TimelineSlideViewer - Slide viewer with integrated timeline navigation
 * 
 * For guided learning and auto-progression modes, the timeline becomes the
 * primary navigation method, with each timeline step corresponding to slide
 * elements and their interactions.
 */
export const TimelineSlideViewer: React.FC<TimelineSlideViewerProps> = ({
  slideDeck,
  viewerMode,
  onSlideChange,
  onInteraction,
  onClose,
  className = ''
}) => {
  const { deviceType } = useDeviceDetection();
  
  // Timeline and navigation state
  const [currentStep, setCurrentStep] = useState(1);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isTimelineMode, setIsTimelineMode] = useState(viewerMode !== 'explore');
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [completedHotspots, setCompletedHotspots] = useState<Set<string>>(new Set());
  
  // Reference to SlideViewer for triggering effects
  const slideViewerRef = useRef<SlideViewerRef>(null);
  
  // Generate timeline events from slide elements
  const timelineEvents = useMemo(() => {
    const events: TimelineSlideEvent[] = [];
    let stepCounter = 1;
    
    slideDeck?.slides?.forEach((slide, slideIndex) => {
      // Create an initial event for each slide
      events.push({
        id: `slide-${slide.id}`,
        step: stepCounter++,
        name: slide.title || `Slide ${slideIndex + 1}`,
        type: 'slide_navigation',
        slideId: slide.id,
        message: slide.title
      });
      
      // Create events for each interactive element
      slide.elements?.forEach((element) => {
        if (element.interactions && element.interactions.length > 0) {
          element.interactions.forEach((interaction) => {
            // Create timeline event data for the converter
            const effectParams = interaction.effect?.parameters as any; // Type assertion to avoid union type access issues
            const timelineEventData: TimelineEventData = {
              id: `${element.id}-${interaction.id}`,
              step: stepCounter,
              name: element.content?.title || interaction.effect?.type.replace('_', ' ').toUpperCase(),
              type: getTimelineEventType(interaction.effect?.type),
              targetId: element.id,
              // Map effect parameters to timeline event fields
              spotlightX: effectParams?.spotlightX,
              spotlightY: effectParams?.spotlightY,
              targetX: effectParams?.targetX || effectParams?.targetPosition?.x,
              targetY: effectParams?.targetY || effectParams?.targetPosition?.y,
              zoomFactor: effectParams?.zoomLevel,
              message: effectParams?.text || element.content?.description,
              ...(effectParams?.mediaType === 'video' && { videoUrl: effectParams.mediaUrl }),
              ...(effectParams?.mediaType === 'audio' && { audioUrl: effectParams.mediaUrl }),
              ...(effectParams?.autoplay && { autoplay: effectParams.autoplay }),
            };
            
            events.push({
              id: `${element.id}-${interaction.id}`,
              step: stepCounter++,
              name: interaction.effect?.type.replace('_', ' ').toUpperCase(),
              type: interaction.effect?.type,
              targetId: element.id,
              slideId: slide.id,
              elementId: element.id,
              duration: interaction.effect?.duration,
              message: element.content?.title || element.content?.description || '',
              timelineEventData
            });
          });
        }
      });
    });
    
    return events;
  }, [slideDeck]);
  
  // Helper function to map slide effect types to timeline event types
  const getTimelineEventType = (effectType: string): InteractionType => {
    switch (effectType) {
      case 'spotlight':
        return InteractionType.SPOTLIGHT;
      case 'pan_zoom':
        return InteractionType.PAN_ZOOM;
      case 'show_text':
        return InteractionType.SHOW_TEXT;
      case 'play_media':
      case 'play_video':
        return InteractionType.PLAY_VIDEO;
      case 'play_audio':
        return InteractionType.PLAY_AUDIO;
      default:
        return InteractionType.SPOTLIGHT; // Default fallback
    }
  };
  
  // Create unique sorted steps for timeline
  const uniqueSortedSteps = useMemo(() => {
    return Array.from(new Set(timelineEvents.map(e => e.step))).sort((a, b) => a - b);
  }, [timelineEvents]);
  
  // Find current slide and step indices
  const currentStepIndex = useMemo(() => {
    return uniqueSortedSteps.findIndex(step => step === currentStep);
  }, [uniqueSortedSteps, currentStep]);
  
  // Handle timeline step selection
  const handleStepSelect = useCallback((step: number) => {
    console.log('[TimelineSlideViewer] handleStepSelect called with step:', step);
    setCurrentStep(step);
    
    // Find the event for this step and navigate to its slide
    const stepEvent = timelineEvents.find(e => e.step === step);
    console.log('[TimelineSlideViewer] Step event found:', stepEvent);
    
    if (stepEvent) {
      const slideIndex = slideDeck?.slides?.findIndex(s => s.id === stepEvent.slideId);
      if (slideIndex !== -1 && slideIndex !== currentSlideIndex) {
        setCurrentSlideIndex(slideIndex);
        if (onSlideChange) {
          onSlideChange(stepEvent.slideId, slideIndex);
        }
      }
      
      // Trigger slide effect if this step has timeline event data
      if (stepEvent.timelineEventData && stepEvent.elementId) {
        console.log('[TimelineSlideViewer] Converting timeline event to slide effect');
        const targetElement = slideDeck?.slides?.[slideIndex]?.elements?.find(el => el.id === stepEvent.elementId);
        
        if (targetElement) {
          const slideEffect = convertTimelineEventToSlideEffect(stepEvent.timelineEventData, {
            slideDeck,
            currentSlideIndex: slideIndex !== -1 ? slideIndex : currentSlideIndex,
            targetElement,
            deviceType
          });

          console.log('[TimelineSlideViewer] Converted slide effect:', slideEffect);

          if (slideEffect && slideViewerRef.current?.triggerEffect) {
            console.log('[TimelineSlideViewer] Triggering effect via SlideViewer');
            slideViewerRef.current.triggerEffect(slideEffect);
          } else {
            console.log('[TimelineSlideViewer] No slide effect generated or SlideViewer ref not available');
          }
        }
      }
      
      // Also call the original onInteraction for compatibility
      if (stepEvent.elementId && onInteraction) {
        onInteraction({
          type: stepEvent.type,
          elementId: stepEvent.elementId,
          slideId: stepEvent.slideId,
          step: step
        });
      }
    }
  }, [timelineEvents, slideDeck, currentSlideIndex, onSlideChange, onInteraction, deviceType]);
  
  // Handle previous step navigation
  const handlePrevStep = useCallback(() => {
    const prevStepIndex = Math.max(0, currentStepIndex - 1);
    const prevStep = uniqueSortedSteps[prevStepIndex];
    if (prevStep !== undefined) {
      handleStepSelect(prevStep);
    }
  }, [currentStepIndex, uniqueSortedSteps, handleStepSelect]);
  
  // Handle next step navigation
  const handleNextStep = useCallback(() => {
    const nextStepIndex = Math.min(uniqueSortedSteps.length - 1, currentStepIndex + 1);
    const nextStep = uniqueSortedSteps[nextStepIndex];
    if (nextStep !== undefined) {
      handleStepSelect(nextStep);
    }
  }, [currentStepIndex, uniqueSortedSteps, handleStepSelect]);
  
  // Handle slide changes from the viewer (when not in timeline mode)
  const handleSlideViewerChange = useCallback((slideId: string, slideIndex: number) => {
    setCurrentSlideIndex(slideIndex);
    
    // Update timeline to first step of this slide if in timeline mode
    if (isTimelineMode) {
      const slideEvent = timelineEvents.find(e => e.slideId === slideId && e.type === 'slide_navigation');
      if (slideEvent) {
        setCurrentStep(slideEvent.step);
      }
    }
    
    if (onSlideChange) {
      onSlideChange(slideId, slideIndex);
    }
  }, [isTimelineMode, timelineEvents, onSlideChange]);

  // Hotspot state handlers
  const handleHotspotFocus = useCallback((hotspotId: string, slideIndex: number) => {
    setActiveHotspotId(hotspotId);
    // If hotspot is on different slide, navigate there
    if (slideIndex !== currentSlideIndex) {
      const slide = slideDeck?.slides?.[slideIndex];
      if (slide) {
        handleSlideViewerChange(slide.id, slideIndex);
      }
    }
  }, [currentSlideIndex, slideDeck?.slides, handleSlideViewerChange]);

  const handleHotspotComplete = useCallback((hotspotId: string) => {
    setCompletedHotspots(prev => new Set([...prev, hotspotId]));
    setActiveHotspotId(null);
  }, []);
  
  // Auto-progression mode logic
  useEffect(() => {
    if (viewerMode === 'auto-progression' && slideDeck?.settings?.autoAdvance) {
      // Auto-advance based on slide settings or element completion
      const autoAdvanceDelay = slideDeck.settings.autoAdvanceDelay || 5000; // 5 seconds default
      
      // Don't auto-advance if we're at the last step
      const isLastStep = currentStepIndex >= uniqueSortedSteps.length - 1;
      if (isLastStep) return;
      
      const timer = setTimeout(() => {
        handleNextStep();
      }, autoAdvanceDelay);
      
      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for else case
  }, [viewerMode, currentStepIndex, currentStep, slideDeck, handleNextStep, uniqueSortedSteps.length]);
  
  
  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePrevStep();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNextStep();
          break;
        case ' ': // Spacebar
          event.preventDefault();
          if (viewerMode === 'auto-progression') {
            // Toggle auto-advance on spacebar in auto-progression mode
            // This would require additional state management
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (onClose) onClose();
          break;
      }
    };
    
    if (slideDeck?.settings?.keyboardShortcuts) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
    return undefined; // Explicit return for else case
  }, [handlePrevStep, handleNextStep, viewerMode, onClose, slideDeck?.settings?.keyboardShortcuts]);
  
  
  return (
    <div className={`timeline-slide-viewer h-full ${className}`}>
      {/* Main slide viewer - now takes full height */}
      <div className="h-full relative">
        <SlideViewer
          ref={slideViewerRef}
          slideDeck={slideDeck}
          {...(slideDeck?.slides?.[currentSlideIndex]?.id && { initialSlideId: slideDeck.slides[currentSlideIndex].id })}
          onSlideChange={handleSlideViewerChange}
          onInteraction={onInteraction || (() => {})}
          className="h-full"
          showTimeline={true}
        />
        
        {/* Mode indicator for guided/auto-progression */}
        {viewerMode !== 'explore' && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {viewerMode === 'guided' ? 'Guided Learning' : 'Auto Progression'}
          </div>
        )}
      </div>
      
      
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className={`absolute top-4 left-4 ${Z_INDEX_TAILWIND.FLOATING_CONTROLS} bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all`}
          aria-label="Close viewer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TimelineSlideViewer;