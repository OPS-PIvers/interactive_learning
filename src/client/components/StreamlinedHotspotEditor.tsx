import React, { useState, useCallback } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import DragHandle from './DragHandle';

interface StreamlinedHotspotEditorProps {
  selectedHotspot: HotspotData;
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
  isMobile?: boolean;
}

// Color preset options
const COLOR_PRESETS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500'
];

const StreamlinedHotspotEditor: React.FC<StreamlinedHotspotEditorProps> = ({
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
  const [editingEvent, setEditingEvent] = useState<TimelineEventData | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<TimelineEventData | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [expandedSection, setExpandedSection] = useState<'appearance' | 'events'>('events');

  const toggleSection = (section: 'appearance' | 'events') => {
    setExpandedSection(prev => prev === section ? prev : section);
  };

  // Auto-save handlers
  const handleHotspotUpdate = useCallback((updates: Partial<HotspotData>) => {
    onUpdateHotspot({ ...selectedHotspot, ...updates });
  }, [selectedHotspot, onUpdateHotspot]);

  const handleEventSave = useCallback((eventData: TimelineEventData) => {
    if (editingEvent) {
      onUpdateEvent(eventData);
    } else {
      // New event - assign next available step
      const maxStep = Math.max(...allTimelineEvents.map(e => e.step), 0);
      onAddEvent({ ...eventData, step: maxStep + 1 });
    }
    setShowEventForm(false);
    setEditingEvent(null);
  }, [editingEvent, allTimelineEvents, onAddEvent, onUpdateEvent]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event: TimelineEventData) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleClearAllEvents = () => {
    if (confirm(`Remove all ${relatedEvents.length} events from this hotspot?`)) {
      relatedEvents.forEach(event => onDeleteEvent(event.id));
    }
  };

  const handleDeleteHotspot = () => {
    if (confirm(`Delete "${selectedHotspot.title}" and all its events?`)) {
      onDeleteHotspot(selectedHotspot.id);
    }
  };

  // Drag and drop for event reordering
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    setDraggedEventId(eventId);
    e.dataTransfer.effectAllowed = 'move';
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
    const draggedIndex = sortedEvents.findIndex(e => e.id === draggedEventId);
    const targetIndex = sortedEvents.findIndex(e => e.id === targetEventId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder array
    const reorderedEvents = [...sortedEvents];
    const [draggedEvent] = reorderedEvents.splice(draggedIndex, 1);
    reorderedEvents.splice(targetIndex, 0, draggedEvent);

    // Update step numbers and notify parent
    const updatedEvents = reorderedEvents.map((event, index) => ({
      ...event,
      step: index + 1
    }));
    
    updatedEvents.forEach(event => onUpdateEvent(event));
    setDraggedEventId(null);
  };

  const handleEventHover = (event: TimelineEventData, mouseEvent: React.MouseEvent) => {
    setHoveredEvent(event);
    const rect = mouseEvent.currentTarget.getBoundingClientRect();
    setHoverPosition({ x: rect.right + 10, y: rect.top });
  };

  const getEventIcon = (type: InteractionType) => {
    const icons: Record<InteractionType, string> = {
      [InteractionType.HIDE_HOTSPOT]: 'Hide',
      [InteractionType.PULSE_HOTSPOT]: 'Pulse',
      [InteractionType.SHOW_MESSAGE]: 'Text',
      [InteractionType.PAN_ZOOM_TO_HOTSPOT]: 'Zoom',
      [InteractionType.HIGHLIGHT_HOTSPOT]: 'Spotlight'
    };
    return icons[type] || 'Event';
  };

  const sortedEvents = relatedEvents.sort((a, b) => a.step - b.step);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-600">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-100">Edit Hotspot</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
            title="Close editor"
          >
            ×
          </button>
        </div>
      </div>

      {!showEventForm ? (
        // Main editing interface
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Hotspot Appearance */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('appearance')}
              className="w-full flex items-center justify-between text-sm font-semibold text-slate-300 uppercase tracking-wide hover:text-slate-200 transition-colors"
            >
              <span>Hotspot Appearance</span>
              <ChevronRightIcon 
                className={`w-4 h-4 transition-transform ${expandedSection === 'appearance' ? 'rotate-90' : ''}`}
              />
            </button>
            
            {expandedSection === 'appearance' && (
              <div className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Title</label>
              <input
                type="text"
                value={selectedHotspot.title}
                onChange={(e) => handleHotspotUpdate({ title: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Description</label>
              <textarea
                value={selectedHotspot.description}
                onChange={(e) => handleHotspotUpdate({ description: e.target.value })}
                rows={2}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Color and Size Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Color</label>
                <div className="relative">
                  <select
                    value={selectedHotspot.color || 'bg-blue-500'}
                    onChange={(e) => handleHotspotUpdate({ color: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  >
                    {COLOR_PRESETS.map(color => (
                      <option key={color} value={color}>
                        {color.replace('bg-', '').replace('-500', '')}
                      </option>
                    ))}
                  </select>
                  <div 
                    className={`absolute right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full ${selectedHotspot.color || 'bg-blue-500'}`}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Size</label>
                <select
                  value={selectedHotspot.size || 'medium'}
                  onChange={(e) => handleHotspotUpdate({ size: e.target.value as any })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>

                {/* Delete Hotspot */}
                <button
                  onClick={handleDeleteHotspot}
                  className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 hover:text-red-300 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  Delete Hotspot
                </button>
              </div>
            )}
          </div>

          {/* Events Management */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('events')}
              className="w-full flex items-center justify-between text-sm font-semibold text-slate-300 uppercase tracking-wide hover:text-slate-200 transition-colors"
            >
              <span>Events</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{relatedEvents.length} events</span>
                <ChevronRightIcon 
                  className={`w-4 h-4 transition-transform ${expandedSection === 'events' ? 'rotate-90' : ''}`}
                />
              </div>
            </button>
            
            {expandedSection === 'events' && (
              <div className="space-y-4">
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddEvent}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Event
                  </button>
                  {relatedEvents.length > 0 && (
                    <button
                      onClick={handleClearAllEvents}
                      className="bg-slate-600 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Events List */}
                {sortedEvents.length > 0 ? (
                  <div className="space-y-1">
                    {sortedEvents.map(event => (
                      <div
                        key={event.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, event.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, event.id)}
                        onMouseEnter={(e) => handleEventHover(event, e)}
                        onMouseLeave={() => setHoveredEvent(null)}
                        className={`flex items-center gap-2 p-2 rounded border transition-all cursor-move ${
                          currentStep === event.step
                            ? 'bg-purple-600/20 border-purple-500/50'
                            : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                        } ${draggedEventId === event.id ? 'opacity-50 scale-95' : ''}`}
                      >
                        <DragHandle isDragging={draggedEventId === event.id} className="text-slate-400" />
                        <span className="text-lg">{getEventIcon(event.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-200 truncate">{event.name}</div>
                          <div className="text-xs text-slate-400">
                            Step {event.step} • {event.type.replace(/_/g, ' ')}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                            title="Edit event"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent(event.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete event"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <p className="text-sm">No events yet</p>
                    <p className="text-xs mt-1">Click "Add Event" to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Event Editor Form (replaces the main content)
        <EventEditorForm
          event={editingEvent}
          hotspotId={selectedHotspot.id}
          onSave={handleEventSave}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          isMobile={isMobile} // Pass isMobile prop
        />
      )}

      {/* Hover Preview Tooltip */}
      {hoveredEvent && (
        <div
          className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-3 max-w-xs"
          style={{ left: hoverPosition.x, top: hoverPosition.y }}
        >
          <div className="text-sm font-medium text-slate-200">{hoveredEvent.name}</div>
          <div className="text-xs text-slate-400 mt-1">
            {hoveredEvent.type.replace(/_/g, ' ')} • Step {hoveredEvent.step}
          </div>
          {hoveredEvent.message && (
            <div className="text-xs text-slate-300 mt-2 italic">"{hoveredEvent.message}"</div>
          )}
          {hoveredEvent.duration && (
            <div className="text-xs text-slate-400 mt-1">Duration: {hoveredEvent.duration}ms</div>
          )}
          {hoveredEvent.zoomFactor && (
            <div className="text-xs text-slate-400 mt-1">Zoom: {hoveredEvent.zoomFactor}x</div>
          )}
        </div>
      )}
    </div>
  );
};

// Event Editor Form Component (inline)
interface EventEditorFormProps {
  event: TimelineEventData | null;
  hotspotId: string;
  onSave: (event: TimelineEventData) => void;
  onCancel: () => void;
  isMobile?: boolean;
}

const EventEditorForm: React.FC<EventEditorFormProps> = ({ event, hotspotId, onSave, onCancel, isMobile }) => {
  const [formData, setFormData] = useState<Partial<TimelineEventData>>(() => ({
    id: event?.id || `event_${Date.now()}`,
    name: event?.name || 'New Event',
    type: event?.type || InteractionType.PULSE_HOTSPOT,
    targetId: hotspotId,
    message: event?.message || '',
    duration: event?.duration || 2000,
    zoomFactor: event?.zoomFactor || 2.0,
    highlightRadius: event?.highlightRadius || 60,
    ...event
  }));

  const handleSave = () => {
    onSave(formData as TimelineEventData);
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case InteractionType.SHOW_MESSAGE:
        return (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Message</label>
            <textarea
              value={formData.message || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Enter message to display..."
            />
          </div>
        );
      
      case InteractionType.PULSE_HOTSPOT:
        return (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Duration (ms)</label>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={formData.duration || 2000}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full event-slider"
            />
            <div className="text-xs text-slate-400 mt-1">{formData.duration || 2000}ms</div>
          </div>
        );
      
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        return (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Zoom Factor</label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={formData.zoomFactor || 2.0}
              onChange={(e) => setFormData(prev => ({ ...prev, zoomFactor: parseFloat(e.target.value) }))}
              className="w-full event-slider"
            />
            <div className="text-xs text-slate-400 mt-1">{formData.zoomFactor || 2.0}x</div>
          </div>
        );
      
      case InteractionType.HIGHLIGHT_HOTSPOT:
        return (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Highlight Radius (px)</label>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              value={formData.highlightRadius || 60}
              onChange={(e) => setFormData(prev => ({ ...prev, highlightRadius: parseInt(e.target.value) }))}
              className="w-full event-slider"
            />
            <div className="text-xs text-slate-400 mt-1">{formData.highlightRadius || 60}px</div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-slate-100">
          {event ? 'Edit Event' : 'Add Event'}
        </h4>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-200 text-sm"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        {/* Event Name */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Event Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Event Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as InteractionType }))}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={InteractionType.HIDE_HOTSPOT}>Hide Hotspot</option>
            <option value={InteractionType.PULSE_HOTSPOT}>Pulse Hotspot</option>
            <option value={InteractionType.SHOW_MESSAGE}>Show Message</option>
            <option value={InteractionType.PAN_ZOOM_TO_HOTSPOT}>Pan & Zoom</option>
            <option value={InteractionType.HIGHLIGHT_HOTSPOT}>Highlight</option>
          </select>
        </div>

        {/* Type-specific fields */}
        {renderTypeSpecificFields()}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded font-medium transition-colors"
        >
          {event ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </div>
  );
};

export default StreamlinedHotspotEditor;