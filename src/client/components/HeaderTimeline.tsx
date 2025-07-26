import React, { useCallback, useMemo } from 'react';
import { SlideDeck } from '../../shared/slideTypes';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface HeaderTimelineProps {
  slideDeck: SlideDeck;
  currentSlideIndex: number;
  onSlideChange: (slideId: string, slideIndex: number) => void;
  viewerMode?: 'explore' | 'guided' | 'auto-progression';
  className?: string;
  activeHotspotId?: string | null;
  completedHotspots?: Set<string>;
  onHotspotFocus?: (hotspotId: string, slideIndex: number) => void;
}

interface TimelineStep {
  slideIndex: number;
  slideId: string;
  title: string;
  hasInteractions: boolean;
  hotspotCount: number;
  hotspots: Array<{
    id: string;
    title: string;
    color: string;
    isActive: boolean;
    isCompleted: boolean;
  }>;
}

/**
 * HeaderTimeline - Persistent timeline component for slide navigation
 * 
 * Always visible at the top of viewers, shows slide progression and 
 * integrates with hotspot interactions. Provides consistent navigation
 * across all viewing modes.
 */
const HeaderTimeline: React.FC<HeaderTimelineProps> = ({
  slideDeck,
  currentSlideIndex,
  onSlideChange,
  viewerMode = 'explore',
  className = '',
  activeHotspotId = null,
  completedHotspots = new Set(),
  onHotspotFocus
}) => {
  // Generate timeline steps from slides
  const timelineSteps = useMemo((): TimelineStep[] => {
    return slideDeck.slides.map((slide, index) => {
      const hotspotElements = slide.elements.filter(element => element.type === 'hotspot');
      
      return {
        slideIndex: index,
        slideId: slide.id,
        title: slide.title || `Slide ${index + 1}`,
        hasInteractions: slide.elements.some(element => element.interactions && element.interactions.length > 0),
        hotspotCount: hotspotElements.length,
        hotspots: hotspotElements.map(element => {
          const backgroundColor = element.style?.backgroundColor || element.customProperties?.backgroundColor;
          const color = element.style?.color || element.customProperties?.color;
          
          return {
            id: element.id,
            title: element.content?.title || 'Hotspot',
            color: backgroundColor || color || '#3b82f6',
            isActive: activeHotspotId === element.id,
            isCompleted: completedHotspots.has(element.id)
          };
        })
      };
    });
  }, [slideDeck.slides, activeHotspotId, completedHotspots]);

  // Navigation handlers
  const handlePrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      const prevIndex = currentSlideIndex - 1;
      const prevSlide = slideDeck.slides[prevIndex];
      onSlideChange(prevSlide.id, prevIndex);
    }
  }, [currentSlideIndex, slideDeck.slides, onSlideChange]);

  const handleNextSlide = useCallback(() => {
    if (currentSlideIndex < slideDeck.slides.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      const nextSlide = slideDeck.slides[nextIndex];
      onSlideChange(nextSlide.id, nextIndex);
    }
  }, [currentSlideIndex, slideDeck.slides, onSlideChange]);

  const handleStepClick = useCallback((stepIndex: number) => {
    const step = timelineSteps[stepIndex];
    if (step && stepIndex !== currentSlideIndex) {
      onSlideChange(step.slideId, step.slideIndex);
    }
  }, [timelineSteps, currentSlideIndex, onSlideChange]);

  // Calculate progress percentage
  const progressPercentage = slideDeck.slides.length > 1 
    ? (currentSlideIndex / (slideDeck.slides.length - 1)) * 100 
    : 100;

  return (
    <div className={`header-timeline bg-slate-800/95 border-b border-slate-700 ${className}`}>
      <div className="flex items-center h-12 px-4">
        {/* Previous button */}
        <button
          onClick={handlePrevSlide}
          disabled={currentSlideIndex === 0}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {/* Timeline track container */}
        <div className="flex-1 mx-4 relative">
          {/* Progress track */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-600 rounded-full transform -translate-y-1/2">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Timeline steps */}
          <div className="flex items-center justify-between relative">
            {timelineSteps.map((step, index) => {
              const isActive = index === currentSlideIndex;
              const isCompleted = index < currentSlideIndex;
              const isInteractive = step.hasInteractions;

              return (
                <button
                  key={step.slideId}
                  onClick={() => handleStepClick(index)}
                  className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                    isActive 
                      ? 'bg-white text-purple-600 shadow-lg scale-125 z-10' 
                      : isCompleted
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-slate-500 text-slate-300 hover:bg-slate-400'
                  }`}
                  title={`${step.title}${step.hotspotCount > 0 ? ` (${step.hotspotCount} hotspots)` : ''}`}
                  aria-label={`Go to ${step.title}${isActive ? ' (current)' : ''}`}
                >
                  {/* Step number or status indicator */}
                  <span className="text-xs font-semibold">
                    {isCompleted ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>

                  {/* Interactive indicator */}
                  {isInteractive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-slate-800" 
                         title="Contains interactive elements" />
                  )}

                  {/* Hotspot indicators with states */}
                  {step.hotspots.length > 0 && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                      {step.hotspots.slice(0, 3).map((hotspot, i) => (
                        <button
                          key={hotspot.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onHotspotFocus && step.slideIndex === currentSlideIndex) {
                              onHotspotFocus(hotspot.id, step.slideIndex);
                            } else {
                              handleStepClick(step.slideIndex);
                            }
                          }}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-200 hover:scale-150 ${
                            hotspot.isActive 
                              ? 'ring-1 ring-white shadow-lg animate-pulse' 
                              : hotspot.isCompleted
                                ? 'opacity-60'
                                : 'hover:opacity-80'
                          }`}
                          style={{ 
                            backgroundColor: hotspot.color,
                            transform: hotspot.isActive ? 'scale(1.5)' : 'scale(1)'
                          }}
                          title={`${hotspot.title}${hotspot.isActive ? ' (active)' : hotspot.isCompleted ? ' (completed)' : ''}`}
                        />
                      ))}
                      {step.hotspots.length > 3 && (
                        <span className="text-xs text-slate-400 leading-none">+{step.hotspots.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Next button */}
        <button
          onClick={handleNextSlide}
          disabled={currentSlideIndex === slideDeck.slides.length - 1}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Next slide"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>

        {/* Mode indicator */}
        {viewerMode !== 'explore' && (
          <div className="ml-3 px-2 py-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full">
            <span className="text-xs text-green-300 font-medium">
              {viewerMode === 'guided' ? 'GUIDED' : 'AUTO'}
            </span>
          </div>
        )}

        {/* Progress text */}
        <div className="ml-3 text-xs text-slate-400 font-medium">
          {currentSlideIndex + 1} / {slideDeck.slides.length}
        </div>
      </div>
    </div>
  );
};

export default HeaderTimeline;