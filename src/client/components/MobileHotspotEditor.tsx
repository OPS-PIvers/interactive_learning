import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import debounce from 'lodash.debounce';
import { DndProvider } from 'react-dnd'; // Import DndProvider
import { HTML5Backend } from 'react-dnd-html5-backend'; // Import HTML5Backend
import { HotspotData, HotspotSize, TimelineEventData, InteractionType } from '../../shared/types';
import { interactionPresets } from '../../shared/InteractionPresets';
import EventTypeSelectorButtonGrid from './EventTypeSelectorButtonGrid';
import EditableEventCard from './EditableEventCard';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { triggerHapticFeedback } from '../utils/hapticUtils'; // Import haptic utility


interface MobileHotspotEditorProps {
  hotspot: HotspotData;
  allHotspots: HotspotData[]; // Needed for EditableEventCard (e.g. Quiz target)
  timelineEvents: TimelineEventData[]; // All timeline events for the project
  currentStep: number; // Current step in the main timeline
  onUpdate: (updates: Partial<HotspotData>) => void;
  onDelete?: () => void;
  onAddTimelineEvent: (event: TimelineEventData) => void;
  onUpdateTimelineEvent: (event: TimelineEventData) => void;
  onDeleteTimelineEvent: (eventId: string) => void;
  // For EditableEventCard's drag-and-drop (will be implemented in Step 3)
  // For now, provide a dummy function or make it optional in EditableEventCard if not used
  // moveCard: (dragIndex: number, hoverIndex: number) => void;
}

const DEBOUNCE_DELAY = 500;

// Constants moved from MobileEditorModal (or similar ones defined here)
const MOBILE_COLOR_OPTIONS = [
  { name: 'Purple', value: 'bg-purple-500', color: '#a855f7' },
  { name: 'Blue', value: 'bg-blue-500', color: '#3b82f6' },
  { name: 'Green', value: 'bg-green-500', color: '#22c55e' },
  { name: 'Red', value: 'bg-red-500', color: '#ef4444' },
  { name: 'Yellow', value: 'bg-yellow-500', color: '#eab308' },
  { name: 'Pink', value: 'bg-pink-500', color: '#ec4899' },
  { name: 'Indigo', value: 'bg-indigo-500', color: '#6366f1' },
  { name: 'Gray', value: 'bg-gray-500', color: '#6b7280' },
];

const HOTSPOT_SIZES = [
  { value: 'small', label: 'S', previewClass: 'w-4 h-4', displaySize: '32px' },
  { value: 'medium', label: 'M', previewClass: 'w-6 h-6', displaySize: '40px' },
  { value: 'large', label: 'L', previewClass: 'w-8 h-8', displaySize: '48px' },
];

// Simplified interaction types for mobile, can be expanded later
const INTERACTION_TYPE_OPTIONS = [
  { value: InteractionType.PULSE_HOTSPOT, label: 'Pulse Hotspot' },
  // { value: InteractionType.HIGHLIGHT_HOTSPOT, label: 'Highlight Area' }, // More complex, defer if needed
  // { value: InteractionType.PAN_ZOOM_TO_HOTSPOT, label: 'Zoom to Hotspot' }, // More complex, defer if needed
  { value: InteractionType.SHOW_TEXT, label: 'Show Text' }, // Assumes simple text, not rich text editor
  { value: InteractionType.PLAY_VIDEO, label: 'Play Video (URL)' }, // Assumes direct video URL
  { value: InteractionType.PLAY_AUDIO, label: 'Play Audio (URL)' }, // Assumes direct audio URL
];


type ActiveTab = 'basic' | 'style' | 'timeline';

const MobileHotspotEditor: React.FC<MobileHotspotEditorProps> = ({
  hotspot,
  timelineEvents,
  currentStep,
  onUpdate,
  onDelete,
  onAddTimelineEvent,
  onUpdateTimelineEvent,
  onDeleteTimelineEvent,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [internalHotspot, setInternalHotspot] = useState<HotspotData>(hotspot);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter events related to the current hotspot
  const hotspotEvents = useMemo(() => {
    return timelineEvents.filter(e => e.targetId === hotspot?.id).sort((a, b) => a.step - b.step);
  }, [timelineEvents, hotspot?.id]);


  const debouncedOnUpdate = useMemo(
    () =>
      debounce((updates: Partial<HotspotData>) => {
        onUpdate(updates);
      }, DEBOUNCE_DELAY),
    [onUpdate]
  );

  useEffect(() => {
    setInternalHotspot(hotspot);
    return () => {
      debouncedOnUpdate.cancel();
    };
  }, [hotspot, debouncedOnUpdate]);

  const handleChange = useCallback((field: keyof HotspotData, value: any) => {
    const newInternalHotspot = { ...internalHotspot, [field]: value };
    setInternalHotspot(newInternalHotspot);

    if (field === 'title' || field === 'description') {
      debouncedOnUpdate({ [field]: value });
    } else {
      debouncedOnUpdate.flush(); // Ensure pending text updates are saved
      onUpdate({ [field]: value });
    }
  }, [internalHotspot, onUpdate, debouncedOnUpdate]);

  useEffect(() => {
    return () => {
      debouncedOnUpdate.flush();
    };
  }, [debouncedOnUpdate]);


  const handleAddNewEvent = () => {
    // For simplicity, default to SHOW_TEXT or a common event type.
    // A proper type selector can be added in step 2.
    const newEvent: TimelineEventData = {
      id: `event_${Date.now()}_${hotspot.id}`,
      type: InteractionType.SHOW_TEXT, // Default, can be changed later
      name: `New Event for ${hotspot.title}`,
      targetId: hotspot.id,
      step: currentStep + 1, // Or derive from existing events
      duration: 2000, // Default duration
      message: "Default message", // Example property for SHOW_TEXT
    };
    onAddTimelineEvent(newEvent);
  };


  const renderBasicTab = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="hotspotTitle" className="block text-sm font-medium text-slate-300 mb-1">
          Title
        </label>
        <input
          type="text"
          id="hotspotTitle"
          value={internalHotspot.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Enter hotspot title"
        />
      </div>
      <div>
        <label htmlFor="hotspotDescription" className="block text-sm font-medium text-slate-300 mb-1">
          Description
        </label>
        <textarea
          id="hotspotDescription"
          value={internalHotspot.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Enter hotspot description"
        />
      </div>
      <div>
        <label htmlFor="hotspotMediaUrl" className="block text-sm font-medium text-slate-300 mb-1">
          Media URL (optional for image/video display)
        </label>
        <input
          type="url"
          id="hotspotLink"
          value={internalHotspot.link || ''}
          onChange={(e) => handleChange('link', e.target.value)}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
          placeholder="https://example.com/link"
        />
      </div>
    </div>
  );

  const renderStyleTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Display hotspot during event
        </label>
        <div
          onClick={() => handleChange('displayHotspotInEvent', !internalHotspot.displayHotspotInEvent)}
          className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors
                      ${internalHotspot.displayHotspotInEvent ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform
                        ${internalHotspot.displayHotspotInEvent ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Background Color
        </label>
        <div className="grid grid-cols-4 gap-3">
          {MOBILE_COLOR_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('backgroundColor', option.value)}
              className={`aspect-square rounded-lg border-2 flex items-center justify-center
                          ${internalHotspot.backgroundColor === option.value ? 'border-white ring-2 ring-purple-500' : 'border-transparent hover:border-slate-400'}`}
              style={{ backgroundColor: option.color }}
              aria-label={option.name}
            >
              {internalHotspot.backgroundColor === option.value && (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Size
        </label>
        <div className="flex space-x-3">
          {HOTSPOT_SIZES.map(sizeOpt => (
            <button
              key={sizeOpt.value}
              type="button"
              onClick={() => handleChange('size', sizeOpt.value as HotspotSize)}
               className={`flex-1 p-4 border-2 rounded-lg transition-all duration-200
                          ${internalHotspot.size === sizeOpt.value ? 'border-purple-500 bg-purple-500 bg-opacity-20' : 'border-slate-600 hover:border-slate-400'}`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`rounded-full ${internalHotspot.backgroundColor || 'bg-purple-500'}`}
                  style={{ width: sizeOpt.displaySize, height: sizeOpt.displaySize }}
                />
                <span className="text-sm text-slate-300">{sizeOpt.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimelineTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Associated Events</h3>
        <button
          onClick={handleAddNewEvent}
          className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
          Add Event
        </button>
      </div>
      {hotspotEvents.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-4">No timeline events associated with this hotspot yet.</p>
      ) : (
        <div className="space-y-3">
          {hotspotEvents.map((event) => (
            <div key={event.id} className="bg-slate-700 rounded-lg p-3 border border-slate-600">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white truncate pr-2" title={event.name}>
                  {event.name || `Event at step ${event.step}`}
                </span>
                <button
                  onClick={() => onDeleteTimelineEvent(event.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                  aria-label="Delete event"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="text-xs text-slate-400">
                Step {event.step} • Type: {INTERACTION_TYPE_OPTIONS.find(t => t.value === event.type)?.label || event.type.replace(/_/g, ' ')}
              </div>
              {/* Basic event editing (name, step, duration) can be added here later */}
              {/* For now, focusing on add/delete and structure */}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500 mt-2 text-center">
        Full event configuration and reordering will be enhanced in the next steps.
      </p>
    </div>
  );


  return (
    <div className="bg-slate-800 text-white h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
        {[
          { id: 'basic', label: 'Basic' },
          { id: 'style', label: 'Style' },
          { id: 'timeline', label: 'Events' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`flex-1 py-3 px-2 text-center font-medium text-sm transition-colors focus:outline-none
                        ${activeTab === tab.id ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'style' && renderStyleTab()}
        {activeTab === 'timeline' && renderTimelineTab()}
      </div>

      {/* Action Buttons */}
      {onDelete && (
        <div className="p-4 border-t border-slate-700 sticky bottom-0 bg-slate-800 z-10">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold transition-colors"
          >
            Delete Hotspot
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal (Simplified) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-lg p-6 max-w-sm w-full shadow-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Hotspot</h3>
            <p className="text-slate-300 mb-6">Are you sure you want to delete this hotspot and its associated events? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if(onDelete) onDelete();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileHotspotEditor;
