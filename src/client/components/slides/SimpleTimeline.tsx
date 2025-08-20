import React, { useState } from 'react';
import { ElementInteraction } from '../../../shared/slideTypes';

interface TimelineEvent {
  id: string;
  hotspotId: string;
  hotspotTitle: string;
  interaction: ElementInteraction;
  sequence: number;
}

interface SimpleTimelineProps {
  events: TimelineEvent[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onEventAdd: (hotspotId: string) => void;
  onEventRemove: (eventId: string) => void;
  onEventReorder: (eventId: string, newSequence: number) => void;
  className?: string;
}

/**
 * SimpleTimeline - Track sequence of interactions
 * 
 * Features:
 * - Linear timeline view
 * - Navigate between steps
 * - Reorder events
 * - Add/remove events
 */
export const SimpleTimeline: React.FC<SimpleTimelineProps> = ({
  events,
  currentStep,
  onStepChange,
  onEventAdd,
  onEventRemove,
  onEventReorder,
  className = ''
}) => {
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null);

  // Sort events by sequence
  const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);

  // Handle step navigation
  const handleStepClick = (step: number) => {
    onStepChange(step);
  };

  // Handle event drag start
  const handleDragStart = (eventId: string) => {
    setDraggedEvent(eventId);
  };

  // Handle event drop
  const handleDrop = (targetSequence: number) => {
    if (draggedEvent) {
      onEventReorder(draggedEvent, targetSequence);
      setDraggedEvent(null);
    }
  };

  // Get effect type display
  const getEffectDisplay = (interaction: ElementInteraction) => {
    const type = interaction.effect.type;
    const icons: Record<string, string> = {
      'spotlight': '🎯',
      'text': '📝',
      'video': '🎬',
      'audio': '🔊',
      'quiz': '❓',
      'pan_zoom': '🔍',
      'tooltip': '💬'
    };
    return icons[type] || '⚡';
  };

  return (
    <div className={`simple-timeline ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Timeline</h3>
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {sortedEvents.length || 1}
          </div>
        </div>

        {/* Timeline track */}
        <div className="relative">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">⏱️</div>
              <div className="text-sm">No timeline events</div>
              <div className="text-xs">Add interactions to hotspots to create timeline</div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Timeline steps */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {sortedEvents.map((event, index) => {
                  const isActive = index === currentStep;
                  const isPast = index < currentStep;
                  const isFuture = index > currentStep;

                  return (
                    <div key={event.id} className="flex items-center flex-shrink-0">
                      {/* Step indicator */}
                      <button
                        onClick={() => handleStepClick(index)}
                        className={`w-8 h-8 rounded-full border-2 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : isPast
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                        }`}
                        title={`Step ${index + 1}: ${event.hotspotTitle}`}
                      >
                        {index + 1}
                      </button>

                      {/* Connection line */}
                      {index < sortedEvents.length - 1 && (
                        <div
                          className={`w-8 h-0.5 ${
                            index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Event details */}
              <div className="space-y-2">
                {sortedEvents.map((event, index) => {
                  const isActive = index === currentStep;
                  const effectIcon = getEffectDisplay(event.interaction);

                  return (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(event.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {/* Sequence number */}
                          <div className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center ${
                            isActive
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>

                          {/* Event info */}
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${
                              isActive ? 'text-blue-700' : 'text-gray-900'
                            }`}>
                              {event.hotspotTitle}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <span>{effectIcon}</span>
                              <span className="capitalize">{event.interaction.effect.type}</span>
                              {event.interaction.effect.duration > 0 && (
                                <span>• {event.interaction.effect.duration}ms</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStepClick(index)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                            title="Jump to this step"
                          >
                            ▶️
                          </button>
                          <button
                            onClick={() => onEventRemove(event.id)}
                            className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
                            title="Remove from timeline"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timeline controls */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleStepClick(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  ← Previous
                </button>

                <div className="text-sm text-gray-500">
                  {currentStep + 1} / {sortedEvents.length}
                </div>

                <button
                  onClick={() => handleStepClick(Math.min(sortedEvents.length - 1, currentStep + 1))}
                  disabled={currentStep >= sortedEvents.length - 1}
                  className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600">
            <strong>💡 Timeline Tips:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Add interactions to hotspots to build timeline</li>
              <li>Drag events to reorder sequence</li>
              <li>Click step numbers to jump to specific points</li>
              <li>Timeline shows the order interactions will play</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTimeline;