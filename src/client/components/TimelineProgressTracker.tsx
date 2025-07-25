import React, { useState, useCallback, useEffect } from 'react';
import { SlideDeck, ElementInteraction } from '../../shared/slideTypes';

interface TimelineProgressTrackerProps {
  slideDeck: SlideDeck;
  currentSlideIndex: number;
  onSlideChange: (slideIndex: number) => void;
  isAutoProgression?: boolean;
  autoProgressionDelay?: number;
  className?: string;
}

interface TimelineProgress {
  currentStep: number;
  totalSteps: number;
  completedInteractions: Set<string>;
  isPlaying: boolean;
}

/**
 * TimelineProgressTracker - Manages timeline-based progression through slides
 * 
 * Provides auto-progression, smooth transitions, and interaction tracking
 * for timeline-driven slide experiences.
 */
const TimelineProgressTracker: React.FC<TimelineProgressTrackerProps> = ({
  slideDeck,
  currentSlideIndex,
  onSlideChange,
  isAutoProgression = false,
  autoProgressionDelay = 3000,
  className = ''
}) => {
  const [progress, setProgress] = useState<TimelineProgress>({
    currentStep: 0,
    totalSteps: slideDeck.slides.length,
    completedInteractions: new Set(),
    isPlaying: isAutoProgression
  });

  // Calculate timeline steps from slide interactions
  const timelineSteps = React.useMemo(() => {
    const steps: Array<{
      slideIndex: number;
      elementId?: string;
      interactionId?: string;
      delay: number;
      duration: number;
    }> = [];

    slideDeck.slides.forEach((slide, slideIndex) => {
      // Add slide entry step
      steps.push({
        slideIndex,
        delay: 0,
        duration: 1000
      });

      // Add timeline interactions
      slide.elements.forEach((element) => {
        element.interactions
          .filter(interaction => interaction.trigger === 'timeline')
          .forEach((interaction) => {
            steps.push({
              slideIndex,
              elementId: element.id,
              interactionId: interaction.id,
              delay: interaction.effect.delay || 0,
              duration: interaction.effect.duration || 500
            });
          });
      });
    });

    return steps.sort((a, b) => {
      if (a.slideIndex === b.slideIndex) {
        return a.delay - b.delay;
      }
      return a.slideIndex - b.slideIndex;
    });
  }, [slideDeck.slides]);

  // Auto-progression timer
  useEffect(() => {
    if (!progress.isPlaying || !isAutoProgression) return;

    const currentStep = timelineSteps[progress.currentStep];
    if (!currentStep) return;

    const totalDelay = currentStep.delay + currentStep.duration + autoProgressionDelay;

    const timer = setTimeout(() => {
      // Check if this step involves a slide change
      if (currentStep.slideIndex !== currentSlideIndex) {
        onSlideChange(currentStep.slideIndex);
      }

      // Mark interaction as completed
      if (currentStep.interactionId) {
        setProgress(prev => ({
          ...prev,
          completedInteractions: new Set([...prev.completedInteractions, currentStep.interactionId!])
        }));
      }

      // Move to next step
      setProgress(prev => ({
        ...prev,
        currentStep: Math.min(prev.currentStep + 1, timelineSteps.length - 1)
      }));
    }, totalDelay);

    return () => clearTimeout(timer);
  }, [progress.currentStep, progress.isPlaying, isAutoProgression, timelineSteps, currentSlideIndex, onSlideChange, autoProgressionDelay]);

  // Play/pause controls
  const handlePlay = useCallback(() => {
    setProgress(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const handlePause = useCallback(() => {
    setProgress(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const handleReset = useCallback(() => {
    setProgress({
      currentStep: 0,
      totalSteps: timelineSteps.length,
      completedInteractions: new Set(),
      isPlaying: false
    });
    if (slideDeck.slides.length > 0) {
      onSlideChange(0);
    }
  }, [timelineSteps.length, slideDeck.slides.length, onSlideChange]);

  // Manual step navigation
  const handleStepSelect = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < timelineSteps.length) {
      const targetStep = timelineSteps[stepIndex];
      
      setProgress(prev => ({
        ...prev,
        currentStep: stepIndex,
        isPlaying: false
      }));

      if (targetStep.slideIndex !== currentSlideIndex) {
        onSlideChange(targetStep.slideIndex);
      }
    }
  }, [timelineSteps, currentSlideIndex, onSlideChange]);

  // Progress calculation
  const progressPercentage = timelineSteps.length > 0 
    ? (progress.currentStep / (timelineSteps.length - 1)) * 100 
    : 0;

  const currentStep = timelineSteps[progress.currentStep];

  return (
    <div className={`timeline-progress-tracker ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!progress.isPlaying ? (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              disabled={progress.currentStep >= timelineSteps.length - 1}
            >
              ▶️ Play
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
            >
              ⏸️ Pause
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
          >
            ⏮️ Reset
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Step {progress.currentStep + 1} of {timelineSteps.length}
          {currentStep && (
            <span className="ml-2">
              (Slide {currentStep.slideIndex + 1})
            </span>
          )}
        </div>
      </div>

      {/* Current Step Info */}
      {currentStep && (
        <div className="mt-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
          <div className="text-sm font-medium text-slate-200">
            Current Step: Slide {currentStep.slideIndex + 1}
          </div>
          {currentStep.elementId && (
            <div className="text-xs text-slate-400 mt-1">
              Element Interaction: {currentStep.interactionId}
            </div>
          )}
          <div className="text-xs text-slate-500 mt-1">
            Duration: {currentStep.duration}ms
            {currentStep.delay > 0 && ` • Delay: ${currentStep.delay}ms`}
          </div>
        </div>
      )}

      {/* Interactive Timeline Scrubber */}
      <div className="mt-4">
        <div className="text-xs text-slate-400 mb-2">Timeline Steps:</div>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {timelineSteps.map((step, index) => (
            <button
              key={index}
              onClick={() => handleStepSelect(index)}
              className={`flex-shrink-0 w-6 h-6 rounded-full text-xs transition-all ${
                index === progress.currentStep
                  ? 'bg-purple-500 text-white scale-110'
                  : index < progress.currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
              title={`Step ${index + 1}: Slide ${step.slideIndex + 1}${step.elementId ? ' (Interaction)' : ''}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineProgressTracker;