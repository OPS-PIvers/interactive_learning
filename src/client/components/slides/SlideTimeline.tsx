import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement, ElementInteraction, SlideEffect } from '../../../shared/slideTypes';
import { PauseIcon } from '../icons/PauseIcon';
import { PlayIcon } from '../icons/PlayIcon';
import { StopIcon } from '../icons/StopIcon';

interface TimelineStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  elementId?: string;
  interaction: ElementInteraction;
  slideIndex: number;
  timestamp: number; // Duration in seconds from start
}

interface SlideTimelineProps {
  slideDeck: SlideDeck;
  currentSlideIndex: number;
  initialStep: number;
  onStepChange: (stepIndex: number) => void;
  onEffectTrigger: (effect: SlideEffect) => void;
  isVisible?: boolean;
  autoPlay?: boolean;
  className?: string;
}

/**
 * SlideTimeline - Interactive timeline for navigating through slide interactions
 * 
 * Provides sequential playback of hotspot interactions and animations across slides
 */
export const SlideTimeline: React.FC<SlideTimelineProps> = ({
  slideDeck,
  currentSlideIndex,
  initialStep,
  onStepChange,
  onEffectTrigger,
  isVisible = true,
  autoPlay = false,
  className = ''
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate timeline steps from slide interactions
  const generateTimelineSteps = useCallback(() => {
    const steps: TimelineStep[] = [];
    let stepNumber = 1;
    let currentTimestamp = 0;
    
    slideDeck.slides.forEach((slide, slideIndex) => {
      slide.elements.forEach(element => {
        element.interactions.forEach(interaction => {
          // Only include interactions that have meaningful effects
          if (interaction.trigger === 'click' || interaction.trigger === 'auto' || interaction.trigger === 'timeline') {
            const step: TimelineStep = {
              id: `${slide.id}-${element.id}-${interaction.id}`,
              stepNumber,
              title: element.content.title || `Step ${stepNumber}`,
              description: element.content.description || getEffectDescription(interaction.effect),
              elementId: element.id,
              interaction,
              slideIndex,
              timestamp: currentTimestamp
            };
            
            steps.push(step);
            stepNumber++;
            
            // Add duration for next step timing
            currentTimestamp += interaction.effect.duration / 1000 + 1; // Add 1 second between steps
          }
        });
      });
    });
    
    return steps;
  }, [slideDeck]);
  
  // Get description for effect type
  const getEffectDescription = (effect: SlideEffect): string => {
    switch (effect.type) {
      case 'spotlight':
        return 'Spotlight effect';
      case 'zoom':
        return 'Zoom to area';
      case 'pan_zoom':
        return 'Pan and zoom';
      case 'show_text':
        return 'Show text overlay';
      case 'play_media':
        return 'Play media';
      case 'play_video':
        return 'Play video';
      case 'play_audio':
        return 'Play audio';
      case 'quiz':
        return 'Interactive quiz';
      case 'animate':
        return 'Element animation';
      case 'transition':
        return 'Slide transition';
      default:
        return 'Interactive element';
    }
  };
  
  // Initialize timeline steps
  useEffect(() => {
    const steps = generateTimelineSteps();
    setTimelineSteps(steps);
    
    // Reset to first step if steps changed
    if (steps.length > 0 && currentStepIndex >= steps.length) {
      setCurrentStepIndex(0);
    }
  }, [slideDeck, generateTimelineSteps, currentStepIndex]);

  
  // Handle step change
  const handleStepChange = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= timelineSteps.length) return;
    
    const step = timelineSteps[stepIndex];
    if (!step) return;

    setCurrentStepIndex(stepIndex);
    
    // Notify parent of step change
    onStepChange(stepIndex);
    
    // Trigger the effect for this step
    onEffectTrigger(step.interaction.effect);
    
    // Navigate to the correct slide if needed
    if (step.slideIndex !== currentSlideIndex) {
      // Parent should handle slide navigation
    }
  }, [timelineSteps, onStepChange, onEffectTrigger, currentSlideIndex]);
  
  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && timelineSteps.length > 0) {
      const currentStep = timelineSteps[currentStepIndex];
      const nextStepIndex = currentStepIndex + 1;
      
      if (nextStepIndex < timelineSteps.length) {
        const nextStep = timelineSteps[nextStepIndex];
        if (currentStep && nextStep) {
          const delay = (nextStep.timestamp - currentStep.timestamp) * 1000 / playbackSpeed;

          autoPlayTimerRef.current = setTimeout(() => {
            handleStepChange(nextStepIndex);
          }, Math.max(delay, 1000)); // Minimum 1 second between steps
        }
      } else {
        // End of timeline
        setIsPlaying(false);
      }
    }
    
    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [isPlaying, currentStepIndex, timelineSteps, playbackSpeed, handleStepChange]);
  
  // Playback controls
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);
  
  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
    }
  }, []);
  
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
    }
  }, []);
  
  const handlePrevious = useCallback(() => {
    handleStepChange(Math.max(0, currentStepIndex - 1));
  }, [currentStepIndex, handleStepChange]);
  
  const handleNext = useCallback(() => {
    handleStepChange(Math.min(timelineSteps.length - 1, currentStepIndex + 1));
  }, [currentStepIndex, timelineSteps.length, handleStepChange]);
  
  // Scrub to specific step
  const handleScrub = useCallback((stepIndex: number) => {
    setIsPlaying(false);
    handleStepChange(stepIndex);
  }, [handleStepChange]);
  
  // Enable keyboard shortcuts
  useTimelineKeyboardShortcuts(
    isVisible,
    isPlaying,
    timelineSteps,
    handlePrevious,
    handleNext,
    handlePlay,
    handlePause,
    handleStop,
    handleScrub
  );
  
  if (!isVisible || timelineSteps.length === 0) {
    return null;
  }
  
  const currentStepData = timelineSteps[currentStepIndex];
  const progress = timelineSteps.length > 0 ? (currentStepIndex / (timelineSteps.length - 1)) * 100 : 0;
  
  return (
    <div className={`slide-timeline bg-slate-800/95 backdrop-blur-sm border-t border-slate-700/50 shadow-lg ${className}`}>
      
      {/* Enhanced Current Step Info */}
      {currentStepData && (
        <div className="px-4 py-3 border-b border-slate-700/30 bg-gradient-to-r from-slate-700/30 to-slate-600/30">
          <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
            {currentStepData.title}
          </h4>
          <p className="text-slate-300 text-xs leading-relaxed">{currentStepData.description}</p>
        </div>
      )}
      
      {/* Enhanced Timeline Progress Bar */}
      <div className="px-4 py-4">
        <div className="relative">
          <div className="w-full h-2.5 bg-slate-700/70 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-blue-500 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Enhanced Timeline Markers */}
          <div className="absolute top-0 w-full h-2.5 flex justify-between">
            {timelineSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleScrub(index)}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 transform -translate-y-0.5 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                  index === currentStepIndex
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 border-white scale-125 shadow-lg shadow-purple-500/25'
                    : index < currentStepIndex
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-200 shadow-md'
                      : 'bg-slate-600 border-slate-400 hover:bg-gradient-to-r hover:from-slate-500 hover:to-slate-400 shadow-sm'
                }`}
                title={`${step.title} - ${step.description}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Enhanced Playback Controls */}
      <div className="px-4 py-4 flex items-center justify-center gap-4 bg-gradient-to-r from-slate-800/30 to-slate-700/30 border-t border-slate-700/30">
        <button
          onClick={handleStop}
          className="p-2.5 text-slate-400 hover:text-white transition-all duration-200 rounded-lg hover:bg-slate-700/60 shadow-sm hover:shadow-md"
          title="Stop and reset"
        >
          <StopIcon className="w-4 h-4" />
        </button>
        
        <button
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
          className="p-2.5 text-slate-400 hover:text-white disabled:text-slate-600 disabled:opacity-30 transition-all duration-200 rounded-lg hover:bg-slate-700/60 disabled:hover:bg-transparent shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          title="Previous step"
        >
          ⏮
        </button>
        
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
        </button>
        
        <button
          onClick={handleNext}
          disabled={currentStepIndex === timelineSteps.length - 1}
          className="p-2.5 text-slate-400 hover:text-white disabled:text-slate-600 disabled:opacity-30 transition-all duration-200 rounded-lg hover:bg-slate-700/60 disabled:hover:bg-transparent shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          title="Next step"
        >
          ⏭
        </button>
        
        <div className="ml-4 text-slate-300 text-xs font-medium bg-slate-700/50 px-2 py-1 rounded-full">
          {currentStepData ? `${Math.round(currentStepData.timestamp)}s` : '0s'}
        </div>
      </div>
      
      {/* Enhanced Timeline Steps List */}
      <div className="max-h-36 overflow-y-auto border-t border-slate-700/30 bg-gradient-to-b from-slate-800/20 to-slate-700/20">
        {timelineSteps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => handleScrub(index)}
            className={`w-full px-4 py-3 text-left transition-all duration-200 border-b border-slate-700/30 hover:border-slate-600/50 ${
              index === currentStepIndex
                ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50'
                : 'hover:bg-gradient-to-r hover:from-slate-700/30 hover:to-slate-600/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  index === currentStepIndex 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                    : index < currentStepIndex
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-slate-500'
                }`} />
                <div>
                  <div className="text-white text-sm font-medium">{step.stepNumber}. {step.title}</div>
                  <div className="text-slate-300 text-xs leading-relaxed">{step.description}</div>
                </div>
              </div>
              <div className="text-slate-400 text-xs font-medium bg-slate-700/50 px-2 py-1 rounded-full">
                {Math.round(step.timestamp)}s
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Keyboard shortcuts help */}
      {process.env['NODE_ENV'] === 'development' && (
        <div className="px-4 py-2 border-t border-slate-700 text-slate-500 text-xs">
          <div className="flex flex-wrap gap-4">
            <span>↑/K: Previous</span>
            <span>↓/J: Next</span>
            <span>Space/Enter: Play/Pause</span>
            <span>R/Home: Reset</span>
            <span>1-9: Jump to step</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Add keyboard shortcuts
const useTimelineKeyboardShortcuts = (
  isVisible: boolean,
  isPlaying: boolean,
  timelineSteps: TimelineStep[],
  handlePrevious: () => void,
  handleNext: () => void,
  handlePlay: () => void,
  handlePause: () => void,
  handleStop: () => void,
  handleScrub: (index: number) => void
) => {
  React.useEffect(() => {
    const handleTimelineKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when timeline is visible and focused
      if (!isVisible) return;
      
      // Don't interfere with input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (event.key) {
        case 'ArrowUp':
        case 'k':
        case 'K':
          event.preventDefault();
          handlePrevious();
          break;
        case 'ArrowDown':
        case 'j':
        case 'J':
          event.preventDefault();
          handleNext();
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          isPlaying ? handlePause() : handlePlay();
          break;
        case 'r':
        case 'R':
        case 'Home':
          event.preventDefault();
          handleStop();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          event.preventDefault();
          const stepIndex = parseInt(event.key) - 1;
          if (stepIndex < timelineSteps.length) {
            handleScrub(stepIndex);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleTimelineKeyDown);
    return () => window.removeEventListener('keydown', handleTimelineKeyDown);
  }, [isVisible, isPlaying, timelineSteps.length, handlePrevious, handleNext, handlePlay, handlePause, handleStop, handleScrub]);
};

export default SlideTimeline;