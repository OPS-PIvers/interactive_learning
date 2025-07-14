import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TimelineEventData, HotspotData } from '../../shared/types';
import { triggerHapticFeedback } from '../utils/hapticUtils';
import { XMarkIcon } from './icons/XMarkIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import MobileTimeline from './mobile/MobileTimeline';

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
  onAddStep: (step: number) => void;
  onDeleteStep: (step: number) => void;
  onUpdateStep: (oldStep: number, newStep: number) => void;
  onMoveStep: (dragIndex: number, hoverIndex: number) => void;
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
  onAddStep,
  onDeleteStep,
  onUpdateStep,
  onMoveStep,
}) => {
  const [activePreview, setActivePreview] = useState<number | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isEventPreviewCollapsed, setIsEventPreviewCollapsed] = useState<boolean>(true);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const SWIPE_THRESHOLD = 50;
  const VERTICAL_SWIPE_THRESHOLD = 30;

  const prevCurrentStepIndexRef = useRef<number | undefined>(currentStepIndex);

  useEffect(() => {
    if (isMobile && typeof prevCurrentStepIndexRef.current !== 'undefined' && prevCurrentStepIndexRef.current !== currentStepIndex) {
      triggerHapticFeedback('milestone');
    }
    prevCurrentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex, isMobile]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
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
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartYRef.current);

    if (Math.abs(deltaX) > SWIPE_THRESHOLD && deltaY < VERTICAL_SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        if (onPrevStep) {
          onPrevStep();
        }
      } else {
        if (onNextStep) {
          onNextStep();
        }
      }
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
    touchStartYRef.current = null;
  }, [onPrevStep, onNextStep]);

  if (isMobile && isEditing) {
    return (
      <MobileTimeline
        uniqueSortedSteps={uniqueSortedSteps}
        currentStep={currentStep}
        onStepSelect={onStepSelect}
        timelineEvents={timelineEvents}
        hotspots={hotspots}
        onAddStep={onAddStep}
        onDeleteStep={onDeleteStep}
        onUpdateStep={onUpdateStep}
        onMoveStep={onMoveStep}
      />
    );
  }

  if (uniqueSortedSteps.length === 0 && !isEditing) {
    return null;
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
    }).slice(0, 3);

    let tooltipText = `Step ${step}: ${eventSummaries.join(' | ')}`;
    if (eventsAtStep.length > 3) tooltipText += '...';
    return tooltipText;
  };

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

  const handleStepClick = useCallback((step: number, event: React.MouseEvent) => {
    if (showPreviews && event.detail === 2) {
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
    const currentEvent = timelineEvents.find(event => event.step === currentStep && event.name);

    return (
      <div
        className="w-full bg-slate-800 py-2 border-t border-slate-700"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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

        <div className="px-4 py-2">
          <div className="relative w-full h-8 flex items-center">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-600 rounded-full transform -translate-y-1/2" />
            <div className="relative w-full flex items-center justify-between">
              {uniqueSortedSteps.map((step) => {
                const isActive = step === currentStep;
                return (
                  <div key={step} className="relative">
                    <button
                      onClick={() => onStepSelect(step)}
                      className={`relative w-6 h-6 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 ease-in-out
                        ${isActive ? 'bg-purple-500 ring-2 ring-purple-300 scale-125' : 'bg-slate-400 hover:bg-purple-400'}
                        flex items-center justify-center
                      `}
                      aria-label={getStepTooltip(step)}
                      aria-current={isActive ? "step" : undefined}
                      title={getStepTooltip(step)}
                    >
                      {isActive && <span className="absolute w-2 h-2 bg-white rounded-full"></span>}
                    </button>
                    <div className="absolute top-full mt-1 flex space-x-0.5 justify-center w-full">
                      {timelineEvents
                        .filter(event => event.step === step && event.targetId)
                        .map(event => {
                          const hotspot = hotspots.find(h => h.id === event.targetId);
                          return hotspot ? (
                            <div
                              key={`${event.id}-${hotspot.id}-mobile`}
                              className="w-1.5 h-1.5 rounded-full"
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

        {moduleState === 'learning' && onPrevStep && onNextStep && totalSteps !== undefined && currentStepIndex !== undefined && (
          <div className="flex items-center justify-between mt-2 px-3">
            <button
              onClick={onPrevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed"
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
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full" aria-label="Module Timeline">
      <div className="px-4 py-2">
        <div className="relative w-full h-8 flex items-center">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-600 rounded-full transform -translate-y-1/2" />
          <div className="relative w-full flex items-center justify-between">
            {uniqueSortedSteps.map((step, index) => {
              const isActive = step === currentStep;
              return (
                <div key={step} className="relative">
                  <button
                    onClick={(event) => handleStepClick(step, event)}
                    className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 ease-in-out
                      ${isActive ? 'bg-purple-500 ring-2 ring-purple-300 scale-125' : 'bg-slate-400 hover:bg-purple-400'}
                      flex items-center justify-center
                    `}
                    aria-label={`${getStepTooltip(step)}${showPreviews ? '. Double-click for preview' : ''}`}
                    aria-current={isActive ? "step" : undefined}
                    title={`${getStepTooltip(step)}${showPreviews ? '. Double-click for preview' : ''}`}
                  >
                     {isActive && <span className="absolute w-2 h-2 bg-white rounded-full"></span>}
                  </button>
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
      {activePreview && showPreviews && !isMobile && (
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
