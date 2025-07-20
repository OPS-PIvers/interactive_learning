import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TimelineEventData, HotspotData } from '../../shared/types';
import { triggerHapticFeedback } from '../utils/hapticUtils';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
interface MobileTimelineProps {
  uniqueSortedSteps: number[];
  currentStep: number;
  onStepSelect: (step: number) => void;
  isEditing: boolean;
  timelineEvents: TimelineEventData[];
  setTimelineEvents: (events: TimelineEventData[]) => void;
  hotspots: HotspotData[];
  moduleState?: 'idle' | 'learning';
  onPrevStep?: () => void;
  onNextStep?: () => void;
  currentStepIndex?: number;
  totalSteps?: number;
  onAddStep: (step: number) => void;
  onDeleteStep: (step: number) => void;
  onUpdateStep: (oldStep: number, newStep: number) => void;
  onMoveStep: (dragIndex: number, hoverIndex: number) => void;
}
const MobileTimeline: React.FC<MobileTimelineProps> = ({
  uniqueSortedSteps,
  currentStep,
  onStepSelect,
  isEditing,
  timelineEvents,
  setTimelineEvents,
  hotspots,
  moduleState,
  onPrevStep,
  onNextStep,
  currentStepIndex,
  totalSteps,
  onAddStep,
  onDeleteStep,
  onUpdateStep,
  onMoveStep,
}) => {
  const [isEventPreviewCollapsed, setIsEventPreviewCollapsed] = useState<boolean>(true);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;
  const VERTICAL_SWIPE_THRESHOLD = 30;
  const prevCurrentStepIndexRef = useRef<number | undefined>(currentStepIndex);
  useEffect(() => {
    if (typeof prevCurrentStepIndexRef.current !== 'undefined' && prevCurrentStepIndexRef.current !== currentStepIndex) {
      triggerHapticFeedback('milestone');
    }
    prevCurrentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);
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
  const currentEvent = timelineEvents.find(event => event.step === currentStep && event.name);
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      <div
        className="w-full bg-slate-800 py-2 border-t border-slate-700"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
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
      <div className="mobile-timeline-container px-3">
        <div
          className="mobile-timeline-scroll"
          style={{
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '2px',
            position: 'relative',
          }}
        >
          <div
            className="absolute top-1/2 left-0 h-1 bg-slate-600 rounded-full transform -translate-y-1/2"
            style={{
              width: `${Math.max(uniqueSortedSteps.length * 68, window.innerWidth - 48)}px`,
              minWidth: '100%'
            }}
          />
          {uniqueSortedSteps.map((step, index) => {
            const isActive = step === currentStep;
            const MOBILE_STEP_WIDTH = 60;
            const MOBILE_STEP_SPACING = 8;

            return (
              <div
                key={step}
                className="mobile-timeline-step"
                style={{
                  minWidth: `${MOBILE_STEP_WIDTH}px`,
                  width: `${MOBILE_STEP_WIDTH}px`,
                  height: '48px',
                  marginRight: index < uniqueSortedSteps.length - 1 ? `${MOBILE_STEP_SPACING}px` : '0',
                  flexShrink: 0,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <button
                  onClick={() => onStepSelect(step)}
                  className={`relative w-7 h-7 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 ease-in-out z-10
                    ${isActive ? 'bg-purple-500 ring-2 ring-purple-300 scale-125' : 'bg-slate-400 hover:bg-purple-400'}
                    flex items-center justify-center shadow-lg
                  `}
                  aria-label={getStepTooltip(step)}
                  aria-current={isActive ? "step" : undefined}
                  title={getStepTooltip(step)}
                >
                  {isActive && <span className="absolute w-2.5 h-2.5 bg-white rounded-full"></span>}
                </button>
                <div className="absolute top-full mt-1 flex space-x-0.5 justify-center w-full">
                  {timelineEvents
                    .filter(event => event.step === step && event.targetId)
                    .slice(0, 4)
                    .map(event => {
                      const hotspot = hotspots.find(h => h.id === event.targetId);
                      return hotspot ? (
                        <div
                          key={`${event.id}-${hotspot.id}-mobile`}
                          className="w-2 h-2 rounded-full border border-white/20"
                          style={{ backgroundColor: hotspot.color || '#64748b' }}
                          title={`Hotspot: ${hotspot.title}`}
                        />
                      ) : null;
                    })}
                  {timelineEvents.filter(event => event.step === step && event.targetId).length > 4 && (
                    <div
                      className="w-2 h-2 rounded-full bg-slate-500 border border-white/20 flex items-center justify-center"
                      title={`+${timelineEvents.filter(event => event.step === step && event.targetId).length - 4} more hotspots`}
                    >
                      <span className="text-xs text-white leading-none">•</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {moduleState === 'learning' && onPrevStep && onNextStep && totalSteps !== undefined && currentStepIndex !== undefined && (
        <div className="flex items-center justify-between mt-3 px-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
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
  </div>
  );
};
export default MobileTimeline;
