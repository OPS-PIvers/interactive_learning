import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { normalizeHotspotPosition } from '../../lib/safeMathUtils';
import { hotspotStylePresets, hotspotSizePresets, applyStylePreset } from '../../shared/hotspotStylePresets';
import { InteractionType } from '../../shared/InteractionPresets';
import { TimelineEventData } from '../../shared/type-defs';
import { HotspotData } from '../../shared/types';
import { UnifiedEditorState, EditorStateActions } from '../hooks/useUnifiedEditorState';
import { getNextTimelineStep, moveEventUp, moveEventDown, getSortedEvents, canMoveUp, canMoveDown } from '../utils/timelineUtils';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';
import EditableEventCard from './EditableEventCard';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import InteractionProperties from './interactions/InteractionProperties';
import { AddInteractionButton, InteractionTypeSelectorGrid } from './InteractionTypeSelector';
import TabContainer from './ui/TabContainer';

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
// Hotspot Editor Toolbar Component
const HotspotEditorToolbar: React.FC<{
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = React.memo(({ title, onTitleChange, onSave, onDelete, onClose }) =>
<div className="p-2 bg-gray-900 flex items-center justify-between border-b border-gray-700">
    <input
    type="text"
    value={title}
    onChange={(e) => onTitleChange(e.target.value)}
    className="bg-gray-700 text-xl font-bold p-1 rounded" />

    <div className="flex items-center space-x-2">
      <button
      onClick={onSave}
      className="p-2 bg-green-600 rounded hover:bg-green-700"
      title="Save & Close">

        <SaveIcon className="w-4 h-4" />
      </button>
      <button
      onClick={onDelete}
      className="p-2 bg-red-600 rounded hover:bg-red-700">

        <TrashIcon className="w-4 h-4" />
      </button>
      <button
      onClick={onClose}
      className="p-2 bg-gray-600 rounded hover:bg-gray-700">

        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  </div>
);

HotspotEditorToolbar.displayName = 'HotspotEditorToolbar';

const HotspotEditorModal: React.FC<EnhancedHotspotEditorModalProps> = ({
  editorState,
  editorActions,
  selectedHotspot,
  relatedEvents,
  currentStep: _currentStep,
  backgroundImage: _backgroundImage,
  onUpdateHotspot,
  onDeleteHotspot,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  allHotspots,
  onPreviewEvent: _onPreviewEvent,
  onPreviewOverlay
}) => {
  const eventIdCounter = useRef(0);
  const _timestampCounter = useRef(0);

  const { isOpen } = editorState.hotspotEditor;
  const { editingEventId } = editorState.interactionEditor;

  // Local state for the hotspot being edited
  const [localHotspot, setLocalHotspot] = useState(selectedHotspot);
  const [previewingEventIds, setPreviewingEventIds] = useState<string[]>([]);

  // Tab management state
  const [activeTab, setActiveTab] = useState<string>('hotspot');
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null);

  // Legacy state (will be removed)
  const [showEventTypeSelector, setShowEventTypeSelector] = useState(false);
  const eventTypeSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalHotspot(selectedHotspot);
    setPreviewingEventIds([]);
    setShowEventTypeSelector(false); // Reset on hotspot change
  }, [selectedHotspot]);

  useEffect(() => {
    if (editingEventId) {
      setActiveTab('properties');
    }
  }, [editingEventId]);


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
      ...(type === InteractionType.VIDEO && {
        videoDisplayMode: 'inline',
        videoShowControls: true,
        autoplay: false,
        loop: false
      }),

      // === UNIFIED AUDIO PROPERTIES ===
      ...(type === InteractionType.AUDIO && {
        audioUrl: '',
        audioDisplayMode: 'background',
        audioShowControls: false,
        autoplay: true,
        volume: 80
      }),

      // === UNIFIED TEXT PROPERTIES ===
      ...(type === InteractionType.TEXT && {
        textContent: 'Enter your text here',
        textPosition: 'center',
        textX: 50,
        textY: 50,
        textWidth: 300,
        textHeight: 100
      }),

      // === UNIFIED SPOTLIGHT PROPERTIES ===
      ...(type === InteractionType.SPOTLIGHT && {
        spotlightShape: 'circle',
        spotlightX: localHotspot.x,
        spotlightY: localHotspot.y,
        spotlightWidth: 120,
        spotlightHeight: 120,
        backgroundDimPercentage: 70,
        spotlightOpacity: 0 // Always bright
      }),

      // === UNIFIED PAN_ZOOM PROPERTIES ===
      ...(type === InteractionType.PAN_ZOOM && {
        targetX: localHotspot.x,
        targetY: localHotspot.y,
        zoomLevel: 2,
        smooth: true
      }),

      // === OTHER PROPERTIES ===
      ...(type === InteractionType.QUIZ && {
        quizQuestion: 'Enter your question',
        quizOptions: ['Option 1', 'Option 2', 'Option 3'],
        quizCorrectAnswer: 0,
        quizExplanation: ''
      })
    };
    onAddEvent(newEvent);

    // Automatically trigger preview for the new event
    setPreviewingEventIds((prev) => [...prev, newEvent.id]);
    onPreviewOverlay?.(newEvent);
  };

  const handleEventUpdate = (updatedEvent: TimelineEventData) => {
    onUpdateEvent(updatedEvent);
  };

  const handleEventDelete = (eventId: string) => {
    onDeleteEvent(eventId);
  };

  // Timeline control handlers
  const handleMoveEventUp = (eventId: string) => {
    const updatedEvents = moveEventUp(eventId, relatedEvents);
    // Apply the updates
    updatedEvents.forEach((event) => {
      if (event.id !== eventId) {
        onUpdateEvent(event);
      }
    });
    const targetEvent = updatedEvents.find((e) => e.id === eventId);
    if (targetEvent) {
      onUpdateEvent(targetEvent);
    }
  };

  const handleMoveEventDown = (eventId: string) => {
    const updatedEvents = moveEventDown(eventId, relatedEvents);
    // Apply the updates
    updatedEvents.forEach((event) => {
      if (event.id !== eventId) {
        onUpdateEvent(event);
      }
    });
    const targetEvent = updatedEvents.find((e) => e.id === eventId);
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
      const newEvents = relatedEvents.filter((e) => e.targetId === localHotspot?.id);
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
    const event = relatedEvents.find((e) => e.id === eventId);









    if (isCurrentlyPreviewing) {
      // Remove from preview - hide overlay

      setPreviewingEventIds((prev) => prev.filter((id) => id !== eventId));
      onPreviewOverlay?.(null); // Hide overlay
    } else {
      // Add to preview - show overlay for this event

      setPreviewingEventIds((prev) => [...prev, eventId]);
      if (event) {
        onPreviewOverlay?.(event); // Show overlay for this event
      }
    }
  };


  // Debug the early return condition








  if (!isOpen || !localHotspot) {

    return null;
  }

  const localHotspotEvents = relatedEvents.filter((event) => event.targetId === localHotspot.id);
  const _activePreviewEventId = previewingEventIds[previewingEventIds.length - 1] || null;









  return (
    <DndProvider backend={HTML5Backend}>
      <>
        {/* Modern Fixed-Size Modal */}
        <div
          className={`
            fixed inset-0 ${Z_INDEX_TAILWIND.SYSTEM_MODAL} bg-black bg-opacity-50 flex items-center justify-center p-4
            transform transition-all duration-300 ease-out
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          onClick={editorActions.closeHotspotEditor}>
          
          <div
            className={`
              ${Z_INDEX_TAILWIND.SYSTEM_MODAL} bg-gray-800 text-white rounded-lg shadow-2xl
              w-full max-w-2xl h-[80vh] max-h-[600px] flex flex-col
              sm:w-full sm:max-w-2xl sm:h-[80vh] sm:max-h-[600px]
              max-sm:w-[95vw] max-sm:h-[90vh] max-sm:max-h-[90vh] max-sm:rounded-lg
              transform transition-all duration-300 ease-out
              ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
            `}
            onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <HotspotEditorToolbar
              title={localHotspot.title || `Edit Hotspot`}
              onTitleChange={(title) => setLocalHotspot((prev) => prev ? { ...prev, title } : null)}
              onSave={handleSave}
              onDelete={() => {
                if (window.confirm(`Are you sure you want to delete the hotspot "${localHotspot.title}"?`)) {
                  onDeleteHotspot(localHotspot.id);
                  editorActions.closeHotspotEditor();
                }
              }}
              onClose={editorActions.closeHotspotEditor}
            />
            
            {/* Modal Content - Tabbed Interface */}
            <div className="flex-grow flex flex-col overflow-hidden">
              <TabContainer
                defaultActiveTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                  {
                    id: 'hotspot',
                    label: 'Hotspot',
                    content: (
                      <div className="p-4 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                          <label htmlFor="display-hotspot-toggle" className="text-sm text-gray-300">
                            Display hotspot during event
                          </label>
                          <div
                            onClick={() =>
                              setLocalHotspot((prev) => prev ? { ...prev, displayHotspotInEvent: !prev.displayHotspotInEvent } : null)
                            }
                            id="display-hotspot-toggle"
                            className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors
                              ${localHotspot.displayHotspotInEvent ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <span
                              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform
                                ${localHotspot.displayHotspotInEvent ? 'translate-x-6' : 'translate-x-1'}`} />
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
                                title={preset.description}>
                                <div
                                  className="w-3 h-3 rounded-full border border-gray-400"
                                  style={{ backgroundColor: preset.style.color }} />
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
                                    setLocalHotspot((prev) => prev ? { ...prev, size: sizePreset.value } : null);
                                  }
                                }}
                                className={`px-3 py-2 rounded text-xs transition-colors ${
                                  localHotspot?.size === sizePreset.value ?
                                  'bg-purple-600 text-white' :
                                  'bg-gray-600 text-white hover:bg-gray-500'}`
                                }
                                title={sizePreset.description}>
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
                              setLocalHotspot((prev) => {
                                if (!prev) return null;
                                const newPulseAnimation = !prev.pulseAnimation;
                                return {
                                  ...prev,
                                  pulseAnimation: newPulseAnimation,
                                  ...(newPulseAnimation && !prev.pulseType && { pulseType: 'loop' as const })
                                };
                              })
                            }
                            id="pulse-animation-toggle"
                            className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
                              ${localHotspot.pulseAnimation ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <span
                              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform
                                ${localHotspot.pulseAnimation ? 'translate-x-6' : 'translate-x-1'}`} />
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
                                  setLocalHotspot((prev) => prev ? { ...prev, pulseType: 'loop' } : null)
                                }
                                className="mr-2" />
                              <label htmlFor="pulse-loop" className="text-sm text-gray-300">Loop</label>
                              <input
                                type="radio"
                                id="pulse-timed"
                                name="pulseType"
                                value="timed"
                                checked={localHotspot.pulseType === 'timed'}
                                onChange={() =>
                                  setLocalHotspot((prev) => prev ? { ...prev, pulseType: 'timed' } : null)
                                }
                                className="ml-4 mr-2" />
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
                              onChange={(e) => {
                                const newDuration = parseFloat(e.target.value);
                                setLocalHotspot((prev) => {
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
                              placeholder="Enter duration in seconds" />
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    id: 'interactions',
                    label: 'Interactions',
                    content: (
                      <div className="p-4 flex flex-col h-full">
                        {selectedInteractionId === 'new' ? (
                          <InteractionTypeSelectorGrid
                            onSelectType={handleInteractionTypeSelected}
                            onClose={() => setSelectedInteractionId(null)}
                          />
                        ) : (
                          <>
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
                                      moveCard={() => {}}
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
                          </>
                        )}
                      </div>
                    )
                  },
                  {
                    id: 'properties',
                    label: 'Properties',
                    content: (
                      <div className="p-4 overflow-y-auto">
                        <InteractionProperties
                          event={relatedEvents.find((e) => e.id === editingEventId) || null}
                          onUpdate={handleEventUpdate}
                        />
                      </div>
                    )
                  }
                ]}
              />
            </div>
          </div>
        </div>
      </>
    </DndProvider>);

};

export default HotspotEditorModal;