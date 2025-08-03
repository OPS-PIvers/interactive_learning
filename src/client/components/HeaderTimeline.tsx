import React, { useCallback, useMemo } from 'react';
import { SlideDeck } from '../../shared/slideTypes';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { useIOSSafariViewport } from '../hooks/useViewportHeight';
import { getIOSZIndexStyle, getIOSSafeAreaStyle, IOS_Z_INDEX } from '../utils/iosZIndexManager';

interface HeaderTimelineProps {
  slideDeck: SlideDeck;
  currentSlideIndex: number;
  onSlideChange: (slideId: string, slideIndex: number) => void;
  viewerMode?: 'explore' | 'guided' | 'auto-progression';
  className?: string;
  activeHotspotId?: string | null;
  completedHotspots?: Set<string>;
  onHotspotFocus?: (hotspotId: string, slideIndex: number) => void;
  // New props for viewer mode controls
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;
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
  onHotspotFocus,
  isPlaying = false,
  onPlay,
  onPause,
  playbackSpeed = 1,
  onSpeedChange
}) => {
  const { isIOSSafariUIVisible } = useIOSSafariViewport();
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

  // Get appropriate styles for mobile and iOS Safari
  const containerStyle = {
    ...getIOSZIndexStyle('FLOATING_MENU'),
    ...getIOSSafeAreaStyle({ 
      includeTop: true,
      additionalPadding: 4
    })
  };

  return (
    <div 
      className={`header-timeline bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 ${className}`}
      style={containerStyle}
    >
      <div className="flex items-center h-16 md:h-14 px-4 py-2 md:px-4">
        {/* Mode-specific left control */}
        {viewerMode === 'guided' ? (
          <button
            onClick={handlePrevSlide}
            disabled={currentSlideIndex === 0}
            className="flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="w-5 h-5 md:w-4 md:h-4" />
          </button>
        ) : viewerMode === 'auto-progression' ? (
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation"
            aria-label={isPlaying ? "Pause auto-progression" : "Play auto-progression"}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5 md:w-4 md:h-4" />
            ) : (
              <PlayIcon className="w-5 h-5 md:w-4 md:h-4" />
            )}
          </button>
        ) : (
          <div className="flex items-center justify-center w-11 h-11 md:w-9 md:h-9">
            {/* Empty space for explore mode */}
          </div>
        )}

        {/* Enhanced timeline track container */}
        <div className="flex-1 mx-4 relative">
          {/* Modern gradient progress track */}
          <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-600/70 rounded-full transform -translate-y-1/2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-blue-500 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Enhanced timeline steps */}
          <div className="flex items-center justify-between relative">
            {timelineSteps.map((step, index) => {
              const isActive = index === currentSlideIndex;
              const isCompleted = index < currentSlideIndex;
              const isInteractive = step.hasInteractions;

              return (
                <button
                  key={step.slideId}
                  onClick={() => handleStepClick(index)}
                  className={`relative flex items-center justify-center w-8 h-8 md:w-7 md:h-7 rounded-full transition-all duration-300 transform active:scale-95 md:hover:scale-110 touch-manipulation focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-800 group ${
                    isActive 
                      ? "bg-gradient-to-r from-white to-slate-100 text-purple-600 shadow-lg shadow-purple-500/20 scale-110 md:scale-125 z-10"
                      : isCompleted
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md hover:shadow-lg'
                        : 'bg-slate-500 text-slate-300 hover:bg-gradient-to-r hover:from-slate-400 hover:to-slate-300 shadow-sm'
                  }`}
                  title={`${step.title}${step.hotspotCount > 0 ? ` (${step.hotspotCount} hotspots)` : ''}`}
                  aria-label={`Go to ${step.title}${isActive ? ' (current)' : ''}`}
                >
                  {/* Enhanced step number or status indicator */}
                  <span className="text-xs font-bold transition-all duration-200 group-hover:scale-110">
                    {isCompleted ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>

                  {/* Enhanced interactive indicator */}
                  {isInteractive && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full border border-slate-800 animate-pulse shadow-sm" 
                         title="Contains interactive elements" />
                  )}

                  {/* Enhanced hotspot indicators with modern styling */}
                  {step.hotspots.length > 0 && (
                    <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 flex space-x-0.5 opacity-80 group-hover:opacity-100 transition-opacity duration-200">
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
                          className={`w-2 h-2 rounded-full transition-all duration-200 hover:scale-150 border border-white/40 shadow-sm ${
                            hotspot.isActive 
                              ? 'ring-1 ring-white shadow-lg animate-pulse scale-125' 
                              : hotspot.isCompleted
                                ? 'opacity-70 hover:opacity-90'
                                : 'hover:opacity-90'
                          }`}
                          style={{ 
                            backgroundColor: hotspot.color,
                            boxShadow: hotspot.isActive ? `0 0 8px ${hotspot.color}50` : undefined
                          }}
                          title={`${hotspot.title}${hotspot.isActive ? ' (active)' : hotspot.isCompleted ? ' (completed)' : ''}`}
                        />
                      ))}
                      {step.hotspots.length > 3 && (
                        <span className="text-xs text-slate-400 leading-none font-medium">+{step.hotspots.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode-specific right control */}
        {viewerMode === 'guided' ? (
          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex === slideDeck.slides.length - 1}
            className="flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation"
            aria-label="Next slide"
          >
            <ChevronRightIcon className="w-5 h-5 md:w-4 md:h-4" />
          </button>
        ) : viewerMode === 'auto-progression' && onSpeedChange ? (
          <select
            value={playbackSpeed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-gradient-to-r from-slate-700 to-slate-600 border border-slate-600/50 rounded-lg px-3 py-1.5 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 h-11 md:h-9"
            aria-label="Playback speed"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        ) : (
          <div className="flex items-center justify-center w-11 h-11 md:w-9 md:h-9">
            {/* Empty space for explore mode */}
          </div>
        )}

        {/* Mode indicator and messaging */}
        {viewerMode === 'explore' ? (
          <div className="ml-3 px-3 py-1.5 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 border border-sky-500/30 rounded-full shadow-sm backdrop-blur-sm">
            <span className="text-xs text-sky-300 font-semibold tracking-wide">
              Click the hotspots to explore
            </span>
          </div>
        ) : (
          <div className="ml-3 px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full shadow-sm backdrop-blur-sm">
            <span className="text-xs text-green-300 font-semibold tracking-wide">
              {viewerMode === 'guided' ? 'GUIDED' : 'AUTO'}
            </span>
          </div>
        )}

        {/* Enhanced progress text - responsive sizing */}
        <div className="ml-2 md:ml-3 text-center min-w-0">
          <div className="text-xs text-slate-300 font-semibold whitespace-nowrap">
            {currentSlideIndex + 1} / {slideDeck.slides.length}
          </div>
          <div className="hidden md:block text-xs text-slate-500 font-medium">
            {Math.round(progressPercentage)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderTimeline;