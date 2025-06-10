// src/client/components/EnhancedTimelineEventModal.tsx - NEW FILE
import React, { useState, useEffect } from 'react';
import { TimelineEventData, InteractionData, InteractionType, HotspotData } from '../../shared/types';
import { interactionPresets } from '../../shared/InteractionPresets';

export interface EnhancedTimelineEventModalProps {
  isOpen: boolean;
  event?: TimelineEventData;
  hotspots: HotspotData[];
  onSave: (event: TimelineEventData) => void;
  onClose: () => void;
  availableInteractionTypes: InteractionType[]; // To control which interactions can be added
}

const EnhancedTimelineEventModal: React.FC<EnhancedTimelineEventModalProps> = ({
  isOpen,
  event,
  hotspots,
  onSave,
  onClose,
  availableInteractionTypes,
}) => {
  const [editingEvent, setEditingEvent] = useState<TimelineEventData>(() => {
    if (event) {
      // If event.interactions exists and is not empty, use it directly
      if (event.interactions && event.interactions.length > 0) {
        return { ...event };
      }
      // Convert legacy properties to new interactions structure
      const newInteractions: InteractionData[] = [];
      const baseId = event.id || `event-${Date.now()}`;

      switch (event.type) {
        case InteractionType.SHOW_MESSAGE:
          if (event.message) {
            newInteractions.push({
              id: `${baseId}-interaction-0`,
              type: InteractionType.SHOW_TEXT, // Map to new type
              content: event.message,
            });
          }
          break;
        case InteractionType.PAN_ZOOM_TO_HOTSPOT:
          newInteractions.push({
            id: `${baseId}-interaction-0`,
            type: InteractionType.PAN_ZOOM, // Map to new type
            zoomLevel: event.zoomFactor || 2, // Default zoomFactor
            // Assuming targetId is the hotspot ID for pan/zoom target
          });
          break;
        case InteractionType.HIGHLIGHT_HOTSPOT:
          newInteractions.push({
            id: `${baseId}-interaction-0`,
            type: InteractionType.SPOTLIGHT, // Map to new type
            radius: event.highlightRadius || 60, // Default highlightRadius
            // Assuming targetId is the hotspot ID for spotlight target
          });
          break;
        // For other legacy types like SHOW_HOTSPOT, HIDE_HOTSPOT, PULSE_HOTSPOT,
        // they might not directly map to new interactions with specific data fields
        // or they are primarily action-based.
        // For now, we'll keep them as is or decide on a specific mapping if needed.
        // For example, PULSE_HOTSPOT could map to PULSE_HIGHLIGHT if a target is implied.
        default:
          // If it's a type that doesn't have specific legacy fields to convert,
          // or it's already a new type (though caught by interactions check),
          // we might just add a placeholder or leave interactions empty.
          // For this example, we add a generic interaction if the type is known.
          if (Object.values(InteractionType).includes(event.type)) {
             newInteractions.push({
                id: `${baseId}-interaction-0`,
                type: event.type, // Use original type if no direct mapping
                duration: event.duration, // Preserve duration if any
             });
          }
          break;
      }
      return { ...event, interactions: newInteractions };
    }
    // Default new event structure
    const defaultId = `event-${Date.now()}`;
    return {
      id: defaultId,
      step: 0, // Or calculate based on existing events
      name: 'New Event',
      type: availableInteractionTypes[0] || InteractionType.SHOW_TEXT, // Default to first available or SHOW_TEXT
      interactions: [
        {
          id: `${defaultId}-interaction-0`,
          type: availableInteractionTypes[0] || InteractionType.SHOW_TEXT,
          // Initialize with default fields for the type if necessary
        },
      ],
    };
  });

  useEffect(() => {
    // Re-initialize state if the event prop changes (e.g., when selecting a different event to edit)
    if (event) {
      if (event.interactions && event.interactions.length > 0) {
        setEditingEvent({ ...event });
      } else {
        // Apply legacy conversion logic similar to initial state
        const newInteractions: InteractionData[] = [];
        const baseId = event.id || `event-${Date.now()}`;
        switch (event.type) {
          case InteractionType.SHOW_MESSAGE:
            if (event.message) newInteractions.push({ id: `${baseId}-interaction-0`, type: InteractionType.SHOW_TEXT, content: event.message });
            break;
          case InteractionType.PAN_ZOOM_TO_HOTSPOT:
            newInteractions.push({ id: `${baseId}-interaction-0`, type: InteractionType.PAN_ZOOM, zoomLevel: event.zoomFactor || 2 });
            break;
          case InteractionType.HIGHLIGHT_HOTSPOT:
            newInteractions.push({ id: `${baseId}-interaction-0`, type: InteractionType.SPOTLIGHT, radius: event.highlightRadius || 60 });
            break;
          default:
            if (Object.values(InteractionType).includes(event.type)) {
                newInteractions.push({ id: `${baseId}-interaction-0`, type: event.type, duration: event.duration });
            }
            break;
        }
        setEditingEvent({ ...event, interactions: newInteractions });
      }
    } else {
      // Default for new event
      const defaultId = `event-${Date.now()}`;
      setEditingEvent({
        id: defaultId,
        step: 0,
        name: 'New Event',
        type: availableInteractionTypes[0] || InteractionType.SHOW_TEXT,
        interactions: [{ id: `${defaultId}-interaction-0`, type: availableInteractionTypes[0] || InteractionType.SHOW_TEXT }],
      });
    }
  }, [event, availableInteractionTypes]);


  const handleSave = () => {
    let eventToSave = { ...editingEvent };

    // Backward compatibility: Set legacy fields if primary interaction maps to a legacy type
    if (eventToSave.interactions && eventToSave.interactions.length > 0) {
      const primaryInteraction = eventToSave.interactions[0];
      eventToSave.type = primaryInteraction.type; // Always update event type to primary interaction type

      switch (primaryInteraction.type) {
        case InteractionType.SHOW_TEXT:
          eventToSave.type = InteractionType.SHOW_MESSAGE; // Map back to legacy type
          eventToSave.message = primaryInteraction.content;
          delete primaryInteraction.content; // Clean up to avoid data duplication if desired
          break;
        case InteractionType.PAN_ZOOM:
          eventToSave.type = InteractionType.PAN_ZOOM_TO_HOTSPOT; // Map back to legacy type
          eventToSave.zoomFactor = primaryInteraction.zoomLevel;
          // targetId would need to be handled based on UI selection
          delete primaryInteraction.zoomLevel;
          break;
        case InteractionType.SPOTLIGHT:
          eventToSave.type = InteractionType.HIGHLIGHT_HOTSPOT; // Map back to legacy type
          eventToSave.highlightRadius = primaryInteraction.radius;
          // targetId would need to be handled
          delete primaryInteraction.radius;
          break;
        // Other new types might not have direct legacy equivalents or fields
        // For PULSE_HIGHLIGHT -> PULSE_HOTSPOT, duration is already on TimelineEventData
        case InteractionType.PULSE_HIGHLIGHT:
            eventToSave.type = InteractionType.PULSE_HOTSPOT;
            eventToSave.duration = primaryInteraction.duration; // Ensure duration is set on event
            break;
        // SHOW_IMAGE, QUIZ, PLAY_AUDIO don't have direct simple legacy type mappings
        // for the main TimelineEventData.type field other than their own new types.
        // So, eventToSave.type will be SHOW_IMAGE, QUIZ, PLAY_AUDIO respectively.
      }
    } else if (!eventToSave.interactions || eventToSave.interactions.length === 0) {
        // If there are no interactions, ensure the event type reflects this,
        // or default to a sensible base type.
        // This case might need specific handling based on product requirements.
        // For now, we'll keep the event's original type or the primary interaction's type if set.
    }


    onSave(eventToSave);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '500px' }}>
        <h2>Enhanced Event Editor</h2>
        <p>Editing Event: {editingEvent.name}</p>

        {/* Placeholder for general event settings (name, target hotspot, etc.) */}
        <div>
          <label>Event Name: </label>
          <input
            type="text"
            value={editingEvent.name}
            onChange={(e) => setEditingEvent({...editingEvent, name: e.target.value})}
            style={{marginBottom: '10px', width: '100%', padding: '8px'}}
          />
        </div>

        {/* Placeholder for selecting target hotspot (if applicable) */}
        {/* This would depend on the interaction types */}
        {editingEvent.targetId !== undefined && (
            <div>
                <label>Target Hotspot: </label>
                <select
                    value={editingEvent.targetId || ''}
                    onChange={(e) => setEditingEvent({...editingEvent, targetId: e.target.value || undefined })}
                    style={{marginBottom: '10px', width: '100%', padding: '8px'}}
                >
                    <option value="">None</option>
                    {hotspots.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
                </select>
            </div>
        )}


        {/* Placeholder for Interaction Cards */}
        <div style={{ border: '1px dashed #ccc', padding: '10px', margin: '10px 0' }}>
          <p>Interaction Cards Area</p>
          {editingEvent.interactions?.map((interaction, index) => (
            <div key={interaction.id || index} style={{border: '1px solid #eee', padding: '8px', margin: '5px 0'}}>
                <p>Interaction Type: {interactionPresets[interaction.type]?.name || interaction.type}</p>
                {/* Further UI for each interaction type will go here */}
            </div>
          ))}
          <button>+ Add Interaction</button>
        </div>

        {/* Placeholder for Action Buttons */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ marginRight: '10px' }}>Cancel</button>
          <button onClick={handleSave}>Save Event</button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTimelineEventModal;
