import React, { useMemo, useCallback, useEffect } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement, ElementInteraction } from '../../shared/slideTypes';
import { TimelineEventData, HotspotData } from '../../shared/types';
import HorizontalTimeline from './HorizontalTimeline';
import { generateId } from '../utils/generateId';
import { useSlideAnimations, AnimationSequence } from '../hooks/useSlideAnimations';

interface SlideTimelineAdapterProps {
  slideDeck: SlideDeck;
  currentSlideIndex: number;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
  onStepSelect?: (step: number) => void;
  isEditing?: boolean;
  showPreviews?: boolean;
  moduleState?: 'idle' | 'learning';
  isMobile?: boolean;
  className?: string;
}

interface TimelineStep {
  step: number;
  slideIndex: number;
  elementId?: string;
  interactionId?: string;
  slide: InteractiveSlide;
}

/**
 * SlideTimelineAdapter - Bridges slide-based architecture with existing timeline components
 * 
 * Converts slide elements and interactions into timeline events that work with
 * the existing HorizontalTimeline and MobileTimeline components.
 */
const SlideTimelineAdapter: React.FC<SlideTimelineAdapterProps> = ({
  slideDeck,
  currentSlideIndex,
  onSlideDeckChange,
  onStepSelect,
  isEditing = false,
  showPreviews = true,
  moduleState = 'idle',
  isMobile = false,
  className = ''
}) => {
  
  // Animation state management
  const { 
    animationState, 
    playAnimationSequence, 
    stopAnimationSequence, 
    resetAnimations 
  } = useSlideAnimations();
  
  // Convert slide elements to timeline-compatible hotspot data
  const convertedHotspots = useMemo((): HotspotData[] => {
    const hotspots: HotspotData[] = [];
    
    slideDeck.slides.forEach((slide, slideIndex) => {
      slide.elements.forEach((element) => {
        // Only convert elements that have timeline interactions
        const timelineInteractions = element.interactions.filter(
          interaction => interaction.trigger === 'timeline'
        );
        
        if (timelineInteractions.length > 0) {
          hotspots.push({
            id: element.id,
            title: element.content.title || `${element.type} on Slide ${slideIndex + 1}`,
            x: element.position.desktop.x,
            y: element.position.desktop.y,
            width: element.position.desktop.width,
            height: element.position.desktop.height,
            color: element.style.backgroundColor || '#3b82f6',
            text: element.content.description || '',
            visible: element.isVisible,
            // Additional metadata for slide context
            slideIndex: slideIndex,
            elementType: element.type
          });
        }
      });
    });
    
    return hotspots;
  }, [slideDeck.slides]);

  // Generate timeline steps from slide interactions
  const timelineSteps = useMemo((): TimelineStep[] => {
    const steps: TimelineStep[] = [];
    
    slideDeck.slides.forEach((slide, slideIndex) => {
      // Add slide start step
      steps.push({
        step: slideIndex * 100, // Use 100-step intervals for slides
        slideIndex,
        slide
      });
      
      slide.elements.forEach((element) => {
        element.interactions.forEach((interaction, interactionIndex) => {
          if (interaction.trigger === 'timeline') {
            steps.push({
              step: slideIndex * 100 + interactionIndex + 1,
              slideIndex,
              elementId: element.id,
              interactionId: interaction.id,
              slide
            });
          }
        });
      });
    });
    
    return steps.sort((a, b) => a.step - b.step);
  }, [slideDeck.slides]);

  // Generate animation sequences from timeline interactions
  const animationSequences = useMemo((): AnimationSequence[] => {
    const sequences: AnimationSequence[] = [];
    
    timelineSteps.forEach((timelineStep) => {
      if (timelineStep.elementId && timelineStep.interactionId) {
        const element = timelineStep.slide.elements.find(el => el.id === timelineStep.elementId);
        const interaction = element?.interactions.find(int => int.id === timelineStep.interactionId);
        
        if (element && interaction) {
          // Map interaction effects to animation variants
          const getAnimationVariant = (effectType: string) => {
            switch (effectType) {
              case 'spotlight': return 'spotlight';
              case 'zoom': return 'zoom';
              case 'show_text': return 'textReveal';
              case 'transition': return 'slideLeft';
              case 'animate': return 'popup';
              default: return 'fade';
            }
          };

          sequences.push({
            id: `anim_${timelineStep.step}_${element.id}`,
            elementId: element.id,
            variant: getAnimationVariant(interaction.effect.type),
            delay: interaction.effect.delay || 0,
            duration: interaction.effect.duration || 300
          });
        }
      }
    });
    
    return sequences;
  }, [timelineSteps]);

  // Convert slide interactions to timeline events
  const convertedTimelineEvents = useMemo((): TimelineEventData[] => {
    const events: TimelineEventData[] = [];
    
    timelineSteps.forEach((timelineStep) => {
      if (timelineStep.elementId && timelineStep.interactionId) {
        const element = timelineStep.slide.elements.find(el => el.id === timelineStep.elementId);
        const interaction = element?.interactions.find(int => int.id === timelineStep.interactionId);
        
        if (element && interaction) {
          events.push({
            id: `timeline_${timelineStep.step}_${element.id}`,
            step: timelineStep.step,
            type: `slide_${interaction.effect.type}`,
            name: `${interaction.effect.type} - ${element.content.title || element.type}`,
            targetId: element.id,
            message: element.content.description || `${interaction.effect.type} interaction on ${element.type}`,
            duration: interaction.effect.duration || 500,
            delay: interaction.effect.delay || 0,
            // Additional slide-specific data
            slideIndex: timelineStep.slideIndex,
            elementType: element.type,
            interactionTrigger: interaction.trigger
          });
        }
      } else {
        // Slide transition event
        events.push({
          id: `slide_${timelineStep.slideIndex}`,
          step: timelineStep.step,
          type: 'slide_transition',
          name: `Slide ${timelineStep.slideIndex + 1}: ${timelineStep.slide.title}`,
          message: `Navigate to slide: ${timelineStep.slide.title}`,
          slideIndex: timelineStep.slideIndex
        });
      }
    });
    
    return events;
  }, [timelineSteps]);

  // Get unique sorted steps for timeline
  const uniqueSortedSteps = useMemo(() => {
    return Array.from(new Set(timelineSteps.map(step => step.step))).sort((a, b) => a - b);
  }, [timelineSteps]);

  // Current step based on current slide
  const currentStep = useMemo(() => {
    return currentSlideIndex * 100;
  }, [currentSlideIndex]);

  // Handle step selection and update slide deck
  const handleStepSelect = useCallback((step: number) => {
    const timelineStep = timelineSteps.find(ts => ts.step === step);
    if (timelineStep && onStepSelect) {
      onStepSelect(timelineStep.slideIndex);
      
      // Trigger animations for the selected step
      const stepAnimations = animationSequences.filter(seq => 
        timelineSteps.some(ts => ts.step === step && ts.elementId === seq.elementId)
      );
      
      if (stepAnimations.length > 0 && moduleState === 'learning') {
        playAnimationSequence(stepAnimations);
      }
    }
  }, [timelineSteps, onStepSelect, animationSequences, moduleState, playAnimationSequence]);

  // Handle timeline events update
  const handleTimelineEventsUpdate = useCallback((events: TimelineEventData[]) => {
    // Convert timeline events back to slide interactions
    const updatedSlides = slideDeck.slides.map((slide, slideIndex) => {
      const slideEvents = events.filter(event => event.slideIndex === slideIndex);
      
      const updatedElements = slide.elements.map(element => {
        const elementEvents = slideEvents.filter(event => event.targetId === element.id);
        
        if (elementEvents.length > 0) {
          const updatedInteractions = elementEvents.map(event => ({
            id: event.id.replace('timeline_', '').replace(`_${element.id}`, ''),
            trigger: 'timeline' as const,
            effect: {
              type: event.type.replace('slide_', '') as any,
              parameters: {},
              duration: event.duration || 500,
              delay: event.delay || 0
            }
          }));
          
          return {
            ...element,
            interactions: [
              ...element.interactions.filter(int => int.trigger !== 'timeline'),
              ...updatedInteractions
            ]
          };
        }
        
        return element;
      });
      
      return {
        ...slide,
        elements: updatedElements
      };
    });
    
    onSlideDeckChange({
      ...slideDeck,
      slides: updatedSlides,
      metadata: {
        ...slideDeck.metadata,
        modified: Date.now()
      }
    });
  }, [slideDeck, onSlideDeckChange]);

  // Handle animation cleanup when slides change
  useEffect(() => {
    if (moduleState === 'idle') {
      resetAnimations();
    }
  }, [currentSlideIndex, moduleState, resetAnimations]);

  // Auto-play animations for slide transitions
  useEffect(() => {
    if (moduleState === 'learning') {
      const slideTransitionAnimations = animationSequences.filter(seq => 
        timelineSteps.some(ts => 
          ts.slideIndex === currentSlideIndex && 
          ts.step === currentSlideIndex * 100 && 
          ts.elementId === seq.elementId
        )
      );
      
      if (slideTransitionAnimations.length > 0) {
        // Delay to allow slide to render first
        setTimeout(() => {
          playAnimationSequence(slideTransitionAnimations);
        }, 100);
      }
    }
  }, [currentSlideIndex, moduleState, animationSequences, timelineSteps, playAnimationSequence]);

  // Timeline event management
  const handleAddStep = useCallback((step: number) => {
    // Find the slide for this step
    const slideIndex = Math.floor(step / 100);
    if (slideIndex >= 0 && slideIndex < slideDeck.slides.length) {
      const newEvent: TimelineEventData = {
        id: generateId(),
        step,
        type: 'slide_show',
        name: `New Event at Step ${step}`,
        slideIndex
      };
      
      handleTimelineEventsUpdate([...convertedTimelineEvents, newEvent]);
    }
  }, [convertedTimelineEvents, handleTimelineEventsUpdate, slideDeck.slides.length]);

  const handleDeleteStep = useCallback((step: number) => {
    const updatedEvents = convertedTimelineEvents.filter(event => event.step !== step);
    handleTimelineEventsUpdate(updatedEvents);
  }, [convertedTimelineEvents, handleTimelineEventsUpdate]);

  const handleUpdateStep = useCallback((oldStep: number, newStep: number) => {
    const updatedEvents = convertedTimelineEvents.map(event => 
      event.step === oldStep ? { ...event, step: newStep } : event
    );
    handleTimelineEventsUpdate(updatedEvents);
  }, [convertedTimelineEvents, handleTimelineEventsUpdate]);

  const handleMoveStep = useCallback((dragIndex: number, hoverIndex: number) => {
    // Implement step reordering logic if needed
    console.log('Move step from', dragIndex, 'to', hoverIndex);
  }, []);

  // Navigation handlers for viewer mode
  const handlePrevStep = useCallback(() => {
    const currentStepIndex = uniqueSortedSteps.indexOf(currentStep);
    if (currentStepIndex > 0) {
      handleStepSelect(uniqueSortedSteps[currentStepIndex - 1]);
    }
  }, [currentStep, uniqueSortedSteps, handleStepSelect]);

  const handleNextStep = useCallback(() => {
    const currentStepIndex = uniqueSortedSteps.indexOf(currentStep);
    if (currentStepIndex < uniqueSortedSteps.length - 1) {
      handleStepSelect(uniqueSortedSteps[currentStepIndex + 1]);
    }
  }, [currentStep, uniqueSortedSteps, handleStepSelect]);

  const currentStepIndex = uniqueSortedSteps.indexOf(currentStep);

  return (
    <div className={`slide-timeline-adapter ${className}`}>
      <HorizontalTimeline
        uniqueSortedSteps={uniqueSortedSteps}
        currentStep={currentStep}
        onStepSelect={handleStepSelect}
        isEditing={isEditing}
        timelineEvents={convertedTimelineEvents}
        setTimelineEvents={handleTimelineEventsUpdate}
        hotspots={convertedHotspots}
        showPreviews={showPreviews}
        moduleState={moduleState}
        onPrevStep={handlePrevStep}
        onNextStep={handleNextStep}
        currentStepIndex={currentStepIndex}
        totalSteps={uniqueSortedSteps.length}
        isMobile={isMobile}
        onAddStep={handleAddStep}
        onDeleteStep={handleDeleteStep}
        onUpdateStep={handleUpdateStep}
        onMoveStep={handleMoveStep}
      />
    </div>
  );
};

export default SlideTimelineAdapter;