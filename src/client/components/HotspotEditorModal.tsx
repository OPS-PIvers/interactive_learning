import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { XMarkIcon } from './icons/XMarkIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import EventTypeToggle from './EventTypeToggle';
import PanZoomSettings from './PanZoomSettings';
import SpotlightSettings from './SpotlightSettings';
import EditableEventCard from './EditableEventCard';
import MobilePlayAudioEditor from './MobilePlayAudioEditor';
import { normalizeHotspotPosition } from '../../lib/safeMathUtils';

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
  onCollapseChange?: (isCollapsed: boolean) => void; // New callback for collapse state changes
}

// Event Type Selector Component
const EventTypeSelector: React.FC<{ onSelectEventType: (type: InteractionType) => void }> = ({ onSelectEventType }) => {
  const eventTypes: { type: InteractionType; label: string }[] = [
    { type: InteractionType.SPOTLIGHT, label: 'Spotlight' },
    { type: InteractionType.PAN_ZOOM, label: 'Pan & Zoom' },
    { type: InteractionType.SHOW_TEXT, label: 'Text Display' },
    { type: InteractionType.PLAY_VIDEO, label: 'Video' },
    { type: InteractionType.PLAY_AUDIO, label: 'Audio' },
    { type: InteractionType.QUIZ, label: 'Quiz Question' },
    { type: InteractionType.PULSE_HOTSPOT, label: 'Pulse Hotspot' },
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
}> = ({ title, onTitleChange, onSave, onDelete, onClose }) => (
  <div className="p-2 bg-gray-900 flex items-center justify-between border-b border-gray-700">
    <input
      type="text"
      value={title}
      onChange={e => onTitleChange(e.target.value)}
      className="bg-gray-700 text-xl font-bold p-1 rounded"
    />
    <div className="flex items-center space-x-2">
      <button
        onClick={onSave}
        className="p-2 bg-green-600 rounded hover:bg-green-700"
        title="Save & Close"
      >
        <SaveIcon className="w-4 h-4" />
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
  onPreviewOverlay,
  onCollapseChange
}) => {
  const eventIdCounter = useRef(0);
  const timestampCounter = useRef(0);

  // Debug logging to understand modal rendering
  console.log('🔍 HOTSPOT EDITOR MODAL DEBUG:', {
    isOpen,
    selectedHotspot: selectedHotspot ? { id: selectedHotspot.id, title: selectedHotspot.title } : null,
    relatedEventsCount: relatedEvents.length,
    component: 'HotspotEditorModal',
    timestamp: ++timestampCounter.current
  });
  // Local state for the hotspot being edited
  const [localHotspot, setLocalHotspot] = useState(selectedHotspot);
  const [previewingEventIds, setPreviewingEventIds] = useState<string[]>([]);
  const [editingEvent, setEditingEvent] = useState<TimelineEventData | null>(null);
  const [showEventTypeSelector, setShowEventTypeSelector] = useState(false); // New state for EventTypeSelector visibility
  const [isCollapsed, setIsCollapsed] = useState(false); // New state for collapse/expand
  const eventTypeSelectorRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  useEffect(() => { 
    setLocalHotspot(selectedHotspot); 
    setPreviewingEventIds([]); 
    setShowEventTypeSelector(false); // Reset on hotspot change
  }, [selectedHotspot]);

  const handleToggleEventTypeSelector = () => {
    setShowEventTypeSelector(prev => !prev);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const newCollapsed = !prev;
      onCollapseChange?.(newCollapsed);
      return newCollapsed;
    });
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
      id: `event_${++eventIdCounter.current}`, 
      name: `New ${type.toLowerCase().replace('_', ' ')} event`,
      step: currentStep,
      type,
      targetId: localHotspot.id,
      
      // === UNIFIED VIDEO PROPERTIES ===
      ...(type === InteractionType.PLAY_VIDEO && {
        videoSource: undefined, // User will select
        videoDisplayMode: 'inline',
        videoShowControls: true,
        autoplay: false,
        loop: false,
      }),
      
      // === UNIFIED AUDIO PROPERTIES ===
      ...(type === InteractionType.PLAY_AUDIO && {
        audioUrl: '',
        audioDisplayMode: 'background',
        audioShowControls: false,
        autoplay: true,
        volume: 80,
      }),
      
      // === UNIFIED TEXT PROPERTIES ===
      ...(type === InteractionType.SHOW_TEXT && {
        textContent: 'Enter your text here',
        textPosition: 'center',
        textX: 50,
        textY: 50,
        textWidth: 300,
        textHeight: 100,
      }),
      
      // === UNIFIED SPOTLIGHT PROPERTIES ===
      ...(type === InteractionType.SPOTLIGHT && {
        spotlightShape: 'circle',
        spotlightX: localHotspot.x,
        spotlightY: localHotspot.y, 
        spotlightWidth: 120,
        spotlightHeight: 120,
        backgroundDimPercentage: 70,
        spotlightOpacity: 0, // Always bright
      }),
      
      // === UNIFIED PAN_ZOOM PROPERTIES ===
      ...((type === InteractionType.PAN_ZOOM || type === InteractionType.PAN_ZOOM_TO_HOTSPOT) && {
        targetX: localHotspot.x,
        targetY: localHotspot.y,
        zoomLevel: 2,
        smooth: true,
      }),
      
      // === PULSE PROPERTIES ===
      ...(type === InteractionType.PULSE_HOTSPOT && {
        duration: 2000,
        intensity: 80,
      }),
      
      // === OTHER PROPERTIES ===
      
      ...(type === InteractionType.QUIZ && {
        quizQuestion: 'Enter your question',
        quizOptions: ['Option 1', 'Option 2', 'Option 3'],
        quizCorrectAnswer: 0,
        quizExplanation: '',
      }),
    };
    onAddEvent(newEvent);

    // Automatically trigger preview for the new event
    setPreviewingEventIds(prev => [...prev, newEvent.id]);
    onPreviewOverlay?.(newEvent);
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
      onUpdateHotspot(normalizeHotspotPosition(localHotspot));
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

  // Debug the early return condition
  console.log('🔍 MODAL EARLY RETURN CHECK:', {
    isOpen,
    localHotspot: localHotspot ? { id: localHotspot.id, title: localHotspot.title } : null,
    selectedHotspot: selectedHotspot ? { id: selectedHotspot.id, title: selectedHotspot.title } : null,
    willReturn: (!isOpen || !localHotspot),
    timestamp: ++timestampCounter.current
  });

  if (!isOpen || !localHotspot) {
    console.log('🔍 MODAL RETURNING NULL:', { isOpen, localHotspot: !!localHotspot });
    return null;
  }

  const localHotspotEvents = relatedEvents.filter(event => event.targetId === localHotspot.id);
  const previewingEvents = localHotspotEvents.filter(event => previewingEventIds.includes(event.id));
  const activePreviewEventId = previewingEventIds[previewingEventIds.length - 1] || null;
  const activePreviewEvent = localHotspotEvents.find(event => event.id === activePreviewEventId);


  console.log('🔍 MODAL RENDERING:', {
    isOpen,
    localHotspot: localHotspot ? { id: localHotspot.id, title: localHotspot.title } : null,
    className: `fixed top-0 right-0 z-60 h-screen transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`,
    timestamp: ++timestampCounter.current
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <>
        <div 
          className={`
            fixed top-0 right-0 z-[70] h-screen
            transform transition-transform duration-300 ease-out
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
          style={{ 
            width: isCollapsed ? '0px' : '384px',
            visibility: isOpen ? 'visible' : 'hidden', // Explicit visibility
            display: 'block', // Ensure it's not hidden
            willChange: 'transform, width', // Optimize for animation
            right: isOpen ? '0' : (isCollapsed ? '0px' : '-384px'), // Fallback positioning
            transition: 'width 0.3s ease-out', // Smooth width transition
            overflow: 'visible' // Allow arrow to be visible outside the collapsed area
          }}
      >
        {/* Collapse/Expand Arrow - Always visible */}
        <button
          onClick={handleToggleCollapse}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full z-[71] bg-gray-800 text-white p-2 rounded-l-md border-l border-t border-b border-gray-700 hover:bg-gray-700 transition-colors"
          aria-label={isCollapsed ? "Expand hotspot editor" : "Collapse hotspot editor"}
        >
          {isCollapsed ? (
            <ChevronLeftIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </button>

        <div className="w-full h-full bg-gray-800 text-white flex flex-col shadow-2xl border-l border-gray-700" onClick={(e) => e.stopPropagation()}>
          {!isCollapsed && (
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
          )}
          
          {/* Collapsed State UI - Only arrow tab visible */}
          {isCollapsed && (
            <div className="w-0 h-full">
              {/* Empty - only the arrow tab should be visible */}
            </div>
          )}
          
          {/* Full State UI */}
          {!isCollapsed && (
            <div className="flex-grow flex flex-col p-3 gap-3 overflow-y-auto">
            {/* Hotspot Settings Section */}
            <div className="bg-gray-700 p-3 rounded-lg">
              <h3 className="text-base font-semibold mb-2 text-white">Hotspot Settings</h3>
              <div className="flex items-center justify-between">
                <label htmlFor="display-hotspot-toggle" className="text-sm text-gray-300">
                  Display hotspot during event
                </label>
                <div
                  onClick={() =>
                    setLocalHotspot(prev => prev ? { ...prev, displayHotspotInEvent: !prev.displayHotspotInEvent } : null)
                  }
                  id="display-hotspot-toggle"
                  className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors
                              ${localHotspot.displayHotspotInEvent ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform
                                ${localHotspot.displayHotspotInEvent ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </div>
              </div>
              {/* Pulse Animation Toggle */}
              <div className="flex items-center justify-between mt-4">
                <label htmlFor="pulse-animation-toggle" className="text-sm text-gray-300">
                  Pulse Animation
                </label>
                <div
                  onClick={() =>
                    setLocalHotspot(prev => prev ? { ...prev, pulseAnimation: !prev.pulseAnimation } : null)
                  }
                  id="pulse-animation-toggle"
                  className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors
                              ${localHotspot.pulseAnimation ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform
                                ${localHotspot.pulseAnimation ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </div>
              </div>
              {/* Pulse Type Radio Buttons */}
              {localHotspot.pulseAnimation && (
                <div className="mt-4">
                  <label className="text-sm text-gray-300">Pulse Type</label>
                  <div className="flex items-center mt-2">
                    <input
                      type="radio"
                      id="pulse-loop"
                      name="pulseType"
                      value="loop"
                      checked={localHotspot.pulseType === 'loop'}
                      onChange={() =>
                        setLocalHotspot(prev => prev ? { ...prev, pulseType: 'loop' } : null)
                      }
                      className="mr-2"
                    />
                    <label htmlFor="pulse-loop" className="text-sm text-gray-300">Loop</label>
                    <input
                      type="radio"
                      id="pulse-timed"
                      name="pulseType"
                      value="timed"
                      checked={localHotspot.pulseType === 'timed'}
                      onChange={() =>
                        setLocalHotspot(prev => prev ? { ...prev, pulseType: 'timed' } : null)
                      }
                      className="ml-4 mr-2"
                    />
                    <label htmlFor="pulse-timed" className="text-sm text-gray-300">Timed</label>
                  </div>
                </div>
              )}
              {/* Pulse Duration Input */}
              {localHotspot.pulseAnimation && localHotspot.pulseType === 'timed' && (
                <div className="mt-4">
                  <label htmlFor="pulse-duration" className="text-sm text-gray-300">
                    Pulse Duration (seconds)
                  </label>
                  <input
                    type="number"
                    id="pulse-duration"
                    value={localHotspot.pulseDuration || ''}
                    onChange={e =>
                      setLocalHotspot(prev => prev ? { ...prev, pulseDuration: Number(e.target.value) } : null)
                    }
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white mt-2"
                  />
                </div>
              )}
            </div>

            {/* Add Event Button - For adding events to the current hotspot */}
            <div className="bg-gray-700 p-3 rounded-lg">
              <button
                onClick={handleToggleEventTypeSelector}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                title="Add a new event to this hotspot"
              >
                <PlusIcon className="w-5 h-5" />
                Add Event
              </button>
            </div>

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
                {localHotspotEvents?.map((event, index) => (
                  <EditableEventCard
                    key={event.id}
                    index={index}
                    event={event}
                    onUpdate={handleEventUpdate}
                    onDelete={handleEventDelete}
                    moveCard={moveEvent}
                    onTogglePreview={() => handleTogglePreview(event.id)}
                    onEdit={() => setEditingEvent(event)}
                    isPreviewing={previewingEventIds.includes(event.id)}
                    allHotspots={allHotspots}
                  />
                ))}
              </div>
            </div>
          </div>
          )}
          {editingEvent &&
            editingEvent.type === InteractionType.PLAY_AUDIO && (
              <MobilePlayAudioEditor
                event={editingEvent}
                onUpdate={(updatedEvent) => {
                  handleEventUpdate(updatedEvent);
                  setEditingEvent(null);
                }}
                onClose={() => setEditingEvent(null)}
              />
            )}
          {editingEvent && editingEvent.type === InteractionType.PAN_ZOOM && (
            <PanZoomSettings
              zoomLevel={editingEvent.zoomLevel || 2}
              onZoomChange={(zoom) =>
                handleEventUpdate({ ...editingEvent, zoomLevel: zoom })
              }
              showTextBanner={!!editingEvent.showTextBanner}
              onShowTextBannerChange={(value) =>
                handleEventUpdate({ ...editingEvent, showTextBanner: value })
              }
            />
          )}
        </div>
      </div>
      {/* Backdrop overlay for closing when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={onClose}
        />
      )}
      </>
    </DndProvider>
  );
};

export default EnhancedHotspotEditorModal;