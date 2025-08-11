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
import InteractionSettingsModal from './InteractionSettingsModal';
import InteractionTypeSelector, { AddInteractionButton } from './InteractionTypeSelector';
import PanZoomSettings from './PanZoomSettings';
import { PlusIcon } from './icons/PlusIcon';
import SpotlightSettings from './SpotlightSettings';
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

const inputClasses = "w-full bg-gray-700 p-2 rounded border border-gray-600 focus:ring-purple-500 focus:border-purple-500";
const labelClasses = "block text-sm font-medium text-gray-300 mb-1";

interface InteractionEditorProps {
  event: TimelineEventData;
  onUpdate: (updates: Partial<TimelineEventData>) => void;
}

const TextInteractionEditor: React.FC<InteractionEditorProps> = React.memo(({ event, onUpdate }) => {
    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="textContent" className={labelClasses}>Text Content</label>
                <textarea
                    id="textContent"
                    value={event.textContent || ''}
                    onChange={e => onUpdate({ textContent: e.target.value })}
                    className={`${inputClasses} min-h-[80px]`}
                    rows={4}
                />
            </div>
            <div>
                <label htmlFor="textPosition" className={labelClasses}>Position</label>
                <select
                    id="textPosition"
                    value={event.textPosition || 'center'}
                    onChange={e => onUpdate({ textPosition: e.target.value as 'center' | 'custom' })}
                    className={inputClasses}
                >
                    <option value="center">Center</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            {event.textPosition === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="textX" className={labelClasses}>X (%)</label>
                        <input
                            id="textX"
                            type="number"
                            value={event.textX || 50}
                            onChange={e => onUpdate({ textX: parseInt(e.target.value, 10) })}
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label htmlFor="textY" className={labelClasses}>Y (%)</label>
                        <input
                            id="textY"
                            type="number"
                            value={event.textY || 50}
                            onChange={e => onUpdate({ textY: parseInt(e.target.value, 10) })}
                            className={inputClasses}
                        />
                    </div>
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="textWidth" className={labelClasses}>Width (px)</label>
                    <input
                        id="textWidth"
                        type="number"
                        value={event.textWidth || 300}
                        onChange={e => onUpdate({ textWidth: parseInt(e.target.value, 10) })}
                        className={inputClasses}
                    />
                </div>
                <div>
                    <label htmlFor="textHeight" className={labelClasses}>Height (px)</label>
                    <input
                        id="textHeight"
                        type="number"
                        value={event.textHeight || 100}
                        onChange={e => onUpdate({ textHeight: parseInt(e.target.value, 10) })}
                        className={inputClasses}
                    />
                </div>
            </div>
        </div>
    );
});
TextInteractionEditor.displayName = 'TextInteractionEditor';

const AudioInteractionEditor: React.FC<InteractionEditorProps> = React.memo(({ event, onUpdate }) => {
    const checkboxLabelClasses = "flex items-center space-x-2 cursor-pointer text-sm text-gray-300";
    const checkboxInputClasses = "form-checkbox h-4 w-4 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500";

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="audioUrl" className={labelClasses}>Audio URL</label>
                <input
                    id="audioUrl"
                    type="text"
                    value={event.audioUrl || ''}
                    onChange={e => onUpdate({ audioUrl: e.target.value })}
                    className={inputClasses}
                    placeholder="https://example.com/audio.mp3"
                />
            </div>
            <div>
                <label htmlFor="audioDisplayMode" className={labelClasses}>Display Mode</label>
                <select
                    id="audioDisplayMode"
                    value={event.audioDisplayMode || 'background'}
                    onChange={e => onUpdate({ audioDisplayMode: e.target.value as 'background' | 'modal' | 'mini-player' })}
                    className={inputClasses}
                >
                    <option value="background">Background</option>
                    <option value="modal">Modal</option>
                    <option value="mini-player">Mini-Player</option>
                </select>
            </div>
            <div>
                <label htmlFor="volume" className={labelClasses}>Volume</label>
                <input
                    id="volume"
                    type="range"
                    min="0"
                    max="100"
                    value={event.volume === undefined ? 80 : event.volume}
                    onChange={e => onUpdate({ volume: parseInt(e.target.value, 10) })}
                    className="w-full"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.audioShowControls}
                        onChange={e => onUpdate({ audioShowControls: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Show Controls</span>
                </label>
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.autoplay}
                        onChange={e => onUpdate({ autoplay: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Autoplay</span>
                </label>
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.loop}
                        onChange={e => onUpdate({ loop: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Loop</span>
                </label>
            </div>
        </div>
    );
});
AudioInteractionEditor.displayName = 'AudioInteractionEditor';

const VideoInteractionEditor: React.FC<InteractionEditorProps> = React.memo(({ event, onUpdate }) => {
    const checkboxLabelClasses = "flex items-center space-x-2 cursor-pointer text-sm text-gray-300";
    const checkboxInputClasses = "form-checkbox h-4 w-4 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500";

    const isYouTube = event.videoSource === 'youtube';

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="videoSource" className={labelClasses}>Video Source</label>
                <select
                    id="videoSource"
                    value={event.videoSource || 'url'}
                    onChange={e => {
                        const newSource = e.target.value as 'url' | 'youtube';
                        onUpdate({ videoSource: newSource, videoUrl: '', youtubeVideoId: '' });
                    }}
                    className={inputClasses}
                >
                    <option value="url">URL</option>
                    <option value="youtube">YouTube</option>
                </select>
            </div>

            {isYouTube ? (
                <div>
                    <label htmlFor="youtubeVideoId" className={labelClasses}>YouTube Video ID</label>
                    <input
                        id="youtubeVideoId"
                        type="text"
                        value={event.youtubeVideoId || ''}
                        onChange={e => onUpdate({ youtubeVideoId: e.target.value })}
                        className={inputClasses}
                        placeholder="e.g. dQw4w9WgXcQ"
                    />
                </div>
            ) : (
                <div>
                    <label htmlFor="videoUrl" className={labelClasses}>Video URL</label>
                    <input
                        id="videoUrl"
                        type="text"
                        value={event.videoUrl || ''}
                        onChange={e => onUpdate({ videoUrl: e.target.value })}
                        className={inputClasses}
                        placeholder="https://example.com/video.mp4"
                    />
                </div>
            )}

            <div>
                <label htmlFor="videoDisplayMode" className={labelClasses}>Display Mode</label>
                <select
                    id="videoDisplayMode"
                    value={event.videoDisplayMode || 'inline'}
                    onChange={e => onUpdate({ videoDisplayMode: e.target.value as 'inline' | 'modal' | 'overlay' })}
                    className={inputClasses}
                >
                    <option value="inline">Inline</option>
                    <option value="modal">Modal</option>
                    <option value="overlay">Overlay</option>
                </select>
            </div>

            {isYouTube && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="youtubeStartTime" className={labelClasses}>Start Time (s)</label>
                        <input
                            id="youtubeStartTime"
                            type="number"
                            value={event.youtubeStartTime || ''}
                            onChange={e => {
                              const startTimeValue = e.target.value;
                              if (startTimeValue) {
                                const numValue = parseInt(startTimeValue, 10);
                                if (!isNaN(numValue)) {
                                  onUpdate({ youtubeStartTime: numValue });
                                }
                              } else {
                                onUpdate({ youtubeStartTime: null });
                              }
                            }}
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label htmlFor="youtubeEndTime" className={labelClasses}>End Time (s)</label>
                        <input
                            id="youtubeEndTime"
                            type="number"
                            value={event.youtubeEndTime || ''}
                            onChange={e => {
                              const endTimeValue = e.target.value;
                              if (endTimeValue) {
                                const numValue = parseInt(endTimeValue, 10);
                                if (!isNaN(numValue)) {
                                  onUpdate({ youtubeEndTime: numValue });
                                }
                              } else {
                                onUpdate({ youtubeEndTime: null });
                              }
                            }}
                            className={inputClasses}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.videoShowControls}
                        onChange={e => onUpdate({ videoShowControls: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Show Controls</span>
                </label>
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.autoplay}
                        onChange={e => onUpdate({ autoplay: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Autoplay</span>
                </label>
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.loop}
                        onChange={e => onUpdate({ loop: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Loop</span>
                </label>
            </div>
        </div>
    );
});
VideoInteractionEditor.displayName = 'VideoInteractionEditor';

const QuizInteractionEditor: React.FC<InteractionEditorProps> = React.memo(({ event, onUpdate }) => {
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...(event.quizOptions || [])];
        newOptions[index] = value;
        onUpdate({ quizOptions: newOptions });
    };

    const handleAddOption = () => {
        const newOptions = [...(event.quizOptions || []), `New Option ${(event.quizOptions?.length || 0) + 1}`];
        onUpdate({ quizOptions: newOptions });
    };

    const handleDeleteOption = (index: number) => {
        const newOptions = [...(event.quizOptions || [])];
        newOptions.splice(index, 1);
        onUpdate({ quizOptions: newOptions });
    };

    const handleCorrectAnswerChange = (index: number) => {
        onUpdate({ quizCorrectAnswer: index });
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="quizQuestion" className={labelClasses}>Question</label>
                <input
                    id="quizQuestion"
                    type="text"
                    value={event.quizQuestion || ''}
                    onChange={e => onUpdate({ quizQuestion: e.target.value })}
                    className={inputClasses}
                />
            </div>

            <div>
                <label className={labelClasses}>Options</label>
                <div className="space-y-2">
                    {(event.quizOptions || []).map((option, index) => (
                        <div key={`quiz-option-${index}-${option.length}-${option.charAt(0) || 'empty'}-${option.slice(-3)}`} className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="correctAnswer"
                                checked={event.quizCorrectAnswer === index}
                                onChange={() => handleCorrectAnswerChange(index)}
                                className="form-radio h-4 w-4 text-purple-600 bg-slate-600 border-slate-500"
                            />
                            <input
                                type="text"
                                value={option}
                                onChange={e => handleOptionChange(index, e.target.value)}
                                className={inputClasses}
                            />
                            <button onClick={() => handleDeleteOption(index)} className="p-1 text-red-500 hover:text-red-400">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddOption} className="mt-2 text-sm text-purple-400 hover:text-purple-300 flex items-center">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Option
                </button>
            </div>

            <div>
                <label htmlFor="quizExplanation" className={labelClasses}>Explanation (optional)</label>
                <textarea
                    id="quizExplanation"
                    value={event.quizExplanation || ''}
                    onChange={e => onUpdate({ quizExplanation: e.target.value })}
                    className={`${inputClasses} min-h-[60px]`}
                    rows={3}
                    placeholder="Explain why the correct answer is right."
                />
            </div>
        </div>
    );
});
QuizInteractionEditor.displayName = 'QuizInteractionEditor';


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
  const { isOpen: isSettingsModalOpen, editingEventId } = editorState.interactionEditor;

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

  const handlePartialEventUpdate = (updates: Partial<TimelineEventData>) => {
    const { editingEventId } = editorState.interactionEditor;
    const event = relatedEvents.find((e) => e.id === editingEventId);
    if (event) {
      onUpdateEvent({ ...event, ...updates });
    }
  };

  const renderEditorForEvent = (event: TimelineEventData) => {
    switch (event.type) {
      case InteractionType.PAN_ZOOM:
        return (
          <PanZoomSettings
            zoomLevel={event.zoomLevel || 2}
            onZoomChange={(zoom) => handlePartialEventUpdate({ zoomLevel: zoom })}
            showTextBanner={!!event.showTextBanner}
            onShowTextBannerChange={(value) => handlePartialEventUpdate({ showTextBanner: value })}
          />
        );
      case InteractionType.SPOTLIGHT:
        return (
          <SpotlightSettings
            shape={event.spotlightShape || 'circle'}
            onShapeChange={(shape) => handlePartialEventUpdate({ spotlightShape: shape })}
            dimPercentage={event.backgroundDimPercentage || 70}
            onDimPercentageChange={(dim) => handlePartialEventUpdate({ backgroundDimPercentage: dim })}
            showTextBanner={event.showTextBanner || false}
            onShowTextBannerChange={(value) => handlePartialEventUpdate({ showTextBanner: value })}
          />
        );
      case InteractionType.TEXT:
        return <TextInteractionEditor event={event} onUpdate={handlePartialEventUpdate} />;
      case InteractionType.AUDIO:
        return <AudioInteractionEditor event={event} onUpdate={handlePartialEventUpdate} />;
      case InteractionType.VIDEO:
        return <VideoInteractionEditor event={event} onUpdate={handlePartialEventUpdate} />;
      case InteractionType.QUIZ:
        return <QuizInteractionEditor event={event} onUpdate={handlePartialEventUpdate} />;
      default:
        return <div className="text-center py-4 text-gray-400">No specific editor available for this interaction type.</div>;
    }
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
                                  canMoveDown={canMoveDown(event.id, localHotspotEvents)} />
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
                      <div className="p-4 overflow-y-auto h-full">
                        {editingEventId ? (
                          (() => {
                            const event = relatedEvents.find((e) => e.id === editingEventId);
                            if (!event) {
                              return (
                                <div className="text-center text-gray-400 py-8">
                                  Could not find the selected event.
                                </div>
                              );
                            }
                            return (
                              <div className="text-gray-300">
                                <h3 className="text-lg font-semibold mb-4">
                                  Edit: {event.name}
                                </h3>
                                {renderEditorForEvent(event)}
                              </div>
                            );
                          })()
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
          </div>
        </div>
      {/* InteractionTypeSelector Modal - Render conditionally */}
      {selectedInteractionId === 'new' &&
        <div className={`fixed inset-0 ${Z_INDEX_TAILWIND.NESTED_MODAL} bg-black bg-opacity-50`} onClick={() => setSelectedInteractionId(null)}>
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${Z_INDEX_TAILWIND.NESTED_MODAL}`} onClick={(e) => e.stopPropagation()}>
            <InteractionTypeSelector
              onSelectType={handleInteractionTypeSelected}
              onClose={() => setSelectedInteractionId(null)} />

          </div>
        </div>
        }
      </>
    </DndProvider>);

};

export default HotspotEditorModal;