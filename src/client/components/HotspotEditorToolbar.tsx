import React, { useState } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { PlusIcon } from './icons/PlusIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

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

  const handleDeleteHotspot = () => {
    if (confirm(`Delete "${selectedHotspot.title}" and all its events?`)) {
      onDeleteHotspot(selectedHotspot.id);
    }
  };

  const handleEditEvent = (event: TimelineEventData) => {
    onEditEvent(event);
  };

  const handleDeleteEvent = (eventId: string) => {
    const event = relatedEvents.find(e => e.id === eventId);
    if (event && confirm(`Delete event "${event.name}"?`)) {
      onDeleteEvent(eventId);
    }
  };

  const handleAddEvent = () => {
    const eventName = prompt("Enter event name:", `Event for ${selectedHotspot.title}`);
    if (!eventName) return;

    const maxStep = allTimelineEvents.length > 0 ? Math.max(...allTimelineEvents.map(e => e.step)) : 0;
    
    const newEvent: TimelineEventData = {
      id: `te_show_${selectedHotspot.id}_${Date.now()}`,
      step: maxStep + 1,
      name: eventName,
      type: InteractionType.SHOW_HOTSPOT,
      targetId: selectedHotspot.id
    };

    onAddEvent(newEvent);
  };

  const renderHeader = () => (
    <div className="p-4 border-b border-slate-600">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-4 h-4 rounded-full ${selectedHotspot.color || 'bg-gray-500'}`} />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-100">{selectedHotspot.title}</h3>
          <p className="text-xs text-slate-400">
            Position: {selectedHotspot.x.toFixed(1)}%, {selectedHotspot.y.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAddEvent}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Add Event
        </button>
        <button
          onClick={() => onEditHotspot(selectedHotspot)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
          title="Edit Properties"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleDeleteHotspot}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
          title="Delete Hotspot"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="flex border-b border-slate-600">
      {[
        { id: 'properties', label: 'Properties', icon: '⚙️' },
        { id: 'events', label: 'Events', icon: '📅', badge: relatedEvents.length }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex-1 px-4 py-3 text-sm font-medium tab-transition flex items-center justify-center gap-2 ${
            activeTab === tab.id
              ? 'bg-purple-600 text-white border-b-2 border-purple-400'
              : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700'
          }`}
        >
          <span>{tab.icon}</span>
          {tab.label}
          {tab.badge && (
            <span className="bg-slate-600 text-xs px-2 py-1 rounded-full">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
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
          💡 Drag the hotspot on the image to reposition
        </p>
      </div>
    </div>
  );

  const renderEventsTab = () => (
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
            <span className="text-sm text-slate-400">{relatedEvents.length} events</span>
          </div>
          
          {relatedEvents.map(event => (
            <div
              key={event.id}
              className={`p-3 rounded-lg border transition-all ${
                currentStep === event.step
                  ? 'bg-purple-600/20 border-purple-500'
                  : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                      Step {event.step}
                    </span>
                    {currentStep === event.step && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <h5 className="font-medium text-slate-100 text-sm">{event.name}</h5>
                  <p className="text-xs text-slate-400">{event.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onJumpToStep(event.step)}
                    className="p-1 text-slate-400 hover:text-purple-400 transition-colors"
                    title="Jump to this step"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Edit event"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete event"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {renderHeader()}
      {renderTabs()}
      <div className="flex-1 overflow-y-auto toolbar-scroll">
        {activeTab === 'properties' ? renderPropertiesTab() : renderEventsTab()}
      </div>
    </div>
  );
};

export default HotspotEditorToolbar;