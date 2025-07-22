import React, { useState } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import EditableEventCard from './EditableEventCard';
import EventTypeSelector from './EventTypeSelector';

interface HotspotEditorToolbarProps {
  selectedHotspot: HotspotData;
  relatedEvents: TimelineEventData[];
  allHotspots: HotspotData[];
  allTimelineEvents: TimelineEventData[];
  currentStep: number;
  onEditHotspot: (hotspot: HotspotData) => void;
  onDeleteHotspot: (hotspotId: string) => void;
  onAddEvent: (event: TimelineEventData) => void;
  onEditEvent: (event: TimelineEventData) => void;
  onDeleteEvent: (eventId: string) => void;
  onJumpToStep: (step: number) => void;
}

const HotspotEditorToolbar: React.FC<HotspotEditorToolbarProps> = ({
  selectedHotspot,
  relatedEvents,
  allHotspots,
  allTimelineEvents,
  currentStep,
  onEditHotspot,
  onDeleteHotspot,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  onJumpToStep,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'events'>('properties');
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventType, setNewEventType] = useState<InteractionType>(InteractionType.PULSE_HOTSPOT);

  const handleDeleteHotspot = () => {
    if (confirm(`Delete "${selectedHotspot.title}" and all its events?`)) {
      onDeleteHotspot(selectedHotspot.id);
    }
  };

  const handleUpdateEvent = (updatedEvent: TimelineEventData) => {
    onEditEvent(updatedEvent);
  };

  const handleDeleteEvent = (eventId: string) => {
    onDeleteEvent(eventId);
  };

  const handleAddEvent = () => {
    setShowAddEventModal(true);
  };

  const handleCreateEvent = () => {
    const eventName = prompt("Enter event name:", `${newEventType.replace(/_/g, ' ')} for ${selectedHotspot.title}`);
    if (!eventName) return;

    const maxStep = allTimelineEvents.length > 0 ? Math.max(...allTimelineEvents.map(e => e.step)) : 0;
    
    const newEvent: TimelineEventData = {
      id: `te_${newEventType.toLowerCase()}_${selectedHotspot.id}_${Date.now()}`,
      step: maxStep + 1,
      name: eventName,
      type: newEventType,
      targetId: selectedHotspot.id,
      // Set default values based on event type
      ...(newEventType === InteractionType.PAN_ZOOM_TO_HOTSPOT && { 
        zoomFactor: 2.0,
        targetX: selectedHotspot.x,
        targetY: selectedHotspot.y
      }),
      ...(newEventType === InteractionType.PAN_ZOOM && { 
        targetX: selectedHotspot.x,
        targetY: selectedHotspot.y
      }),
      ...(newEventType === InteractionType.SPOTLIGHT && { 
        spotlightX: selectedHotspot.x,
        spotlightY: selectedHotspot.y
      }),
      ...(newEventType === InteractionType.HIGHLIGHT_HOTSPOT && { highlightRadius: 60 }),
      ...(newEventType === InteractionType.PULSE_HOTSPOT && { duration: 2000 }),
      ...(newEventType === InteractionType.SHOW_MESSAGE && { message: '' }),
      ...(newEventType === InteractionType.SHOW_VIDEO && { videoUrl: '', autoplay: false }),
      ...(newEventType === InteractionType.SHOW_AUDIO_MODAL && { audioUrl: '', autoplay: false }),
      ...(newEventType === InteractionType.SHOW_YOUTUBE && { youtubeVideoId: '', autoplay: false })
    };

    onAddEvent(newEvent);
    setShowAddEventModal(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    setDraggedEventId(eventId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetEventId: string) => {
    e.preventDefault();
    
    if (!draggedEventId || draggedEventId === targetEventId) {
      setDraggedEventId(null);
      return;
    }

    const sortedEvents = [...relatedEvents].sort((a, b) => a.step - b.step);
    const draggedIndex = sortedEvents.findIndex(event => event.id === draggedEventId);
    const targetIndex = sortedEvents.findIndex(event => event.id === targetEventId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedEventId(null);
      return;
    }

    // Reorder the events
    const reorderedEvents = [...sortedEvents];
    const [draggedEvent] = reorderedEvents.splice(draggedIndex, 1);
    reorderedEvents.splice(targetIndex, 0, draggedEvent);

    // Update step numbers to reflect new order
    reorderedEvents.forEach((event, index) => {
      const updatedEvent = { ...event, step: index + 1 };
      onEditEvent(updatedEvent);
    });

    setDraggedEventId(null);
  };

  const renderHeader = () => (
    <div className="bg-slate-700/50 rounded-lg p-3 m-4"> {/* Hotspot Quick Info - Added m-4 for spacing similar to old p-4 */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${selectedHotspot.color || 'bg-gray-400'}`} /> {/* Added fallback color */}
        <h3 className="font-medium text-slate-100 flex-1">{selectedHotspot.title}</h3>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
        <span>Position: {selectedHotspot.x.toFixed(1)}%, {selectedHotspot.y.toFixed(1)}%</span>
        <span>{relatedEvents.length} events</span>
      </div>

      {/* Action Buttons - Horizontal Layout */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddEvent();
          }}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1">
          <PlusIcon className="w-4 h-4" />
          Add Event
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditHotspot(selectedHotspot);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
          title="Edit Properties" // Added title for clarity
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteHotspot();
          }}
          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
          title="Delete Hotspot" // Added title for clarity
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="flex bg-slate-700/30 rounded-lg p-1 mx-4 mb-4"> {/* Integrated Tabs - Added mx-4 for horizontal alignment with header */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActiveTab('properties');
        }}
        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
          activeTab === 'properties'
            ? 'bg-slate-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Properties
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActiveTab('events');
        }}
        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          activeTab === 'events'
            ? 'bg-slate-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Events
        {relatedEvents.length > 0 && (
          <span className="bg-purple-500 text-xs px-1.5 py-0.5 rounded-full">
            {relatedEvents.length}
          </span>
        )}
      </button>
    </div>
  );

  const renderPropertiesTab = () => (
    <div className="p-4 space-y-4">
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h4 className="font-medium text-slate-200 mb-3">Basic Information</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Title</label>
            <div className="text-slate-100">{selectedHotspot.title}</div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Description</label>
            <div className="text-slate-100 text-sm">{selectedHotspot.description}</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-700/50 rounded-lg p-4">
        <h4 className="font-medium text-slate-200 mb-3">Visual Properties</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Size</span>
            <span className="text-slate-100">{selectedHotspot.size || 'medium'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Color</span>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${selectedHotspot.color || 'bg-gray-500'}`} />
              <span className="text-slate-100 text-sm">{selectedHotspot.color || 'default'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-700/50 rounded-lg p-4">
        <h4 className="font-medium text-slate-200 mb-3">Position</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">X Position</label>
            <div className="text-slate-100">{selectedHotspot.x.toFixed(1)}%</div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Y Position</label>
            <div className="text-slate-100">{selectedHotspot.y.toFixed(1)}%</div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Drag the hotspot on the image to reposition
        </p>
      </div>

      <div className="bg-slate-700/50 rounded-lg p-4">
        <h4 className="font-medium text-slate-200 mb-3">Info Panel Display</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Show info panel</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          <div className="text-xs text-slate-400">
            <p>Control when the hotspot info panel appears by adding a "Show Message" event to the timeline</p>
            <p className="mt-1">The panel will display when that event is triggered instead of immediately on click</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEventsTab = () => {
    const sortedEvents = [...relatedEvents].sort((a, b) => a.step - b.step);

    return (
      <div className="p-4">
        {relatedEvents.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="font-medium">No Events Yet</p>
            <p className="text-sm">This hotspot has no timeline events</p>
            <button
              onClick={handleAddEvent}
              className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Add First Event
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-slate-200">Timeline Events</h4>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">{relatedEvents.length} events</span>
                <span className="text-xs text-slate-500">Drag to reorder</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {sortedEvents.map((event, index) => (
                <EditableEventCard
                  key={event.id}
                  index={index}
                  event={event}
                  isActive={currentStep === event.step}
                  onUpdate={handleUpdateEvent}
                  onDelete={handleDeleteEvent}
                  onJumpToStep={onJumpToStep}
                  moveCard={() => {}} // TODO: Implement proper drag and drop
                  onTogglePreview={() => {}} // TODO: Implement preview functionality
                  isPreviewing={false}
                  allHotspots={allHotspots}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {renderHeader()}
      {renderTabs()}
      <div className="flex-1 overflow-y-auto toolbar-scroll">
        {activeTab === 'properties' ? renderPropertiesTab() : renderEventsTab()}
      </div>

      {/* Add Event Modal - Moved here from renderHeader */}
      {showAddEventModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Add New Event</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
                <EventTypeSelector
                  value={newEventType}
                  onChange={setNewEventType}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateEvent}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create Event
              </button>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotspotEditorToolbar;