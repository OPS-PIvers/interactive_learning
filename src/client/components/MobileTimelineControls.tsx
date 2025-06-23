import React from 'react';
import { TimelineEventData, HotspotData } from '../../shared/types';

interface MobileTimelineControlsProps {
  uniqueSortedSteps: number[];
  currentStep: number;
  onStepSelect: (step: number) => void;
  timelineEvents: TimelineEventData[]; // Kept for potential future use, e.g. event summaries
  hotspots: HotspotData[]; // Kept for potential future use
  // Props that would typically be here are now handled by HorizontalTimeline's mobile view:
  // - currentStepIndex (derived from currentStep and uniqueSortedSteps)
  // - totalSteps (derived from uniqueSortedSteps.length)
  // - onPrevStep
  // - onNextStep
}

const MobileTimelineControls: React.FC<MobileTimelineControlsProps> = ({
  uniqueSortedSteps,
  currentStep,
  onStepSelect,
  timelineEvents,
  hotspots,
}) => {
  // Most of the interactive elements (progress bar, step dots, prev/next buttons)
  // are now directly part of HorizontalTimeline.tsx when isMobile is true.
  // This component can be used for any additional mobile-specific timeline controls
  // that are not part of the main timeline strip.

  if (uniqueSortedSteps.length === 0) {
    return null;
  }

  // Example of a potential distinct control (e.g., jump to start/end)
  // This is just a placeholder to illustrate how it could be used.
  // The primary controls are in HorizontalTimeline's mobile view.

  const handleJumpToStart = () => {
    if (uniqueSortedSteps.length > 0) {
      onStepSelect(uniqueSortedSteps[0]);
    }
  };

  const handleJumpToEnd = () => {
    if (uniqueSortedSteps.length > 0) {
      onStepSelect(uniqueSortedSteps[uniqueSortedSteps.length - 1]);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 p-2 bg-slate-800 border-t border-slate-700">
      {/* Placeholder for any future distinct mobile controls */}
      {/* <button
        onClick={handleJumpToStart}
        className="text-xs text-slate-300 hover:text-white p-1 rounded"
      >
        First Step
      </button>
      <span className="text-xs text-slate-400">
        Step {uniqueSortedSteps.indexOf(currentStep) + 1} of {uniqueSortedSteps.length}
      </span>
      <button
        onClick={handleJumpToEnd}
        className="text-xs text-slate-300 hover:text-white p-1 rounded"
      >
        Last Step
      </button> */}
      <p className="text-xs text-slate-500">Mobile timeline controls (currently integrated in main timeline)</p>
    </div>
  );
};

export default MobileTimelineControls;
