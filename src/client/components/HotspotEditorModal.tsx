import React, { useState, useCallback } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import DragHandle from './DragHandle';

interface HotspotEditorModalProps {
  isOpen: boolean;
  selectedHotspot: HotspotData | null;
  relatedEvents: TimelineEventData[];
  allTimelineEvents: TimelineEventData[];
  currentStep: number;
  onUpdateHotspot: (hotspot: HotspotData) => void;
  onDeleteHotspot: (hotspotId: string) => void;
  onAddEvent: (event: TimelineEventData) => void;
  onUpdateEvent: (event: TimelineEventData) => void;
  onDeleteEvent: (eventId: string) => void;
  onReorderEvents: (eventIds: string[]) => void;
  onJumpToStep: (step: number) => void;
  onClose: () => void;
}

interface ColorPreset {
  name: string;
  value: string;
  bgClass: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Red', value: '#ef4444', bgClass: 'bg-red-500' },
  { name: 'Orange', value: '#f97316', bgClass: 'bg-orange-500' },
  { name: 'Yellow', value: '#eab308', bgClass: 'bg-yellow-500' },
  { name: 'Green', value: '#22c55e', bgClass: 'bg-green-500' },
  { name: 'Blue', value: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: 'Indigo', value: '#6366f1', bgClass: 'bg-indigo-500' },
  { name: 'Purple', value: '#a855f7', bgClass: 'bg-purple-500' },
  { name: 'Pink', value: '#ec4899', bgClass: 'bg-pink-500' },
  { name: 'Teal', value: '#14b8a6', bgClass: 'bg-teal-500' },
  { name: 'Cyan', value: '#06b6d4', bgClass: 'bg-cyan-500' },
  { name: 'Slate', value: '#64748b', bgClass: 'bg-slate-500' },
  { name: 'Gray', value: '#6b7280', bgClass: 'bg-gray-500' },
];

const SIZE_OPTIONS = [
  { name: 'Small', value: 'small' },
  { name: 'Medium', value: 'medium' },
  { name: 'Large', value: 'large' },
];

const HotspotEditorModal: React.FC<HotspotEditorModalProps> = ({
  isOpen,
  selectedHotspot,
  relatedEvents,
  allTimelineEvents,
  currentStep,
  onUpdateHotspot,
  onDeleteHotspot,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onReorderEvents,
  onJumpToStep,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [editingEvent, setEditingEvent] = useState<TimelineEventData | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  const handleHotspotUpdate = useCallback((field: keyof HotspotData, value: any) => {
    if (!selectedHotspot) return;
    onUpdateHotspot({ ...selectedHotspot, [field]: value });
  }, [selectedHotspot, onUpdateHotspot]);

  const handleColorChange = useCallback((colorPreset: ColorPreset) => {
    handleHotspotUpdate('color', colorPreset.bgClass);
  }, [handleHotspotUpdate]);

  const getEventTypeName = (type: InteractionType): string => {
    switch (type) {
      case InteractionType.SHOW_HOTSPOT: return 'Show Hotspot';
      case InteractionType.HIDE_HOTSPOT: return 'Hide Hotspot';
      case InteractionType.SHOW_INFO: return 'Show Info';
      case InteractionType.HIDE_INFO: return 'Hide Info';
      case InteractionType.PAN_ZOOM: return 'Pan & Zoom';
      case InteractionType.RESET_VIEW: return 'Reset View';
      case InteractionType.PULSE_HOTSPOT: return 'Pulse Hotspot';
      case InteractionType.SHOW_MESSAGE: return 'Show Message';
      default: return type;
    }
  };

  const createNewEvent = () => {
    if (!selectedHotspot) return;
    
    const newEvent: TimelineEventData = {
      id: `event_${Date.now()}`,
      step: currentStep,
      type: InteractionType.SHOW_HOTSPOT,
      targetId: selectedHotspot.id,
      duration: 3000,
      content: '',
      isUserTriggered: false,
    };
    
    onAddEvent(newEvent);
    setEditingEvent(newEvent);
    setShowEventForm(true);
  };

  if (!isOpen || !selectedHotspot) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              {/* Hotspot Preview */}
              <div className="flex items-center gap-3">
                <div 
                  className={`w-6 h-6 rounded-full ${selectedHotspot.color || 'bg-blue-500'} shadow-sm`}
                />
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Edit Hotspot
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedHotspot.title || 'Untitled Hotspot'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Delete Button */}
              <button
                onClick={() => {
                  onDeleteHotspot(selectedHotspot.id);
                  onClose();
                }}
                className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete Hotspot"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'appearance', name: 'Appearance', icon: '🎨' },
                { id: 'content', name: 'Content', icon: '📝' },
                { id: 'events', name: 'Timeline Events', icon: '⏱️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Size */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Size</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {SIZE_OPTIONS.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => handleHotspotUpdate('size', size.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedHotspot.size === size.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                        >
                          <div className="text-sm font-medium">{size.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Color</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => handleColorChange(color)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                            selectedHotspot.color === color.bgClass
                              ? 'border-slate-900 dark:border-white scale-110' 
                              : 'border-slate-300 dark:border-slate-600 hover:border-slate-500'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Title</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <input
                      type="text"
                      value={selectedHotspot.title || ''}
                      onChange={(e) => handleHotspotUpdate('title', e.target.value)}
                      placeholder="Enter hotspot title..."
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Content</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <textarea
                      value={selectedHotspot.content || ''}
                      onChange={(e) => handleHotspotUpdate('content', e.target.value)}
                      placeholder="Enter hotspot content..."
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-6">
                {/* Add Event Button */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Timeline Events</h3>
                  <button
                    onClick={createNewEvent}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Event
                  </button>
                </div>

                {/* Events List */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  {relatedEvents.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <div className="text-2xl mb-2">📅</div>
                      <p>No timeline events for this hotspot</p>
                      <p className="text-sm">Click "Add Event" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {relatedEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
                        >
                          <DragHandle />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                Step {event.step}
                              </span>
                              <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded">
                                {getEventTypeName(event.type)}
                              </span>
                            </div>
                            {event.content && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {event.content}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingEvent(event);
                                setShowEventForm(true);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteEvent(event.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Event Editing Form */}
          {showEventForm && editingEvent && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Edit Event</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Event Type</label>
                    <select
                      value={editingEvent.type}
                      onChange={(e) => setEditingEvent({...editingEvent, type: e.target.value as InteractionType})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value={InteractionType.SHOW_HOTSPOT}>Show Hotspot</option>
                      <option value={InteractionType.HIDE_HOTSPOT}>Hide Hotspot</option>
                      <option value={InteractionType.SHOW_INFO}>Show Info</option>
                      <option value={InteractionType.HIDE_INFO}>Hide Info</option>
                      <option value={InteractionType.PAN_ZOOM}>Pan & Zoom</option>
                      <option value={InteractionType.RESET_VIEW}>Reset View</option>
                      <option value={InteractionType.PULSE_HOTSPOT}>Pulse Hotspot</option>
                      <option value={InteractionType.SHOW_MESSAGE}>Show Message</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Step</label>
                    <input
                      type="number"
                      min="1"
                      value={editingEvent.step}
                      onChange={(e) => setEditingEvent({...editingEvent, step: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  {(editingEvent.type === InteractionType.SHOW_MESSAGE || editingEvent.type === InteractionType.SHOW_INFO) && (
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Content</label>
                      <textarea
                        value={editingEvent.content || ''}
                        onChange={(e) => setEditingEvent({...editingEvent, content: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        rows={3}
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Duration (ms)</label>
                    <input
                      type="number"
                      min="100"
                      value={editingEvent.duration || 3000}
                      onChange={(e) => setEditingEvent({...editingEvent, duration: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => {
                      setShowEventForm(false);
                      setEditingEvent(null);
                    }}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onUpdateEvent(editingEvent);
                      setShowEventForm(false);
                      setEditingEvent(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Close
            </button>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Hotspot at ({selectedHotspot.x.toFixed(1)}%, {selectedHotspot.y.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HotspotEditorModal;