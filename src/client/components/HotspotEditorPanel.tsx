import React, { useState, useMemo } from 'react';
import { HotspotData, TimelineEventData } from '../../shared/types';
import HotspotEditModal from './HotspotEditModal';
import EnhancedTimelineEventModal from './EnhancedTimelineEventModal';
import { PencilIcon } from './icons/PencilIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface HotspotEditorPanelProps {
  hotspot: HotspotData;
  timelineEvents: TimelineEventData[];
  allHotspots: HotspotData[];
  onUpdateHotspot: (hotspot: HotspotData) => void;
  onRemoveHotspot: (hotspotId: string) => void;
  onAddTimelineEvent: (event: TimelineEventData) => void;
  onEditTimelineEvent: (eventId: string) => void;
  onRemoveTimelineEvent: (eventId: string) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  activeTab: 'properties' | 'timeline'; // New prop
}

const HotspotEditorPanel: React.FC<HotspotEditorPanelProps> = ({
  hotspot,
  timelineEvents,
  allHotspots,
  onUpdateHotspot,
  onRemoveHotspot,
  onAddTimelineEvent,
  onEditTimelineEvent,
  onRemoveTimelineEvent,
  currentStep,
  onStepChange,
  activeTab
}) => {
  const [showHotspotEditModal, setShowHotspotEditModal] = useState(false);
  const [showTimelineEventModal, setShowTimelineEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEventData | null>(null);

  // Get events related to this hotspot
  const relatedEvents = useMemo(() =>
    timelineEvents.filter(event => event.targetId === hotspot.id),
    [timelineEvents, hotspot.id]
  );

  const handleEditEvent = (eventId: string) => {
    const event = timelineEvents.find(e => e.id === eventId);
    if (event) {
      setEditingEvent(event);
      setShowTimelineEventModal(true);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowTimelineEventModal(true);
  };

  const handleSaveEvent = (eventData: TimelineEventData) => {
    // Ensure the event targets this hotspot
    const updatedEvent = { ...eventData, targetId: hotspot.id };
    onAddTimelineEvent(updatedEvent);
    setShowTimelineEventModal(false);
    setEditingEvent(null);
  };

  return (
    <div className="space-y-6">
      {activeTab === 'properties' && (
        <>
          {/* Hotspot Header */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full ${hotspot.color || 'bg-gray-500'}`}></div>
                <div>
                  <h3 className="font-semibold text-slate-100">{hotspot.title}</h3>
                  <p className="text-xs text-slate-400">Position: {hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowHotspotEditModal(true)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  title="Edit Hotspot Properties"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemoveHotspot(hotspot.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  title="Delete Hotspot"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-300">{hotspot.description}</p>
          </div>
        </>
      )}

      {activeTab === 'timeline' && (
        <>
          {/* Timeline Events Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-200">Timeline Events</h4>
              <button
                onClick={handleAddEvent}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-1 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            </div>

            {relatedEvents.length === 0 ? (
              <div className="text-center py-6 text-slate-400 bg-slate-700/30 rounded-lg border-2 border-dashed border-slate-600">
                <p className="text-sm">No timeline events for this hotspot</p>
                <p className="text-xs mt-1">Click "Add Event" to create interactions</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {relatedEvents
                  .sort((a, b) => a.step - b.step)
                  .map(event => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        currentStep === event.step
                          ? 'bg-purple-600/20 border-purple-500'
                          : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                      }`}
                      onClick={() => onStepChange(event.step)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-slate-600 text-slate-200 px-2 py-1 rounded">
                              Step {event.step}
                            </span>
                            <span className="text-sm font-medium text-slate-200">{event.name}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{event.type.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event.id);
                            }}
                            className="p-1 bg-blue-500/30 hover:bg-blue-500 text-white rounded transition-colors"
                            title="Edit Event"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveTimelineEvent(event.id);
                            }}
                            className="p-1 bg-red-500/30 hover:bg-red-500 text-white rounded transition-colors"
                            title="Delete Event"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h5 className="font-medium text-slate-200 mb-3">Quick Actions</h5>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  // Create a simple show event
                  const newEvent: TimelineEventData = {
                    id: `show_${hotspot.id}_${Date.now()}`,
                    name: `Show ${hotspot.title}`,
                    step: (relatedEvents.length > 0 ? Math.max(...relatedEvents.map(e => e.step)) : 0) + 1,
                    type: 'SHOW_HOTSPOT' as any,
                    targetId: hotspot.id
                  };
                  onAddTimelineEvent(newEvent);
                }}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-300 text-xs p-2 rounded border border-green-600/30 transition-colors"
              >
                Quick Show
              </button>
              <button
                onClick={() => {
                  // Create a simple pulse event
                  const newEvent: TimelineEventData = {
                    id: `pulse_${hotspot.id}_${Date.now()}`,
                    name: `Pulse ${hotspot.title}`,
                    step: (relatedEvents.length > 0 ? Math.max(...relatedEvents.map(e => e.step)) : 0) + 1,
                    type: 'PULSE_HOTSPOT' as any,
                    targetId: hotspot.id,
                    duration: 2000
                  };
                  onAddTimelineEvent(newEvent);
                }}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs p-2 rounded border border-blue-600/30 transition-colors"
              >
                Quick Pulse
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <HotspotEditModal
        isOpen={showHotspotEditModal}
        onClose={() => setShowHotspotEditModal(false)}
        onSave={(updatedHotspot) => {
          onUpdateHotspot(updatedHotspot);
          setShowHotspotEditModal(false);
        }}
        hotspot={hotspot}
      />

      <EnhancedTimelineEventModal
        isOpen={showTimelineEventModal}
        onClose={() => {
          setShowTimelineEventModal(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        event={editingEvent}
        hotspots={allHotspots}
        isTimedMode={false} /* Assuming this is appropriate, adjust if necessary */
      />
    </div>
  );
};

export default HotspotEditorPanel;
