import React, { useState, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FixedSizeList } from 'react-window';
import { TimelineEventData, HotspotData } from '../../../shared/types';
import MobileTimelineStep from './MobileTimelineStep';
import MobileStepManager from './MobileStepManager';
import TimelineTemplatesModal from './TimelineTemplatesModal';
import CopyStepsModal from './CopyStepsModal';
import TimelineAnalyticsModal from './TimelineAnalyticsModal';

interface MobileTimelineProps {
  uniqueSortedSteps: number[];
  currentStep: number;
  onStepSelect: (step: number) => void;
  timelineEvents: TimelineEventData[];
  setTimelineEvents: (events: TimelineEventData[]) => void;
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
  setTimelineEvents,
  hotspots,
  onAddStep,
  onDeleteStep,
  onUpdateStep,
  onMoveStep,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedSteps, setSelectedSteps] = useState<number[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showCopyStepsModal, setShowCopyStepsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [templates, setTemplates] = useState<{ name: string; events: TimelineEventData[] }[]>([]);

  const validationErrors = useMemo(() => {
    const errors: { [key: number]: string } = {};
    const stepCounts: { [key: number]: number } = {};

    uniqueSortedSteps.forEach(step => {
      const eventsAtStep = timelineEvents.filter(e => e.step === step);
      if (eventsAtStep.length === 0) {
        errors[step] = 'This step has no events.';
      }
      stepCounts[step] = (stepCounts[step] || 0) + 1;
    });

    for (const step in stepCounts) {
      if (stepCounts[step] > 1) {
        errors[parseInt(step)] = 'Duplicate step number.';
      }
    }

    return errors;
  }, [timelineEvents, uniqueSortedSteps]);

  const toggleStepSelection = (step: number) => {
    setSelectedSteps(prev =>
      prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]
    );
  };

  const handleDeleteSelected = () => {
    selectedSteps.forEach(step => onDeleteStep(step));
    setSelectedSteps([]);
    setIsSelecting(false);
  };

  const handleSaveTemplate = (name: string) => {
    const newTemplate = { name, events: timelineEvents };
    setTemplates(prev => [...prev, newTemplate]);
    setShowTemplatesModal(false);
  };

  const handleApplyTemplate = (events: TimelineEventData[]) => {
    setTimelineEvents(events);
    setShowTemplatesModal(false);
  };

  const handleCopySteps = (steps: TimelineEventData[]) => {
    const newEvents = [...timelineEvents, ...steps];
    setTimelineEvents(newEvents);
  };

  const renderStep = (step: number, index: number) => {
    const eventsAtStep = timelineEvents.filter(e => e.step === step);
    const error = validationErrors[step];
    return (
      <MobileTimelineStep
        key={step}
        index={index}
        step={step}
        isActive={currentStep === step}
        events={eventsAtStep}
        isEditing={isEditing}
        isSelecting={isSelecting}
        isSelected={selectedSteps.includes(step)}
        error={error}
        onSelect={() => {
          if (isSelecting) {
            toggleStepSelection(step);
          } else {
            onStepSelect(step);
          }
        }}
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
          <div>
            <button
              onClick={() => setShowAnalyticsModal(true)}
              className="text-purple-400 hover:text-purple-300 mr-4"
            >
              Analytics
            </button>
            <button
              onClick={() => setShowCopyStepsModal(true)}
              className="text-purple-400 hover:text-purple-300 mr-4"
            >
              Copy Steps
            </button>
            <button
              onClick={() => setShowTemplatesModal(true)}
              className="text-purple-400 hover:text-purple-300 mr-4"
            >
              Templates
            </button>
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                if (isSelecting) {
                  setIsSelecting(false);
                  setSelectedSteps([]);
                }
              }}
              className="text-purple-400 hover:text-purple-300 mr-4"
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
            {isEditing && (
              <button
                onClick={() => {
                  setIsSelecting(!isSelecting);
                  setSelectedSteps([]);
                }}
                className={`text-purple-400 hover:text-purple-300 ${isSelecting ? 'font-bold' : ''}`}
              >
                {isSelecting ? 'Cancel' : 'Select'}
              </button>
            )}
          </div>
        </div>

        {isSelecting && (
          <div className="flex justify-end items-center mb-2">
            <button
              onClick={handleDeleteSelected}
              disabled={selectedSteps.length === 0}
              className="text-red-500 hover:text-red-400 disabled:opacity-50"
            >
              Delete Selected ({selectedSteps.length})
            </button>
          </div>
        )}

        <div className="p-2 bg-slate-900 rounded">
          <FixedSizeList
            height={120}
            itemCount={uniqueSortedSteps.length}
            itemSize={112}
            layout="horizontal"
            width={window.innerWidth - 32}
            itemData={{
              steps: uniqueSortedSteps,
              renderStep: renderStep,
            }}
          >
            {({ index, style, data }) => (
              <div style={style}>
                {data.renderStep(data.steps[index], index)}
              </div>
            )}
          </FixedSizeList>
          {isEditing && !isSelecting && <MobileStepManager onAddStep={onAddStep} />}
        </div>
      </div>
      {showTemplatesModal && (
        <TimelineTemplatesModal
          onClose={() => setShowTemplatesModal(false)}
          onSaveTemplate={handleSaveTemplate}
          onApplyTemplate={handleApplyTemplate}
          templates={templates}
        />
      )}
      {showCopyStepsModal && (
        <CopyStepsModal
          onClose={() => setShowCopyStepsModal(false)}
          onCopySteps={handleCopySteps}
        />
      )}
      {showAnalyticsModal && (
        <TimelineAnalyticsModal
          onClose={() => setShowAnalyticsModal(false)}
          timelineEvents={timelineEvents}
        />
      )}
    </DndProvider>
  );
};

export default MobileTimeline;
