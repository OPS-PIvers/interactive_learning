import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { XMarkIcon } from './icons/XMarkIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import EventTypeToggle from './EventTypeToggle';
import PanZoomSettings from './PanZoomSettings';
import SpotlightSettings from './SpotlightSettings';
import EditableEventCard from './EditableEventCard';

interface EnhancedHotspotEditorModalProps {
  isOpen: boolean;
  selectedHotspot: HotspotData | null;
  relatedEvents: TimelineEventData[];
  currentStep: number;
  backgroundImage: string;
  onUpdateHotspot: (hotspot: HotspotData) => void;
  onDeleteHotspot: (hotspotId: string) => void;
  onAddEvent: (event: TimelineEventData) => void;
  onUpdateEvent: (event: TimelineEventData) => void;
  onDeleteEvent: (eventId: string) => void;
  onClose: () => void;
  allHotspots: HotspotData[];
  onPreviewEvent?: (eventId: string) => void; // New callback for previewing on main image
}

// Event Type Selector Component
const EventTypeSelector: React.FC<{ onSelectEventType: (type: InteractionType) => void }> = ({ onSelectEventType }) => {
  const eventTypes: { type: InteractionType; label: string }[] = [
    { type: InteractionType.SPOTLIGHT, label: 'spotlight' },
    { type: InteractionType.PAN_ZOOM, label: 'pan-zoom' },
    { type: InteractionType.SHOW_TEXT, label: 'text' },
    { type: InteractionType.SHOW_IMAGE_MODAL, label: 'media' },
    { type: InteractionType.QUIZ, label: 'question' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {eventTypes.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => onSelectEventType(type)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1"
        >
          <span>+ {label}</span>
        </button>
      ))}
    </div>
  );
};

// Hotspot Editor Toolbar Component
const HotspotEditorToolbar: React.FC<{
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = ({ title, onTitleChange, onSave, onDelete, onClose }) => (
  <div className="p-3 bg-gray-900 flex items-center justify-between">
    <input
      type="text"
      value={title}
      onChange={e => onTitleChange(e.target.value)}
      className="bg-gray-700 text-xl font-bold p-1 rounded"
    />
    <div className="flex items-center space-x-2">
      <button
        onClick={onSave}
        className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 flex items-center gap-1"
      >
        <SaveIcon className="w-4 h-4" />
        Save & Close
      </button>
      <button
        onClick={onDelete}
        className="p-2 bg-red-600 rounded hover:bg-red-700"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
      <button
        onClick={onClose}
        className="p-2 bg-gray-600 rounded hover:bg-gray-700"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const EnhancedHotspotEditorModal: React.FC<EnhancedHotspotEditorModalProps> = ({
  isOpen,
  selectedHotspot,
  relatedEvents,
  currentStep,
  backgroundImage,
  onUpdateHotspot,
  onDeleteHotspot,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onClose,
  allHotspots,
  onPreviewEvent
}) => {
  // Local state for the hotspot being edited
  const [localHotspot, setLocalHotspot] = useState(selectedHotspot);
  const [previewingEventIds, setPreviewingEventIds] = useState<string[]>([]);

  useEffect(() => { 
    setLocalHotspot(selectedHotspot); 
    setPreviewingEventIds([]); 
  }, [selectedHotspot]);

  const handleAddEvent = (type: InteractionType) => {
    if (!localHotspot) return;
    
    const newEvent: TimelineEventData = { 
      id: `event_${Date.now()}`, 
      name: `New ${type.toLowerCase().replace('_', ' ')} event`,
      step: currentStep,
      type,
      targetId: localHotspot.id,
      // Add default properties based on type with smart positioning
      ...(type === InteractionType.SPOTLIGHT && { 
        shape: 'circle', 
        size: { width: 20, height: 20 }, 
        position: { x: 50, y: 50 }, 
        opacity: 0.7,
        highlightShape: 'circle',
        dimPercentage: 70,
        // Position spotlight to the right of hotspot
        spotlightX: Math.min(85, localHotspot.x + 15),
        spotlightY: localHotspot.y,
        spotlightWidth: 120,
        spotlightHeight: 120
      }),
      ...(type === InteractionType.PAN_ZOOM && { 
        zoom: 2, 
        // Position pan-zoom area to the right of hotspot
        targetX: Math.min(85, localHotspot.x + 20),
        targetY: localHotspot.y,
        zoomLevel: 2,
        zoomFactor: 2
      }),
      ...(type === InteractionType.SHOW_TEXT && { 
        content: 'Some text', 
        textContent: 'Some text',
        // Position text box to the right of hotspot
        textX: Math.min(80, localHotspot.x + 15),
        textY: localHotspot.y,
        textWidth: 200,
        textHeight: 60
      }),
      ...(type === InteractionType.SHOW_IMAGE_MODAL && { 
        url: '', 
        mediaUrl: '',
        mediaType: 'image'
      }),
      ...(type === InteractionType.QUIZ && { 
        question: 'Enter question',
        quizQuestion: 'Enter question',
        targetHotspotId: '' 
      }),
    };
    onAddEvent(newEvent);
  };
  
  const handleEventUpdate = (updatedEvent: TimelineEventData) => {
    onUpdateEvent(updatedEvent);
  };
  
  const handleEventDelete = (eventId: string) => {
    onDeleteEvent(eventId);
  };
  
  const moveEvent = (dragIndex: number, hoverIndex: number) => {
    // This would need to be implemented based on your event ordering logic
    // For now, we'll just log the intended move
    console.log(`Move event from ${dragIndex} to ${hoverIndex}`);
  };

  const handleSave = () => { 
    if (localHotspot) {
      onUpdateHotspot(localHotspot); 
    }
    onClose(); 
  };
  
  const handleTogglePreview = (eventId: string) => {
    const isCurrentlyPreviewing = previewingEventIds.includes(eventId);
    
    if (isCurrentlyPreviewing) {
      // Remove from preview
      setPreviewingEventIds(prev => prev.filter(id => id !== eventId));
    } else {
      // Add to preview
      setPreviewingEventIds(prev => [...prev, eventId]);
      // Notify parent to preview on main image
      onPreviewEvent?.(eventId);
    }
  };

  const handleHotspotUpdate = (updatedHotspot: HotspotData) => {
    setLocalHotspot(updatedHotspot);
  };

  if (!isOpen || !localHotspot) return null;

  const localHotspotEvents = relatedEvents.filter(event => event.targetId === localHotspot.id);
  const previewingEvents = localHotspotEvents.filter(event => previewingEventIds.includes(event.id));
  const activePreviewEventId = previewingEventIds[previewingEventIds.length - 1] || null;
  const activePreviewEvent = localHotspotEvents.find(event => event.id === activePreviewEventId);


  return (
    <DndProvider backend={HTML5Backend}>
      <div className="fixed inset-0 z-50 flex justify-end pointer-events-none" onClick={onClose}>
        <div className="w-full max-w-4xl h-full bg-gray-800 text-white flex flex-col pointer-events-auto shadow-2xl border-l border-gray-700" onClick={e => e.stopPropagation()}>
          <HotspotEditorToolbar 
            title={localHotspot.title || `Edit Hotspot`} 
            onTitleChange={(title) => setLocalHotspot(prev => prev ? { ...prev, title } : null)} 
            onSave={handleSave} 
            onDelete={() => {
              if (window.confirm(`Are you sure you want to delete the hotspot "${localHotspot.title}"?`)) {
                onDeleteHotspot(localHotspot.id);
                onClose();
              }
            }} 
            onClose={onClose} 
          />
          <div className="flex-grow flex flex-col p-4 gap-4 overflow-hidden">
            <div className="flex flex-col gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Events</h3>
                <EventTypeSelector onSelectEventType={handleAddEvent} />
              </div>
              <div className="flex-grow bg-gray-700 p-2 rounded-lg overflow-y-auto">
                {localHotspotEvents?.map((event, index) => 
                  <EditableEventCard 
                    key={event.id} 
                    index={index} 
                    event={event} 
                    onUpdate={handleEventUpdate} 
                    onDelete={handleEventDelete} 
                    moveCard={moveEvent} 
                    onTogglePreview={() => handleTogglePreview(event.id)} 
                    isPreviewing={previewingEventIds.includes(event.id)} 
                    allHotspots={allHotspots} 
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default EnhancedHotspotEditorModal;