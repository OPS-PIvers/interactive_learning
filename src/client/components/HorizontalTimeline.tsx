import React, { useState, useCallback } from 'react';
import { TimelineEventData, HotspotData } from '../../shared/types';
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
  const timelineScrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isMobile && timelineScrollRef.current && uniqueSortedSteps.length > 0 && currentStepIndex !== undefined) {
      const activeDot = timelineScrollRef.current.children[currentStepIndex] as HTMLElement;
      if (activeDot) {
        const scrollLeft = activeDot.offsetLeft - (timelineScrollRef.current.offsetWidth / 2) + (activeDot.offsetWidth / 2);
        timelineScrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [currentStepIndex, isMobile, uniqueSortedSteps]);


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
    const progressPercent = totalSteps && totalSteps > 1 ? ((currentStepIndex || 0) / (totalSteps - 1)) * 100 : 0;
    const currentEvent = timelineEvents.find(event => event.step === currentStep && event.name);

    return (
      <div className="w-full bg-slate-800 py-2 border-t border-slate-700">
        {/* Event Preview (Collapsible) */}
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

        {/* Progress Bar and Step Indicators */}
        <div className="px-3">
          <div className="relative h-2 bg-slate-600 rounded-full w-full">
            <div
              className="absolute top-0 left-0 h-2 bg-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div
            ref={timelineScrollRef}
            className="mt-2 flex gap-x-2 overflow-x-auto pb-2 hide-scrollbar" // hide-scrollbar is a utility class you might need to define
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {uniqueSortedSteps.map((step, index) => {
              const isActive = step === currentStep;
              return (
                <button
                  key={step}
                  onClick={() => onStepSelect(step)}
                  className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-medium transition-all duration-200 ease-in-out border-2
                    ${isActive ? 'bg-purple-500 border-purple-300 text-white scale-110' : 'bg-slate-500 border-slate-400 text-slate-200 hover:bg-purple-400 hover:border-purple-300'}
                    flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 focus:ring-offset-slate-800
                  `}
                  aria-label={`Step ${index + 1}`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Controls */}
        {moduleState === 'learning' && onPrevStep && onNextStep && totalSteps !== undefined && currentStepIndex !== undefined && (
          <div className="flex items-center justify-between mt-2 px-3">
            <button
              onClick={onPrevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-60 text-slate-200 hover:text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Prev
            </button>
            <span className="text-slate-300 text-xs font-medium">
              Step {(currentStepIndex || 0) + 1} / {totalSteps}
            </span>
            <button
              onClick={onNextStep}
              disabled={currentStepIndex >= totalSteps - 1}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-60 text-slate-200 hover:text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed"
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
            {uniqueSortedSteps.map((step, index) => {
              const isActive = step === currentStep;
              return (
                <button
                  key={step}
                  onClick={(event) => handleStepClick(step, event)}
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
              );
            })}
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
        </div>
      </div>
      {renderNavigationControls()}
    </div>
  );
};

export default HorizontalTimeline;
