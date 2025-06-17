import React, { useState, useCallback, useEffect, useRef } from 'react';
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

const COLOR_OPTIONS = [
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Teal', value: 'bg-teal-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
  { name: 'Slate', value: 'bg-slate-500' },
  { name: 'Gray', value: 'bg-gray-500' },
];

const SIZE_OPTIONS = [
  { label: 'Small', value: 'small', icon: '🔸' },
  { label: 'Medium', value: 'medium', icon: '🔹' },
  { label: 'Large', value: 'large', icon: '🔶' },
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
  
  // Auto-save functionality
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const debouncedAutoSave = useCallback((updates: Partial<HotspotData>) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (!selectedHotspot) return;
      onUpdateHotspot({ ...selectedHotspot, ...updates });
    }, 500); // Auto-save after 500ms of no changes
  }, [selectedHotspot, onUpdateHotspot]);

  const handleHotspotUpdate = useCallback((field: keyof HotspotData, value: any) => {
    if (!selectedHotspot) return;
    // Immediate update for UI responsiveness
    const updates = { [field]: value };
    // Use debounced save for persistence
    debouncedAutoSave(updates);
  }, [selectedHotspot, debouncedAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const getEventIcon = (type: InteractionType): string => {
    switch (type) {
      case InteractionType.SHOW_HOTSPOT: return '👁️';
      case InteractionType.HIDE_HOTSPOT: return '🙈';
      case InteractionType.SHOW_INFO: return 'ℹ️';
      case InteractionType.HIDE_INFO: return '❌';
      case InteractionType.PAN_ZOOM: return '🔍';
      case InteractionType.RESET_VIEW: return '🏠';
      case InteractionType.PULSE_HOTSPOT: return '💓';
      case InteractionType.SHOW_MESSAGE: return '💬';
      default: return '⚡';
    }
  };

  const handleAddEvent = () => {
    if (!selectedHotspot) return;
    
    const newEvent: TimelineEventData = {
      id: `event_${Date.now()}`,
      step: currentStep + 1,
      type: InteractionType.SHOW_HOTSPOT,
      targetId: selectedHotspot.id,
      name: `Show ${selectedHotspot.title}`,
      duration: 3000,
      content: '',
      isUserTriggered: false,
    };
    
    onAddEvent(newEvent);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Delete this event?')) {
      onDeleteEvent(eventId);
    }
  };

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
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Compact Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedHotspot.title}</h3>
                <p className="text-blue-100 text-sm">Customize appearance and timeline events</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Compact Tabs */}
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="flex" aria-label="Tabs">
              {[
                { id: 'appearance', name: 'Style', icon: '🎨' },
                { id: 'events', name: 'Events', icon: '⚡' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Compact Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                {/* Size - Compact Grid */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Size</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {SIZE_OPTIONS.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => debouncedAutoSave({ size: size.value })}
                        className={`p-3 rounded-lg border-2 transition-all text-sm ${
                          selectedHotspot.size === size.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{size.icon}</div>
                          <div className="font-medium">{size.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color - Compact Grid */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => debouncedAutoSave({ color: color.value })}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${color.value} ${
                          selectedHotspot.color === color.value
                            ? 'border-gray-800 dark:border-white scale-110'
                            : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-4">
                {/* Events List - Compact */}
                {relatedEvents.length > 0 ? (
                  <div className="space-y-2">
                    {relatedEvents.sort((a, b) => a.step - b.step).map((event) => (
                      <div key={event.id} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getEventIcon(event.type)}</span>
                            <div>
                              <div className="font-medium text-sm">{event.name}</div>
                              <div className="text-xs text-gray-500">Step {event.step}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">⚡</div>
                    <p>No timeline events yet</p>
                  </div>
                )}

                {/* Add Event Button */}
                <button
                  onClick={handleAddEvent}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  + Add Timeline Event
                </button>
              </div>
            )}
          </div>

          {/* Compact Footer */}
          <div className="bg-gray-50 dark:bg-slate-800 px-6 py-3 flex justify-between items-center">
            <span className="text-xs text-gray-500">Changes save automatically</span>
            <button
              onClick={() => onDeleteHotspot(selectedHotspot.id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Delete Hotspot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotspotEditorModal;