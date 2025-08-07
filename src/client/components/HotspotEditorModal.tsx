import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { normalizeHotspotPosition } from '../../lib/safeMathUtils';
import { hotspotStylePresets, hotspotSizePresets, applyStylePreset, defaultHotspotSize } from '../../shared/hotspotStylePresets';
import { InteractionType } from '../../shared/InteractionPresets';
import { HotspotData, TimelineEventData, HotspotSize } from '../../shared/types';
import { UnifiedEditorState, EditorStateActions } from '../hooks/useUnifiedEditorState';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';
import { getNextTimelineStep, moveEventUp, moveEventDown, getSortedEvents, canMoveUp, canMoveDown } from '../utils/timelineUtils';
import EditableEventCard from './EditableEventCard';
import EventTypeToggle from './EventTypeToggle';
import InteractionTypeSelector, { AddInteractionButton } from './InteractionTypeSelector';
import TabContainer, { TabItem } from './ui/TabContainer';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { PlusIcon } from './icons/PlusIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import InteractionEditor from './interactions/InteractionEditor';
import InteractionSettingsModal from './InteractionSettingsModal';
import PanZoomSettings from './PanZoomSettings';
import SpotlightSettings from './SpotlightSettings';

interface EnhancedHotspotEditorModalProps {
  editorState: UnifiedEditorState;
  editorActions: EditorStateActions;
  selectedHotspot: HotspotData | null;
  relatedEvents: TimelineEventData[];
  currentStep: number;
  backgroundImage: string;
  onUpdateHotspot: (hotspot: HotspotData) => void;
  onDeleteHotspot: (hotspotId: string) => void;
  onAddEvent: (event: TimelineEventData) => void;
  onUpdateEvent: (event: TimelineEventData) => void;
  onDeleteEvent: (eventId: string) => void;
  allHotspots: HotspotData[];
  onPreviewEvent?: (eventId: string) => void; // New callback for previewing on main image
  onPreviewOverlay?: (event: TimelineEventData | null) => void; // New callback for preview overlays
}

// Event Type Selector Component
const EventTypeGrid: React.FC<{ onSelectEventType: (type: InteractionType) => void }> = React.memo(({ onSelectEventType }) => {
  const eventTypes: { type: InteractionType; label: string }[] = [
    { type: InteractionType.SPOTLIGHT, label: 'Spotlight' },
    { type: InteractionType.PAN_ZOOM, label: 'Pan & Zoom' },
    { type: InteractionType.SHOW_TEXT, label: 'Text Display' },
    { type: InteractionType.PLAY_VIDEO, label: 'Video' },
    { type: InteractionType.PLAY_AUDIO, label: 'Audio' },
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
});

// Hotspot Editor Toolbar Component
const HotspotEditorToolbar: React.FC<{
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = React.memo(({ title, onTitleChange, onSave, onDelete, onClose }) => (
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
));

const HotspotEditorModal: React.FC<EnhancedHotspotEditorModalProps> = ({
  editorState,
  editorActions,
  selectedHotspot,
  relatedEvents,
  currentStep,
  backgroundImage,
  onUpdateHotspot,
  onDeleteHotspot,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  allHotspots,
  onPreviewEvent,
  onPreviewOverlay
}) => {
  const eventIdCounter = useRef(0);
  const timestampCounter = useRef(0);

  const { isOpen, isCollapsed } = editorState.hotspotEditor;
  const { isOpen: isSettingsModalOpen, editingEventId } = editorState.interactionEditor;

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
  
  // Tab management state
  const [activeTab, setActiveTab] = useState<string>('hotspot');
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null);
  
  // Legacy state (will be removed)
  const [showEventTypeSelector, setShowEventTypeSelector] = useState(false);
  const [isHotspotSettingsCollapsed, setIsHotspotSettingsCollapsed] = useState(false);
  const eventTypeSelectorRef = useRef<HTMLDivElement>(null);

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
      id: `event_${++eventIdCounter.current}`, 
      name: `New ${type.toLowerCase().replace('_', ' ')} event`,
      step: getNextTimelineStep(relatedEvents),
      type,
      targetId: localHotspot.id,
      
      // === UNIFIED VIDEO PROPERTIES ===
      ...(type === InteractionType.PLAY_VIDEO && {
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
  
  // Timeline control handlers
  const handleMoveEventUp = (eventId: string) => {
    const updatedEvents = moveEventUp(eventId, relatedEvents);
    // Apply the updates
    updatedEvents.forEach(event => {
      if (event.id !== eventId) {
        onUpdateEvent(event);
      }
    });
    const targetEvent = updatedEvents.find(e => e.id === eventId);
    if (targetEvent) {
      onUpdateEvent(targetEvent);
    }
  };
  
  const handleMoveEventDown = (eventId: string) => {
    const updatedEvents = moveEventDown(eventId, relatedEvents);
    // Apply the updates
    updatedEvents.forEach(event => {
      if (event.id !== eventId) {
        onUpdateEvent(event);
      }
    });
    const targetEvent = updatedEvents.find(e => e.id === eventId);
    if (targetEvent) {
      onUpdateEvent(targetEvent);
    }
  };
  
  // New interaction type selector handlers
  const handleAddInteraction = () => {
    setSelectedInteractionId('new');
    setActiveTab('interactions');
  };
  
  const handleInteractionTypeSelected = (type: InteractionType) => {
    handleAddEvent(type);
    setSelectedInteractionId(null);
    // Automatically switch to properties tab and open settings
    setActiveTab('properties');
    // Find the newly created event and open its settings
    setTimeout(() => {
      const newEvents = relatedEvents.filter(e => e.targetId === localHotspot?.id);
      const latestEvent = newEvents[newEvents.length - 1];
      if (latestEvent) {
        editorActions.openInteractionEditor(latestEvent.id);
      }
    }, 100);
  };

  const handleSave = () => { 
    if (localHotspot) {
      onUpdateHotspot(normalizeHotspotPosition(localHotspot));
    }
    editorActions.closeHotspotEditor();
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
    className: `fixed top-0 right-0 ${Z_INDEX_TAILWIND.PROPERTIES_PANEL} h-screen transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`,
    timestamp: ++timestampCounter.current
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <>
        <div 
          className={`
            fixed top-0 right-0 ${Z_INDEX_TAILWIND.MODAL_CONTENT} h-screen
            bg-gray-800 text-white shadow-2xl border-l border-gray-700
            transform transition-all duration-300 ease-out
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            ${isCollapsed ? 'w-0' : 'w-full md:w-96'}
          `}
          style={{ 
            visibility: isOpen ? 'visible' : 'hidden',
            willChange: 'transform, width',
            overflow: 'visible' // Allow arrow to be visible outside the collapsed area
          }}
      >
        {/* Collapse/Expand Arrow - Always visible */}
        <button
          onClick={editorActions.toggleHotspotEditorCollapse}
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full ${Z_INDEX_TAILWIND.MODAL_CONTENT_FLOATING_CONTROL} bg-gray-800 text-white p-2 rounded-l-md border-l border-t border-b border-gray-700 hover:bg-gray-700 transition-colors`}
          aria-label={isCollapsed ? "Expand hotspot editor" : "Collapse hotspot editor"}
        >
          {isCollapsed ? (
            <ChevronLeftIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </button>

        <div className="w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
          {!isCollapsed && (
            <HotspotEditorToolbar 
            title={localHotspot.title || `Edit Hotspot`} 
            onTitleChange={(title) => setLocalHotspot(prev => prev ? { ...prev, title } : null)} 
            onSave={handleSave} 
            onDelete={() => {
              if (window.confirm(`Are you sure you want to delete the hotspot "${localHotspot.title}"?`)) {
                onDeleteHotspot(localHotspot.id);
                editorActions.closeHotspotEditor();
              }
            }} 
            onClose={editorActions.closeHotspotEditor}
          />
          )}
          
          {/* Collapsed State UI - Only arrow tab visible */}
          {isCollapsed && (
            <div className="w-0 h-full">
              {/* Empty - only the arrow tab should be visible */}
            </div>
          )}
          
          {/* Full State UI - New Tabbed Interface */}
          {!isCollapsed && (
            <div className="flex-grow flex flex-col overflow-hidden">
              <TabContainer
                defaultActiveTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                  {
                    id: 'hotspot',
                    label: 'Hotspot',
                    content: (
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-4">
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

                        {/* Style Presets */}
                        <div className="mb-4">
                          <label className="text-sm text-gray-300 mb-2 block">Style Presets</label>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {hotspotStylePresets.map((preset) => (
                              <button
                                key={preset.name}
                                onClick={() => {
                                  if (localHotspot) {
                                    const updatedHotspot = applyStylePreset(localHotspot, preset);
                                    setLocalHotspot(updatedHotspot);
                                    onUpdateHotspot(updatedHotspot);
                                  }
                                }}
                                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-xs transition-colors flex items-center gap-2"
                                title={preset.description}
                              >
                                <div
                                  className="w-3 h-3 rounded-full border border-gray-400"
                                  style={{ backgroundColor: preset.style.color }}
                                />
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Size Options */}
                        <div className="mb-4">
                          <label className="text-sm text-gray-300 mb-2 block">Size</label>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {hotspotSizePresets.map((sizePreset) => (
                              <button
                                key={sizePreset.value}
                                onClick={() => {
                                  if (localHotspot) {
                                    setLocalHotspot(prev => prev ? { ...prev, size: sizePreset.value } : null);
                                  }
                                }}
                                className={`px-3 py-2 rounded text-xs transition-colors ${
                                  localHotspot?.size === sizePreset.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-600 text-white hover:bg-gray-500'
                                }`}
                                title={sizePreset.description}
                              >
                                {sizePreset.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Pulse Animation Toggle */}
                        <div className="flex items-center justify-between mb-4">
                          <label htmlFor="pulse-animation-toggle" className="text-sm text-gray-300">
                            Pulse Animation
                          </label>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!!localHotspot.pulseAnimation}
                            onClick={() =>
                              setLocalHotspot(prev => {
                                if (!prev) return null;
                                const newPulseAnimation = !prev.pulseAnimation;
                                return {
                                  ...prev,
                                  pulseAnimation: newPulseAnimation,
                                  ...(newPulseAnimation && !prev.pulseType && { pulseType: 'loop' as const }),
                                };
                              })
                            }
                            id="pulse-animation-toggle"
                            className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
                                        ${localHotspot.pulseAnimation ? 'bg-green-500' : 'bg-gray-600'}`}
                          >
                            <span
                              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform
                                          ${localHotspot.pulseAnimation ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                          </button>
                        </div>
                        
                        {/* Pulse Type Radio Buttons */}
                        {localHotspot.pulseAnimation && (
                          <div className="mb-4">
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
                          <div className="mb-4">
                            <label htmlFor="pulse-duration" className="text-sm text-gray-300">
                              Pulse Duration (seconds)
                            </label>
                            <input
                              type="number"
                              id="pulse-duration"
                              value={localHotspot.pulseDuration ?? ''}
                              onChange={e => {
                                const newDuration = parseFloat(e.target.value);
                                setLocalHotspot(prev => {
                                  if (!prev) return null;
                                  const updatedHotspot = { ...prev };
                                  if (isNaN(newDuration)) {
                                    delete updatedHotspot.pulseDuration;
                                  } else {
                                    updatedHotspot.pulseDuration = newDuration;
                                  }
                                  return updatedHotspot;
                                });
                              }}
                              className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white mt-2"
                              min="0"
                              step="0.1"
                              placeholder="Enter duration in seconds"
                            />
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    id: 'interactions',
                    label: 'Interactions',
                    content: (
                      <div className="p-3 flex flex-col h-full">
                        <div className="mb-4">
                          <AddInteractionButton onClick={handleAddInteraction} />
                        </div>
                        
                        <div className="flex-grow overflow-y-auto">
                          {localHotspotEvents?.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                              No interactions for this hotspot.
                              <br />
                              Click "Add Interaction" to create one.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {getSortedEvents(localHotspotEvents).map((event, index) => (
                                <EditableEventCard
                                  key={event.id}
                                  index={index}
                                  event={event}
                                  onUpdate={handleEventUpdate}
                                  onDelete={handleEventDelete}
                                  moveCard={moveEvent}
                                  onTogglePreview={() => handleTogglePreview(event.id)}
                                  onEdit={() => editorActions.openInteractionEditor(event.id)}
                                  isPreviewing={previewingEventIds.includes(event.id)}
                                  allHotspots={allHotspots}
                                  onMoveUp={handleMoveEventUp}
                                  onMoveDown={handleMoveEventDown}
                                  canMoveUp={canMoveUp(event.id, localHotspotEvents)}
                                  canMoveDown={canMoveDown(event.id, localHotspotEvents)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  },
                  {
                    id: 'properties',
                    label: 'Properties',
                    content: (
                      <div className="p-3">
                        {editingEventId ? (
                          <div className="text-gray-300">
                            <h3 className="text-lg font-semibold mb-4">Event Properties</h3>
                            <p className="text-sm text-gray-400 mb-4">
                              Editing properties for event: {relatedEvents.find(e => e.id === editingEventId)?.name || 'Unknown'}
                            </p>
                            {/* Properties content will be moved here from InteractionSettingsModal */}
                            <div className="bg-gray-700 p-4 rounded-lg">
                              <p className="text-sm">Properties editor integration coming soon...</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 py-8">
                            Select an interaction from the Interactions tab to edit its properties.
                          </div>
                        )}
                      </div>
                    )
                  }
                ]}
              />
            </div>
          )}
        </div>
      </div>
      <InteractionSettingsModal
        isOpen={isSettingsModalOpen}
        event={relatedEvents.find(e => e.id === editingEventId) || null}
        onUpdate={handleEventUpdate}
        onClose={editorActions.closeInteractionEditor}
      />
      {/* InteractionTypeSelector Modal - Render conditionally */}
      {selectedInteractionId === 'new' && (
        <div className={`fixed inset-0 ${Z_INDEX_TAILWIND.MODAL_BACKDROP} bg-black bg-opacity-50`} onClick={() => setSelectedInteractionId(null)}>
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${Z_INDEX_TAILWIND.MODAL_CONTENT}`} onClick={(e) => e.stopPropagation()}>
            <InteractionTypeSelector
              onSelectType={handleInteractionTypeSelected}
              onClose={() => setSelectedInteractionId(null)}
            />
          </div>
        </div>
      )}
      
      {/* Backdrop overlay for closing when clicking outside */}
      {isOpen && !isSettingsModalOpen && selectedInteractionId !== 'new' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={editorActions.closeHotspotEditor}
        />
      )}
      </>
    </DndProvider>
  );
};

export default HotspotEditorModal;