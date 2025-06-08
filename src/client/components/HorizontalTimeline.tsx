import React from 'react';
import { TimelineEventData, HotspotData } from '../types';

interface HorizontalTimelineProps {
  uniqueSortedSteps: number[];
  currentStep: number;
  onStepSelect: (step: number) => void;
  isEditing: boolean;
  timelineEvents: TimelineEventData[];
  hotspots: HotspotData[];
}

const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  uniqueSortedSteps,
  currentStep,
  onStepSelect,
  isEditing,
  timelineEvents,
  hotspots,
}) => {
  if (uniqueSortedSteps.length === 0) {
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
    }).slice(0, 3); // Show first 3 events for brevity

    let tooltipText = `Step ${step}: ${eventSummaries.join(' | ')}`;
    if (eventsAtStep.length > 3) tooltipText += '...';
    return tooltipText;
  };

  return (
    <div className="w-full px-4 py-2" aria-label="Module Timeline">
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
                onClick={() => onStepSelect(step)}
                className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 ease-in-out
                  ${isActive ? 'bg-purple-500 ring-2 ring-purple-300 scale-125' : 'bg-slate-400 hover:bg-purple-400'}
                  flex items-center justify-center
                `}
                aria-label={getStepTooltip(step)}
                aria-current={isActive ? "step" : undefined}
                title={getStepTooltip(step)}
              >
                {/* Optional: Inner dot or number if needed, for now just color indicates active */}
                 {isActive && <span className="absolute w-2 h-2 bg-white rounded-full"></span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HorizontalTimeline;
