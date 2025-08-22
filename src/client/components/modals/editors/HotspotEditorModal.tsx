import React, { useState, useEffect, useRef } from 'react';
import { normalizeHotspotPosition } from '../../../../lib/safeMathUtils';
import { InteractionType } from '../../../../shared/InteractionPresets';
import { TimelineEventData } from '../../../../shared/type-defs';
import { HotspotData } from '../../../../shared/types';
import { UnifiedEditorState, EditorStateActions } from '../../../hooks/useUnifiedEditorState';
import { getNextTimelineStep, moveEventUp, moveEventDown } from '../../../utils/timelineUtils';
import { SaveIcon } from '../../icons/SaveIcon';
import { TrashIcon } from '../../icons/TrashIcon';
import { XMarkIcon } from '../../icons/XMarkIcon';
import EditorModalBase from './shared/EditorModalBase';
import HotspotEditorContent from './HotspotEditorContent';

interface EnhancedHotspotEditorModalProps {
  editorState: UnifiedEditorState;
  editorActions: EditorStateActions;
  selectedHotspot: HotspotData | null;
  relatedEvents: TimelineEventData[];
  onUpdateHotspot: (hotspot: HotspotData) => void;
  onDeleteHotspot: (hotspotId: string) => void;
  onAddEvent: (event: TimelineEventData) => void;
  onUpdateEvent: (event: TimelineEventData) => void;
  onDeleteEvent: (eventId: string) => void;
  allHotspots: HotspotData[];
  onPreviewOverlay?: (event: TimelineEventData | null) => void;
}

const HotspotEditorToolbar: React.FC<{
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = React.memo(({ title, onTitleChange, onSave, onDelete, onClose }) => (
  <div className="p-2 flex items-center justify-between bg-slate-900 border-b border-slate-700">
    <input
      type="text"
      value={title}
      onChange={(e) => onTitleChange(e.target.value)}
      className="bg-slate-700 text-xl font-bold p-1 rounded"
    />
    <div className="flex items-center space-x-2">
      <button onClick={onSave} className="p-2 bg-purple-600 rounded hover:bg-purple-700" title="Save & Close">
        <SaveIcon className="w-4 h-4" />
      </button>
      <button onClick={onDelete} className="p-2 bg-red-600 rounded hover:bg-red-700">
        <TrashIcon className="w-4 h-4" />
      </button>
      <button onClick={onClose} className="p-2 bg-slate-600 rounded hover:bg-slate-700">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  </div>
));
HotspotEditorToolbar.displayName = 'HotspotEditorToolbar';

const HotspotEditorModal: React.FC<EnhancedHotspotEditorModalProps> = ({
  editorState,
  editorActions,
  selectedHotspot,
  relatedEvents,
  onUpdateHotspot,
  onDeleteHotspot,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  allHotspots,
  onPreviewOverlay,
}) => {
  const eventIdCounter = useRef(0);
  const { isOpen } = editorState.hotspotEditor;
  const { isOpen: isSettingsModalOpen, editingEventId } = editorState.interactionEditor;

  const [localHotspot, setLocalHotspot] = useState(selectedHotspot);
  const [previewingEventIds, setPreviewingEventIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('hotspot');
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(null);
  const [pendingEventIdToOpen, setPendingEventIdToOpen] = useState<string | null>(null);

  useEffect(() => {
    setLocalHotspot(selectedHotspot);
    setPreviewingEventIds([]);
  }, [selectedHotspot]);

  // Handle opening editor for newly created events
  useEffect(() => {
    if (pendingEventIdToOpen && relatedEvents.some(e => e.id === pendingEventIdToOpen)) {
      editorActions.openInteractionEditor(pendingEventIdToOpen);
      setPendingEventIdToOpen(null);
    }
  }, [pendingEventIdToOpen, relatedEvents, editorActions]);

  const handleAddEvent = (type: InteractionType) => {
    if (!localHotspot) return;

    const newEvent: TimelineEventData = {
      id: `event_${++eventIdCounter.current}`,
      name: `New ${type.toLowerCase().replace('_', ' ')} event`,
      step: getNextTimelineStep(relatedEvents),
      type,
      targetId: localHotspot.id,
      ...(type === InteractionType.VIDEO && { videoDisplayMode: 'inline', videoShowControls: true, autoplay: false, loop: false }),
      ...(type === InteractionType.AUDIO && { audioUrl: '', audioDisplayMode: 'background', audioShowControls: false, autoplay: true, volume: 80 }),
      ...(type === InteractionType.TEXT && { textContent: 'Enter your text here', textPosition: 'center', textX: 50, textY: 50, textWidth: 300, textHeight: 100 }),
      ...(type === InteractionType.SPOTLIGHT && { spotlightShape: 'circle', spotlightX: localHotspot.x, spotlightY: localHotspot.y, spotlightWidth: 120, spotlightHeight: 120, backgroundDimPercentage: 70, spotlightOpacity: 0 }),
      ...(type === InteractionType.PAN_ZOOM && { targetX: localHotspot.x, targetY: localHotspot.y, zoomLevel: 2, smooth: true }),
      ...(type === InteractionType.QUIZ && { quizQuestion: 'Enter your question', quizOptions: ['Option 1', 'Option 2', 'Option 3'], quizCorrectAnswer: 0, quizExplanation: '' }),
    };
    onAddEvent(newEvent);
    setPreviewingEventIds((prev) => [...prev, newEvent.id]);
    onPreviewOverlay?.(newEvent);
  };

  const handleEventUpdate = (updatedEvent: TimelineEventData) => {
    onUpdateEvent(updatedEvent);
  };

  const handleEventDelete = (eventId: string) => {
    onDeleteEvent(eventId);
  };

  const handleMoveEventUp = (eventId: string) => {
    const sortedEvents = [...relatedEvents].sort((a, b) => a.step - b.step);
    const currentIndex = sortedEvents.findIndex(e => e.id === eventId);
    if (currentIndex > 0) {
      const currentEvent = sortedEvents[currentIndex];
      const previousEvent = sortedEvents[currentIndex - 1];
      if (currentEvent && previousEvent) {
        // Swap step numbers and update only the two affected events
        onUpdateEvent({ ...currentEvent, step: previousEvent.step });
        onUpdateEvent({ ...previousEvent, step: currentEvent.step });
      }
    }
  };

  const handleMoveEventDown = (eventId: string) => {
    const sortedEvents = [...relatedEvents].sort((a, b) => a.step - b.step);
    const currentIndex = sortedEvents.findIndex(e => e.id === eventId);
    if (currentIndex >= 0 && currentIndex < sortedEvents.length - 1) {
      const currentEvent = sortedEvents[currentIndex];
      const nextEvent = sortedEvents[currentIndex + 1];
      if (currentEvent && nextEvent) {
        // Swap step numbers and update only the two affected events
        onUpdateEvent({ ...currentEvent, step: nextEvent.step });
        onUpdateEvent({ ...nextEvent, step: currentEvent.step });
      }
    }
  };

  const handleInteractionTypeSelected = (type: InteractionType) => {
    if (!localHotspot) return;
    
    const newEventId = `event_${eventIdCounter.current + 1}`;
    setPendingEventIdToOpen(newEventId);
    setSelectedInteractionId(null);
    setActiveTab('properties');
    handleAddEvent(type);
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
      setPreviewingEventIds((prev) => prev.filter((id) => id !== eventId));
      onPreviewOverlay?.(null);
    } else {
      setPreviewingEventIds((prev) => [...prev, eventId]);
      if (event) {
        onPreviewOverlay?.(event);
      }
    }
  };

  if (!isOpen || !localHotspot) {
    return null;
  }

  const localHotspotEvents = relatedEvents.filter((event) => event.targetId === localHotspot.id);

  return (
    <EditorModalBase isOpen={isOpen} onClose={editorActions.closeHotspotEditor}>
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
      <div className="flex-grow flex flex-col overflow-hidden">
        <HotspotEditorContent
          localHotspot={localHotspot}
          setLocalHotspot={setLocalHotspot}
          onUpdateHotspot={onUpdateHotspot}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSettingsModalOpen={isSettingsModalOpen}
          editingEventId={editingEventId}
          relatedEvents={relatedEvents}
          handleEventUpdate={handleEventUpdate}
          closeInteractionEditor={editorActions.closeInteractionEditor}
          selectedInteractionId={selectedInteractionId}
          setSelectedInteractionId={setSelectedInteractionId}
          handleInteractionTypeSelected={handleInteractionTypeSelected}
          localHotspotEvents={localHotspotEvents}
          handleEventDelete={handleEventDelete}
          handleTogglePreview={handleTogglePreview}
          openInteractionEditor={(eventId) => {
            editorActions.openInteractionEditor(eventId);
            setActiveTab('properties');
          }}
          previewingEventIds={previewingEventIds}
          allHotspots={allHotspots}
          handleMoveEventUp={handleMoveEventUp}
          handleMoveEventDown={handleMoveEventDown}
        />
      </div>
    </EditorModalBase>
  );
};

export default HotspotEditorModal;
