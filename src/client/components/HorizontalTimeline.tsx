import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList } from 'react-window';
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
  setTimelineEvents: (events: TimelineEventData[]) => void; // Added for templates
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

const ITEM_WIDTH = 48; // Example: 40px dot + 8px margin/padding

interface TimelineStepData {
  uniqueSortedSteps: number[];
  currentStep: number;
  onStepSelect: (step: number) => void;
  timelineEvents: TimelineEventData[];
  hotspots: HotspotData[];
  handleStepClick: (step: number, event: React.MouseEvent) => void;
  getStepTooltip: (step: number) => string;
  showPreviews: boolean;
}

const TimelineStep = ({ index, style, data }: { index: number, style: React.CSSProperties, data: TimelineStepData }) => {
  const { uniqueSortedSteps, currentStep, timelineEvents, hotspots, handleStepClick, getStepTooltip, showPreviews } = data;
  const step = uniqueSortedSteps[index];
  const isActive = step === currentStep;
  const isCompleted = uniqueSortedSteps.findIndex(s => s === currentStep) > index;
  const stepEvents = timelineEvents.filter((event: TimelineEventData) => event.step === step && event.targetId);

  return (
    <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
       <div key={step} className="relative group">
                  <button
                    onClick={(event) => handleStepClick(step, event)}
                    className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-300 ease-out transform hover:scale-110
                      ${isActive 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 ring-2 ring-purple-300/50 scale-125 shadow-lg shadow-purple-500/25' 
                        : isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-md hover:shadow-lg'
                          : 'bg-slate-500 hover:bg-gradient-to-r hover:from-purple-400 hover:to-blue-400 shadow-sm hover:shadow-md'
                      }
                      flex items-center justify-center
                    `}
                    aria-label={`${getStepTooltip(step)}${showPreviews ? '. Double-click for preview' : ''}`}
                    aria-current={isActive ? "step" : undefined}
                    title={`${getStepTooltip(step)}${showPreviews ? '. Double-click for preview' : ''}`}
                  >
                     {isActive && <span className="absolute w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>}
                     {isCompleted && !isActive && (
                       <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                       </svg>
                     )}
                     {!isActive && !isCompleted && (
                       <span className="text-xs font-bold text-white">{index + 1}</span>
                     )}
                  </button>
                  
                  {/* Enhanced hotspot indicators for desktop */}
                  <div className="absolute top-full mt-2 flex space-x-1 justify-center w-full opacity-80 group-hover:opacity-100 transition-opacity">
                    {stepEvents.slice(0, 5).map((event: TimelineEventData) => {
                      const hotspot = hotspots.find((h: HotspotData) => h.id === event.targetId);
                      return hotspot ? (
                        <div
                          key={`${event.id}-${hotspot.id}`}
                          className="w-2 h-2 rounded-full border border-white/30 shadow-sm transition-transform duration-200 hover:scale-125"
                          style={{ 
                            backgroundColor: hotspot.color || '#64748b',
                            boxShadow: isActive ? `0 0 6px ${hotspot.color || '#64748b'}50` : undefined
                          }}
                          title={`Hotspot: ${hotspot.title}`}
                        />
                      ) : null;
                    })}
                    {stepEvents.length > 5 && (
                      <div
                        className="w-2 h-2 rounded-full bg-gradient-to-r from-slate-500 to-slate-400 border border-white/30 flex items-center justify-center"
                        title={`+${stepEvents.length - 5} more hotspots`}
                      >
                        <span className="text-xs text-white leading-none font-bold">+</span>
                      </div>
                    )}
                  </div>
                </div>
    </div>
  );
};

const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  uniqueSortedSteps,
  currentStep,
  onStepSelect,
  isEditing,
  timelineEvents,
  setTimelineEvents,
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
  const viewerTimelineRef = useRef<HTMLDivElement>(null);


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
        className="absolute z-50 bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-xl shadow-2xl shadow-black/20 p-4 min-w-[280px] max-w-sm"
        style={{
          left: `${position.x}px`,
          top: `${position.y - 10}px`,
          transform: 'translateY(-100%)'
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
            <h4 className="font-semibold text-slate-100 text-sm">Step {step}</h4>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors duration-200 p-1 rounded-md hover:bg-slate-700/50"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
          {eventsAtStep.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm">No events at this step</p>
            </div>
          ) : (
            eventsAtStep.map((event, index) => {
              const hotspot = event.targetId ? hotspots.find(h => h.id === event.targetId) : null;
              return (
                <div key={event.id} className="text-sm text-slate-200 p-3 bg-gradient-to-r from-slate-700/70 to-slate-600/70 rounded-lg border border-slate-600/30 backdrop-blur-sm">
                  <div className="font-medium text-white mb-1">{event.name}</div>
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">{event.type.replace(/_/g, ' ')}</div>
                  {hotspot && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full border border-white/30 shadow-sm" 
                        style={{ backgroundColor: hotspot.color || '#64748b' }}
                      ></div>
                      <span className="text-slate-300 text-xs font-medium">{hotspot.title}</span>
                    </div>
                  )}
                  {event.message && (
                    <div className="text-slate-400 text-xs leading-relaxed italic border-l-2 border-purple-500/30 pl-2">
                      "{event.message.substring(0, 80)}{event.message.length > 80 ? '...' : ''}"
                    </div>
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
      const viewportWidth = window.innerWidth;
      
      let x = rect.left - containerRect.left + rect.width / 2;
      // Adjust if the preview card would go off-screen
      if (x + 350 > viewportWidth) {
        x = viewportWidth - 360; // 350 for card width + 10 for padding
      }

      setPreviewPosition({
        x: x,
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
      <div className="flex items-center justify-center gap-4 py-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
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

  const itemData = React.useMemo(() => ({
    uniqueSortedSteps,
    currentStep,
    onStepSelect,
    timelineEvents,
    hotspots,
    handleStepClick,
    getStepTooltip,
    showPreviews
  }), [uniqueSortedSteps, currentStep, onStepSelect, timelineEvents, hotspots, handleStepClick, getStepTooltip, showPreviews]);

  if (isMobile) {
    const currentEvent = timelineEvents.find(event => event.step === currentStep && event.name);
    const progressPercentage = uniqueSortedSteps.length > 0 ? 
      (uniqueSortedSteps.findIndex(step => step === currentStep) / (uniqueSortedSteps.length - 1)) * 100 : 0;

    return (
      <div className="fixed left-0 right-0 z-20 bottom-0 sm:bottom-0" style={{ bottom: 'max(env(safe-area-inset-bottom), 56px)' }}>
        {/* Modern glassmorphism container with gradient accents */}
        <div
          className="w-full bg-slate-800/95 backdrop-blur-sm border-t border-slate-700/50"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Enhanced current event display */}
          {currentEvent && moduleState === 'learning' && (
            <div className="px-4 py-3 border-b border-slate-700/30">
              <button
                onClick={() => setIsEventPreviewCollapsed(!isEventPreviewCollapsed)}
                className="w-full text-left text-sm text-slate-200 hover:text-white flex justify-between items-center transition-colors duration-200"
              >
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                  <span className="font-medium">{currentEvent.name}</span>
                </span>
                <ChevronDownIcon className={`w-4 h-4 transform transition-transform duration-200 ${isEventPreviewCollapsed ? '' : 'rotate-180'}`} />
              </button>
              {!isEventPreviewCollapsed && (
                <div className="mt-3 p-3 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-lg border border-slate-600/30 backdrop-blur-sm">
                  <p className="text-sm text-slate-300 leading-relaxed">{currentEvent.message || "No additional details for this event."}</p>
                </div>
              )}
            </div>
          )}
          {/* Enhanced timeline with modern progress bar */}
          <div className="px-4 py-3">
            {/* Overall progress indicator */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-slate-400">Progress</span>
                <span className="text-xs font-medium text-slate-300">
                  {uniqueSortedSteps.findIndex(step => step === currentStep) + 1} / {uniqueSortedSteps.length}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Modern timeline steps */}
            <div
              className="mobile-timeline-scroll"
              style={{
                display: 'flex',
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: '4px',
                position: 'relative',
                gap: '12px'
              }}
            >
              {/* Gradient timeline track */}
              <div
                className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-transparent via-slate-600 to-transparent rounded-full transform -translate-y-1/2"
                style={{
                  width: `${Math.max(uniqueSortedSteps.length * 72, window.innerWidth - 32)}px`,
                  minWidth: '100%'
                }}
              />
              {uniqueSortedSteps.map((step, index) => {
                const isActive = step === currentStep;
                const isCompleted = uniqueSortedSteps.findIndex(s => s === currentStep) > index;
                const stepEvents = timelineEvents.filter(event => event.step === step && event.targetId);

                return (
                  <div
                    key={step}
                    className="flex-shrink-0 flex flex-col items-center justify-center"
                    style={{
                      minWidth: '60px',
                      width: '60px',
                      height: '56px',
                      position: 'relative'
                    }}
                  >
                    {/* Enhanced step button */}
                    <button
                      onClick={() => onStepSelect(step)}
                      className={`relative w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-300 ease-out z-10 ${
                        isActive 
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 ring-2 ring-purple-300/50 scale-125 shadow-lg shadow-purple-500/25' 
                          : isCompleted
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-md'
                            : 'bg-slate-500 hover:bg-gradient-to-r hover:from-purple-400 hover:to-blue-400 shadow-sm'
                      } flex items-center justify-center`}
                      aria-label={getStepTooltip(step)}
                      aria-current={isActive ? "step" : undefined}
                      title={getStepTooltip(step)}
                    >
                      {isActive && (
                        <span className="absolute w-3 h-3 bg-white rounded-full animate-pulse"></span>
                      )}
                      {isCompleted && !isActive && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {!isActive && !isCompleted && (
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      )}
                    </button>

                    {/* Enhanced hotspot indicators */}
                    <div className="absolute top-full mt-1.5 flex space-x-1 justify-center w-full">
                      {stepEvents.slice(0, 4).map(event => {
                        const hotspot = hotspots.find(h => h.id === event.targetId);
                        return hotspot ? (
                          <div
                            key={`${event.id}-${hotspot.id}-mobile`}
                            className="w-2 h-2 rounded-full border border-white/30 shadow-sm transition-transform duration-200 hover:scale-110"
                            style={{ 
                              backgroundColor: hotspot.color || '#64748b',
                              boxShadow: isActive ? `0 0 8px ${hotspot.color || '#64748b'}40` : undefined
                            }}
                            title={`Hotspot: ${hotspot.title}`}
                          />
                        ) : null;
                      })}
                      {stepEvents.length > 4 && (
                        <div
                          className="w-2 h-2 rounded-full bg-gradient-to-r from-slate-500 to-slate-400 border border-white/30 flex items-center justify-center"
                          title={`+${stepEvents.length - 4} more hotspots`}
                        >
                          <span className="text-xs text-white leading-none font-bold">+</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Enhanced navigation controls */}
          {moduleState === 'learning' && onPrevStep && onNextStep && totalSteps !== undefined && currentStepIndex !== undefined && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/30" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px) + 8px, 16px)' }}>
              <button
                onClick={onPrevStep}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white rounded-lg transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span className="font-medium">Previous</span>
              </button>
              
              <div className="text-center">
                <div className="text-xs font-medium text-slate-300">
                  Step {(currentStepIndex || 0) + 1} of {totalSteps}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {Math.round(progressPercentage)}% Complete
                </div>
              </div>
              
              <button
                onClick={onNextStep}
                disabled={currentStepIndex >= totalSteps - 1}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 text-white rounded-lg transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:cursor-not-allowed shadow-sm"
              >
                <span className="font-medium">Next</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
      </div>
    </div>
    );
  }

  return (
    <div className="w-full" aria-label="Module Timeline">
      {/* Enhanced desktop timeline container */}
      <div
        className="relative w-full overflow-x-auto flex items-center justify-center py-6 bg-slate-800/30 backdrop-blur-sm border-y border-slate-700/50"
        style={{ height: '80px' }}
        ref={viewerTimelineRef}
      >
        {/* Modern gradient timeline track */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent rounded-full transform -translate-y-1/2" />
        <FixedSizeList
          height={80}
          width={viewerTimelineRef.current?.offsetWidth || window.innerWidth}
          itemCount={uniqueSortedSteps.length}
          itemSize={ITEM_WIDTH}
          layout="horizontal"
          itemData={itemData}
          className="custom-scrollbar"
        >
          {TimelineStep}
        </FixedSizeList>
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
