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
    const targetStep = timelineSteps[stepIndex];
    if (targetStep) {
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
    <div className={`timeline-progress-tracker bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 shadow-lg ${className}`}>
      {/* Enhanced Progress Bar */}
      <div className="w-full bg-slate-700/70 rounded-full h-3 mb-6 overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-purple-500 via-purple-400 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Enhanced Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {!progress.isPlaying ? (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={progress.currentStep >= timelineSteps.length - 1}
            >
              ▶️ Play
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              ⏸️ Pause
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            ⏮️ Reset
          </button>
        </div>

        <div className="text-center">
          <div className="text-sm text-slate-300 font-semibold">
            Step {progress.currentStep + 1} of {timelineSteps.length}
          </div>
          {currentStep && (
            <div className="text-xs text-slate-400 font-medium">
              Slide {currentStep.slideIndex + 1} • {Math.round(progressPercentage)}%
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Current Step Info */}
      {currentStep && (
        <div className="mt-4 p-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-lg border border-slate-600/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
            <div className="text-sm font-semibold text-slate-100">
              Current Step: Slide {currentStep.slideIndex + 1}
            </div>
          </div>
          {currentStep.elementId && (
            <div className="text-xs text-slate-300 mb-2 bg-slate-800/30 px-2 py-1 rounded">
              Element Interaction: {currentStep.interactionId}
            </div>
          )}
          <div className="text-xs text-slate-400 flex gap-4">
            <span>Duration: {currentStep.duration}ms</span>
            {currentStep.delay > 0 && <span>Delay: {currentStep.delay}ms</span>}
          </div>
        </div>
      )}

      {/* Enhanced Interactive Timeline Scrubber */}
      <div className="mt-4">
        <div className="text-xs text-slate-400 font-medium mb-3 flex items-center gap-2">
          <span>Timeline Steps:</span>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-600 to-transparent"></div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {timelineSteps.map((step, index) => (
            <button
              key={index}
              onClick={() => handleStepSelect(index)}
              className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 border-2 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                index === progress.currentStep
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-white scale-110 shadow-lg shadow-purple-500/25'
                  : index < progress.currentStep
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-200 shadow-md'
                    : 'bg-slate-600 text-slate-300 border-slate-400 hover:bg-gradient-to-r hover:from-slate-500 hover:to-slate-400 shadow-sm'
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