import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { XMarkIcon } from './icons/XMarkIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon'; // Already imported, can be reused
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
  onPreviewOverlay?: (event: TimelineEventData | null) => void; // New callback for preview overlays
}

// Event Type Selector Component
const EventTypeSelector: React.FC<{ onSelectEventType: (type: InteractionType) => void }> = ({ onSelectEventType }) => {
  const eventTypes: { type: InteractionType; label: string }[] = [
    { type: InteractionType.SPOTLIGHT, label: 'Spotlight' },
    { type: InteractionType.PAN_ZOOM, label: 'Pan & Zoom' },
    { type: InteractionType.SHOW_TEXT, label: 'Text Display' },
    { type: InteractionType.SHOW_IMAGE_MODAL, label: 'Image Modal' },
    { type: InteractionType.SHOW_VIDEO, label: 'Video Modal' },
    { type: InteractionType.SHOW_AUDIO_MODAL, label: 'Audio Modal' },
    { type: InteractionType.SHOW_YOUTUBE, label: 'YouTube Modal' },
    { type: InteractionType.QUIZ, label: 'Quiz Question' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {eventTypes.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => onSelectEventType(type)}
          className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs flex flex-col items-center gap-1 justify-center min-h-[50px]" // Added justify-center and min-h
        >
          {/* Using a generic icon for now, could be specific later */}
          <PlusIcon className="w-4 h-4 mb-0.5" />
          <span className="text-center">{label}</span>
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
  onAddEventClick: () => void; // New prop for handling "Add Event" button click
}> = ({ title, onTitleChange, onSave, onDelete, onClose, onAddEventClick }) => (
  <div className="p-2 bg-gray-900 flex items-center justify-between border-b border-gray-700">
    <input
      type="text"
      value={title}
      onChange={e => onTitleChange(e.target.value)}
      className="bg-gray-700 text-xl font-bold p-1 rounded"
    />
    <div className="flex items-center space-x-2">
      <button
        onClick={onAddEventClick} // Attach handler here
        className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-1 text-white"
        title="Add a new event to this hotspot"
      >
        <PlusIcon className="w-4 h-4" />
        Add Event
      </button>
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
  onPreviewEvent,
  onPreviewOverlay
}) => {
  // Local state for the hotspot being edited
  const [localHotspot, setLocalHotspot] = useState(selectedHotspot);
  const [previewingEventIds, setPreviewingEventIds] = useState<string[]>([]);
  const [showEventTypeSelector, setShowEventTypeSelector] = useState(false); // New state for EventTypeSelector visibility
  const eventTypeSelectorRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  useEffect(() => { 
    setLocalHotspot(selectedHotspot); 
    setPreviewingEventIds([]); 
    setShowEventTypeSelector(false); // Reset on hotspot change
  }, [selectedHotspot]);

  const handleToggleEventTypeSelector = () => {
    setShowEventTypeSelector(prev => !prev);
  };

  // Scroll to EventTypeSelector when it becomes visible
  useEffect(() => {
    if (showEventTypeSelector && eventTypeSelectorRef.current) {
      eventTypeSelectorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showEventTypeSelector]);

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
        imageUrl: '', // Correct field for SHOW_IMAGE_MODAL
        mediaType: 'image', // Keep for clarity, though InteractiveModule uses the main type
        name: 'New Image Modal',
      }),
      ...(type === InteractionType.SHOW_VIDEO && {
        videoUrl: '', // Correct field for SHOW_VIDEO
        mediaType: 'video',
        name: 'New Video Modal',
        autoplay: false,
        loop: false,
      }),
      ...(type === InteractionType.SHOW_AUDIO_MODAL && {
        audioUrl: '', // Correct field for SHOW_AUDIO_MODAL
        mediaType: 'audio',
        name: 'New Audio Modal',
        autoplay: false,
        loop: false,
      }),
      ...(type === InteractionType.SHOW_YOUTUBE && {
        youtubeVideoId: '', // Correct field for SHOW_YOUTUBE
        mediaType: 'youtube',
        name: 'New YouTube Modal',
        autoplay: false,
        loop: false,
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
    const event = relatedEvents.find(e => e.id === eventId);
    
    console.log('🔍 PREVIEW DEBUG: handleTogglePreview called', { 
      eventId, 
      isCurrentlyPreviewing, 
      previewingEventIds: [...previewingEventIds],
      onPreviewOverlayExists: !!onPreviewOverlay,
      eventFound: !!event
    });
    
    if (isCurrentlyPreviewing) {
      // Remove from preview - hide overlay
      console.log('🔍 PREVIEW DEBUG: Removing from preview and hiding overlay');
      setPreviewingEventIds(prev => prev.filter(id => id !== eventId));
      onPreviewOverlay?.(null); // Hide overlay
    } else {
      // Add to preview - show overlay for this event
      console.log('🔍 PREVIEW DEBUG: Adding to preview and showing overlay');
      setPreviewingEventIds(prev => [...prev, eventId]);
      if (event) {
        onPreviewOverlay?.(event); // Show overlay for this event
      }
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
      <div 
        className={`
          fixed top-0 right-0 z-60 h-screen
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ width: '384px' }}
      >
        <div className="w-full h-full bg-gray-800 text-white flex flex-col shadow-2xl border-l border-gray-700" onClick={(e) => e.stopPropagation()}>
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
            onAddEventClick={handleToggleEventTypeSelector} // Pass the handler here
          />
          <div className="flex-grow flex flex-col p-3 gap-3 overflow-y-auto">
            <div className="flex flex-col gap-3">
              {showEventTypeSelector && ( // Conditionally render this section
                <div ref={eventTypeSelectorRef} className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base font-semibold">Add New Event Type</h3>
                    <button
                      onClick={handleToggleEventTypeSelector}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Close event type selector"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <EventTypeSelector onSelectEventType={(type) => {
                    handleAddEvent(type);
                    setShowEventTypeSelector(false); // Optionally hide after selection
                  }} />
                </div>
              )}
              <div className="flex-grow bg-gray-700 p-2 rounded-lg overflow-y-auto min-h-[200px] max-h-[400px]">
                {localHotspotEvents?.length === 0 && !showEventTypeSelector && (
                  <div className="text-center text-gray-400 py-4">
                    No events for this hotspot. Click "Add Event" to create one.
                  </div>
                )}
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
      {/* Backdrop overlay for closing when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={onClose}
        />
      )}
    </DndProvider>
  );
};

export default EnhancedHotspotEditorModal;