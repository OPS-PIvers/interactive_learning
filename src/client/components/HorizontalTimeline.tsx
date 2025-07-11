import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TimelineEventData, HotspotData } from '../../shared/types';
import { triggerHapticFeedback } from '../utils/hapticUtils';
import { XMarkIcon } from './icons/XMarkIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface HorizontalTimelineProps {
  uniqueSortedSteps: number[];
  currentStep: number;
  onStepSelect: (step: number) => void;
  isEditing: boolean;
  timelineEvents: TimelineEventData[];
  hotspots: HotspotData[];
  showPreviews?: boolean; // New optional prop
  moduleState?: 'idle' | 'learning';
  onPrevStep?: () => void;
  onNextStep?: () => void;
  currentStepIndex?: number;
  totalSteps?: number;
  isMobile?: boolean;
}

/**
 * HorizontalTimeline Component
 *
 * Displays a timeline of steps, allowing users to navigate between them.
 * Offers different views and interactions for desktop and mobile.
 *
 * Mobile Features:
 * - Scrollable list of step indicators.
 * - Progress bar.
 * - Next/Previous buttons.
 * - Swipe left/right gestures on the timeline area to navigate steps.
 * - Haptic feedback ('milestone') on step change.
 *
 * Desktop Features:
 * - Dot-based timeline with tooltips and hotspot indicators.
 * - Optional event preview card on double-click (if `showPreviews` is true).
 */
const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  uniqueSortedSteps,
  currentStep,
  onStepSelect,
  isEditing,
  timelineEvents,
  hotspots,
  showPreviews = true,
  moduleState,
  onPrevStep,
  onNextStep,
  currentStepIndex,
  totalSteps,
  isMobile,
}) => {
  // Add state for preview
  const [activePreview, setActivePreview] = useState<number | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile Specific State
  const [isEventPreviewCollapsed, setIsEventPreviewCollapsed] = useState<boolean>(true);
  // timelineScrollRef removed as it's no longer used

  // Swipe gesture states
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null); // To detect vertical scroll

  const SWIPE_THRESHOLD = 50; // Minimum pixels for a swipe
  const VERTICAL_SWIPE_THRESHOLD = 30; // Max vertical movement to still consider it a horizontal swipe

  const prevCurrentStepIndexRef = useRef<number | undefined>(currentStepIndex);

  // React.useEffect(() => { // This useEffect was for scrolling the old numbered step UI
  //   if (isMobile && timelineScrollRef.current && uniqueSortedSteps.length > 0 && currentStepIndex !== undefined) {
  //     const activeDot = timelineScrollRef.current.children[currentStepIndex] as HTMLElement;
  //     if (activeDot) {
  //       const scrollLeft = activeDot.offsetLeft - (timelineScrollRef.current.offsetWidth / 2) + (activeDot.offsetWidth / 2);
  //       timelineScrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  //     }
  //   }
  // }, [currentStepIndex, isMobile, uniqueSortedSteps]);

  // Effect for haptic feedback on step change
  useEffect(() => {
    if (isMobile && typeof prevCurrentStepIndexRef.current !== 'undefined' && prevCurrentStepIndexRef.current !== currentStepIndex) {
      triggerHapticFeedback('milestone');
    }
    prevCurrentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex, isMobile]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX; // Initialize endX
    touchStartYRef.current = e.targetTouches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current === null) {
      return;
    }
    touchEndXRef.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchEndXRef.current === null || touchStartYRef.current === null) {
      return;
    }

    const deltaX = touchEndXRef.current - touchStartXRef.current;
    // Use changedTouches for touchend event
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);

    // Check if it's a horizontal swipe and not a vertical scroll
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && deltaY < VERTICAL_SWIPE_THRESHOLD) {
      if (deltaX > 0) { // Swipe Right
        if (onPrevStep) {
          onPrevStep();
        }
      } else { // Swipe Left
        if (onNextStep) {
          onNextStep();
        }
      }
    }

    // Reset refs
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    touchStartYRef.current = null;
  }, [onPrevStep, onNextStep]);


  if (uniqueSortedSteps.length === 0 && !isEditing) { // Allow empty timeline in editing for initial step
    return null;
  }

  if (isMobile && isEditing) { // Hide timeline in mobile editing for now, as per simplified AGENTS.md focus on viewer
      return (
        <div className="w-full bg-slate-800 p-2 text-center">
            <p className="text-xs text-slate-400">Timeline editing is optimized for desktop.</p>
        </div>
      );
  }


  const getStepTooltip = (step: number): string => {
    const eventsAtStep = timelineEvents.filter(e => e.step === step);
    if (eventsAtStep.length === 0) return `Step ${step}`;

    const eventSummaries = eventsAtStep.map(event => {
      let summary = event.name || event.type;
      if (event.targetId) {
        const hotspot = hotspots.find(h => h.id === event.targetId);
        if (hotspot) summary += ` (${hotspot.title})`;
        else summary += ` (${event.targetId})`;
      }
      return summary;
    }).slice(0, 3); // Show first 3 events for brevity

    let tooltipText = `Step ${step}: ${eventSummaries.join(' | ')}`;
    if (eventsAtStep.length > 3) tooltipText += '...';
    return tooltipText;
  };

  // EventPreviewCard component
  const EventPreviewCard: React.FC<{
    step: number;
    events: TimelineEventData[];
    hotspots: HotspotData[];
    position: { x: number; y: number };
    onClose: () => void;
  }> = ({ step, events, hotspots, position, onClose }) => {
    const eventsAtStep = events.filter(e => e.step === step);
    
    return (
      <div
        className="absolute z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 min-w-[250px] max-w-[350px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y - 10}px`,
          transform: 'translateY(-100%)'
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-slate-100 text-sm">Step {step}</h4>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 ml-2"
          >
            <XMarkIcon className="w-3 h-3" />
          </button>
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {eventsAtStep.length === 0 ? (
            <p className="text-slate-400 text-xs">No events at this step</p>
          ) : (
            eventsAtStep.map((event, index) => {
              const hotspot = event.targetId ? hotspots.find(h => h.id === event.targetId) : null;
              return (
                <div key={event.id} className="text-xs text-slate-300 p-2 bg-slate-700 rounded">
                  <div className="font-medium">{event.name}</div>
                  <div className="text-slate-400">{event.type.replace(/_/g, ' ')}</div>
                  {hotspot && (
                    <div className="flex items-center space-x-1 mt-1">
                      <div className={`w-2 h-2 rounded-full ${hotspot.color || 'bg-gray-500'}`}></div>
                      <span>{hotspot.title}</span>
                    </div>
                  )}
                  {event.message && (
                    <div className="italic text-slate-400 mt-1">"{event.message.substring(0, 50)}..."</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Handle step click with preview support
  const handleStepClick = useCallback((step: number, event: React.MouseEvent) => {
    if (showPreviews && event.detail === 2) { // Double click for preview
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const containerRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      
      setPreviewPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top
      });
      setActivePreview(step);
    } else {
      onStepSelect(step);
    }
  }, [onStepSelect, showPreviews]);

  // Add navigation section for viewer mode
  const renderNavigationControls = () => {
    if (isEditing || moduleState !== 'learning') return null;
    
    return (
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={onPrevStep}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Previous
        </button>
        
        <span className="text-slate-300 text-sm">
          Step {(currentStepIndex || 0) + 1} of {totalSteps}
        </span>
        
        <button
          onClick={onNextStep}
          disabled={currentStepIndex !== undefined && totalSteps !== undefined && currentStepIndex >= totalSteps - 1}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          Next
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (isMobile) {
    // const progressPercent = totalSteps && totalSteps > 1 ? ((currentStepIndex || 0) / (totalSteps - 1)) * 100 : 0; // Old progress bar
    const currentEvent = timelineEvents.find(event => event.step === currentStep && event.name);

    // Mobile view now aims to mirror desktop structure
    return (
      <div
        className="w-full bg-slate-800 py-2 border-t border-slate-700"
        onTouchStart={handleTouchStart} // Keep swipe gestures for navigation
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Event Preview (Collapsible) - Kept for now */}
        {currentEvent && moduleState === 'learning' && (
          <div className="px-3 pb-2">
            <button
              onClick={() => setIsEventPreviewCollapsed(!isEventPreviewCollapsed)}
              className="w-full text-left text-xs text-slate-300 hover:text-slate-100 flex justify-between items-center"
            >
              <span>Current: <span className="font-medium">{currentEvent.name}</span></span>
              <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${isEventPreviewCollapsed ? '' : 'rotate-180'}`} />
            </button>
            {!isEventPreviewCollapsed && (
              <div className="mt-1 p-2 bg-slate-700 rounded text-xs text-slate-300">
                 <p>{currentEvent.message || "No additional details for this event."}</p>
              </div>
            )}
          </div>
        )}

        {/* Timeline dots - styled like desktop */}
        <div className="px-4 py-2"> {/* Using similar padding as desktop */}
          <div className="relative w-full h-8 flex items-center"> {/* Using same height and flex properties */}
            {/* Timeline track */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-600 rounded-full transform -translate-y-1/2" />

            {/* Timeline dots */}
            <div className="relative w-full flex items-center justify-between">
              {uniqueSortedSteps.map((step) => {
                const isActive = step === currentStep;
                return (
                  <div key={step} className="relative"> {/* Each dot is relative for potential future absolute children like hotspot indicators */}
                    <button
                      onClick={() => onStepSelect(step)} // Simplified click handler for mobile, no double click preview
                      className={`relative w-6 h-6 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 ease-in-out
                        ${isActive ? 'bg-purple-500 ring-2 ring-purple-300 scale-125' : 'bg-slate-400 hover:bg-purple-400'}
                        flex items-center justify-center
                      `}
                      aria-label={getStepTooltip(step)} // Tooltip for accessibility
                      aria-current={isActive ? "step" : undefined}
                      title={getStepTooltip(step)} // Title for mouse hover
                    >
                      {isActive && <span className="absolute w-2 h-2 bg-white rounded-full"></span>}
                    </button>
                    {/* Hotspot indicators for mobile - mirroring desktop structure */}
                    <div className="absolute top-full mt-1 flex space-x-0.5 justify-center w-full"> {/* Reduced mt and space for mobile */}
                      {timelineEvents
                        .filter(event => event.step === step && event.targetId)
                        .map(event => {
                          const hotspot = hotspots.find(h => h.id === event.targetId);
                          return hotspot ? (
                            <div
                              key={`${event.id}-${hotspot.id}-mobile`}
                              className="w-1.5 h-1.5 rounded-full" // Smaller dots for mobile
                              style={{ backgroundColor: hotspot.color || '#ccc' }}
                              title={`Hotspot: ${hotspot.title}`} // Keep title for accessibility if possible, though less useful on touch
                            />
                          ) : null;
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation Controls - using existing mobile button structure */}
        {moduleState === 'learning' && onPrevStep && onNextStep && totalSteps !== undefined && currentStepIndex !== undefined && (
          <div className="flex items-center justify-between mt-2 px-3">
            <button
              onClick={onPrevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed" // Adjusted: gap, px, disabled:opacity, text color
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Previous
            </button>
            <span className="text-slate-300 text-xs font-medium">
              Step {(currentStepIndex || 0) + 1} / {totalSteps}
            </span>
            <button
              onClick={onNextStep}
              disabled={currentStepIndex >= totalSteps - 1}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed" // Adjusted: gap, px, disabled:opacity, text color
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default Desktop Timeline
  return (
    <div className="w-full" aria-label="Module Timeline">
      <div className="px-4 py-2">
        <div className="relative w-full h-8 flex items-center">
          {/* Timeline track */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-600 rounded-full transform -translate-y-1/2" />

          {/* Timeline dots */}
          <div className="relative w-full flex items-center justify-between">
            {uniqueSortedSteps.map((step, index) => { // Added index here for consistency, though not used directly in this part
              const isActive = step === currentStep;
              return (
                <div key={step} className="relative">
                  <button
                    onClick={(event) => handleStepClick(step, event)} // Desktop keeps double click preview
                    className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 ease-in-out
                      ${isActive ? 'bg-purple-500 ring-2 ring-purple-300 scale-125' : 'bg-slate-400 hover:bg-purple-400'}
                      flex items-center justify-center
                    `}
                    aria-label={`${getStepTooltip(step)}${showPreviews ? '. Double-click for preview' : ''}`}
                    aria-current={isActive ? "step" : undefined}
                    title={`${getStepTooltip(step)}${showPreviews ? '. Double-click for preview' : ''}`}
                  >
                    {/* Optional: Inner dot or number if needed, for now just color indicates active */}
                     {isActive && <span className="absolute w-2 h-2 bg-white rounded-full"></span>}
                  </button>
                  {/* Add hotspot indicators container */}
                  <div className="absolute top-full mt-1.5 flex space-x-1 justify-center w-full">
                    {timelineEvents
                      .filter(event => event.step === step && event.targetId)
                      .map(event => {
                        const hotspot = hotspots.find(h => h.id === event.targetId);
                        return hotspot ? (
                          <div
                            key={`${event.id}-${hotspot.id}`}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: hotspot.color || '#ccc' }}
                            title={`Hotspot: ${hotspot.title}`}
                          />
                        ) : null;
                      })}
                  </div>
                </div>
              );
          })}
        </div>
      </div>
      </div>
      {/* Preview Card */}
      {activePreview && showPreviews && !isMobile && ( // Don't show desktop preview card on mobile
        <EventPreviewCard
          step={activePreview}
          events={timelineEvents}
          hotspots={hotspots}
          position={previewPosition}
          onClose={() => setActivePreview(null)}
        />
      )}
      {renderNavigationControls()}
    </div>
  );
};

export default HorizontalTimeline;
