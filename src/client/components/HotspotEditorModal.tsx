import React, { useState, useCallback, useEffect } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { XMarkIcon } from './icons/XMarkIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import EventTypeToggle from './EventTypeToggle';
import PanZoomSettings from './PanZoomSettings';
import SpotlightSettings from './SpotlightSettings';
import EnhancedHotspotPreview from './EnhancedHotspotPreview';
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
}

// Event Type Selector Component
const EventTypeSelector: React.FC<{ onSelectEventType: (type: InteractionType) => void }> = ({ onSelectEventType }) => {
  const eventTypes: { type: InteractionType; label: string; icon: string }[] = [
    { type: InteractionType.SPOTLIGHT, label: 'spotlight', icon: '🎯' },
    { type: InteractionType.PAN_ZOOM, label: 'pan-zoom', icon: '🔍' },
    { type: InteractionType.SHOW_TEXT, label: 'text', icon: '💬' },
    { type: InteractionType.SHOW_IMAGE_MODAL, label: 'media', icon: '🖼️' },
    { type: InteractionType.QUIZ, label: 'question', icon: '❓' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {eventTypes.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => onSelectEventType(type)}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1"
        >
          <span>{icon}</span>
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
  allHotspots
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
      // Add default properties based on type
      ...(type === InteractionType.SPOTLIGHT && { 
        shape: 'circle', 
        size: { width: 20, height: 20 }, 
        position: { x: 50, y: 50 }, 
        opacity: 0.7,
        highlightShape: 'circle',
        dimPercentage: 70
      }),
      ...(type === InteractionType.PAN_ZOOM && { 
        zoom: 2, 
        targetX: 50, 
        targetY: 50,
        zoomLevel: 2,
        zoomFactor: 2
      }),
      ...(type === InteractionType.SHOW_TEXT && { 
        content: 'Some text', 
        textContent: 'Some text'
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
    setPreviewingEventIds(prev => 
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="max-w-7xl w-full h-[90vh] bg-gray-800 text-white flex flex-col" onClick={e => e.stopPropagation()}>
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
          <div className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
            <div className="md:w-2/3 h-1/2 md:h-full bg-gray-900 rounded-lg overflow-hidden">
              <EnhancedHotspotPreview 
                backgroundImage={backgroundImage} 
                hotspot={localHotspot} 
                previewingEvents={previewingEvents} 
                activePreviewEvent={activePreviewEvent}
                zoomLevel={activePreviewEvent?.zoomLevel || 2}
                spotlightShape={activePreviewEvent?.highlightShape || "circle"}
                dimPercentage={activePreviewEvent?.dimPercentage || 70}
                textContent={activePreviewEvent?.textContent || ""}
                textPosition={activePreviewEvent?.textPosition || "center"}
                spotlightPosition={{ 
                  x: activePreviewEvent?.spotlightX || localHotspot.x, 
                  y: activePreviewEvent?.spotlightY || localHotspot.y, 
                  width: activePreviewEvent?.spotlightWidth || 120, 
                  height: activePreviewEvent?.spotlightHeight || 120 
                }}
                textBoxPosition={{ 
                  x: activePreviewEvent?.textX || localHotspot.x, 
                  y: activePreviewEvent?.textY || localHotspot.y - 15, 
                  width: activePreviewEvent?.textWidth || 200, 
                  height: activePreviewEvent?.textHeight || 60 
                }}
                onSpotlightPositionChange={(position) => {
                  if (activePreviewEvent) {
                    handleEventUpdate({
                      ...activePreviewEvent,
                      spotlightX: position.x,
                      spotlightY: position.y,
                      spotlightWidth: position.width,
                      spotlightHeight: position.height
                    });
                  }
                }}
                onTextPositionChange={(position) => {
                  if (activePreviewEvent) {
                    handleEventUpdate({
                      ...activePreviewEvent,
                      textX: position.x,
                      textY: position.y,
                      textWidth: position.width,
                      textHeight: position.height
                    });
                  }
                }}
                onZoomLevelChange={(level) => {
                  if (activePreviewEvent) {
                    handleEventUpdate({
                      ...activePreviewEvent,
                      zoomLevel: level,
                      zoomFactor: level
                    });
                  }
                }}
              />
            </div>
            <div className="md:w-1/3 h-1/2 md:h-full flex flex-col gap-4">
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
  );
};

export default EnhancedHotspotEditorModal;