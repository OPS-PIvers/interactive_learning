import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TimelineEventData, HotspotData } from '../../../shared/types';
import MobileTimelineStep from './MobileTimelineStep';
import MobileStepManager from './MobileStepManager';

interface MobileTimelineProps {
  uniqueSortedSteps: number[];
  currentStep: number;
  onStepSelect: (step: number) => void;
  timelineEvents: TimelineEventData[];
  hotspots: HotspotData[];
  onAddStep: (step: number) => void;
  onDeleteStep: (step: number) => void;
  onUpdateStep: (oldStep: number, newStep: number) => void;
  onMoveStep: (dragIndex: number, hoverIndex: number) => void;
}

const MobileTimeline: React.FC<MobileTimelineProps> = ({
  uniqueSortedSteps,
  currentStep,
  onStepSelect,
  timelineEvents,
  hotspots,
  onAddStep,
  onDeleteStep,
  onUpdateStep,
  onMoveStep,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const renderStep = (step: number, index: number) => {
    const eventsAtStep = timelineEvents.filter(e => e.step === step);
    return (
      <MobileTimelineStep
        key={step}
        index={index}
        step={step}
        isActive={currentStep === step}
        events={eventsAtStep}
        isEditing={isEditing}
        onSelect={() => onStepSelect(step)}
        onDelete={() => onDeleteStep(step)}
        onUpdate={(newStep) => onUpdateStep(step, newStep)}
        onMove={onMoveStep}
      />
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full bg-slate-800 p-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-semibold">Timeline</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-purple-400 hover:text-purple-300"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>
        <div className="flex overflow-x-auto space-x-2 p-2 bg-slate-900 rounded">
          {uniqueSortedSteps.map((step, index) => renderStep(step, index))}
          {isEditing && <MobileStepManager onAddStep={onAddStep} />}
        </div>
      </div>
    </DndProvider>
  );
};

export default MobileTimeline;
