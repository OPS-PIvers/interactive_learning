// src/shared/DataMigration.ts - NEW FILE
import { TimelineEventData, InteractionType, InteractionData } from './types';

export class DataMigration {
  /**
   * Convert legacy timeline event to enhanced format
   * Maintains backward compatibility
   */
  static convertLegacyEvent(event: TimelineEventData): TimelineEventData {
    // If already has interactions, return as-is
    if (event.interactions && event.interactions.length > 0) {
      return event;
    }

    const interactions: InteractionData[] = [];
    const newId = `migrated_${event.id || ''}_${Date.now()}`;

    // Convert based on legacy type
    switch (event.type) {
      case InteractionType.SHOW_MESSAGE:
        if (event.message) {
          interactions.push({
            id: newId,
            type: InteractionType.SHOW_TEXT,
            content: event.message
          });
        }
        break;

      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        interactions.push({
          id: newId,
          type: InteractionType.PAN_ZOOM,
          zoomLevel: event.zoomFactor || 2, // Default zoomFactor if undefined
          smooth: true
        });
        break;

      case InteractionType.HIGHLIGHT_HOTSPOT:
        interactions.push({
          id: newId,
          type: InteractionType.SPOTLIGHT,
          radius: event.highlightRadius || 60, // Default highlightRadius
          intensity: 0.7
        });
        break;

      case InteractionType.PULSE_HOTSPOT:
        interactions.push({
          id: newId,
          type: InteractionType.PULSE_HIGHLIGHT,
          duration: event.duration ? event.duration / 1000 : 2, // Convert ms to seconds, default 2s
          intensity: 1
        });
        break;

      // For other legacy types that don't have a direct new counterpart
      // or don't carry extra data for the new interaction model,
      // we might not create a new interaction, or create a placeholder.
      // For now, only converting those explicitly mentioned.
      default:
        // If it's a type that doesn't map directly, we can choose to:
        // 1. Not create an interaction (interaction array remains empty)
        // 2. Create a generic interaction if applicable
        // 3. Keep the original type if no suitable new type exists.
        // For this implementation, if no specific conversion is defined,
        // the interactions array will remain empty, and the original event type is kept.
        break;
    }

    return {
      ...event,
      interactions
    };
  }

  /**
   * Convert enhanced event back to legacy format for compatibility
   */
  static convertToLegacyEvent(event: TimelineEventData): TimelineEventData {
    if (!event.interactions || event.interactions.length === 0) {
      // If no interactions, it might be an original legacy event or an event that doesn't use interactions.
      return event;
    }

    // Take the first interaction as primary for legacy compatibility
    const primaryInteraction = event.interactions[0];

    // Start with a copy of the event, then override specific legacy fields
    const legacyEvent: TimelineEventData = {
      ...event,
      // Clear out new fields that don't have a direct legacy equivalent
      // or set them based on the primary interaction.
      // The original 'type' will be overridden by legacy type based on primaryInteraction.
    };

    switch (primaryInteraction.type) {
      case InteractionType.SHOW_TEXT:
        legacyEvent.type = InteractionType.SHOW_MESSAGE;
        legacyEvent.message = primaryInteraction.content;
        break;

      case InteractionType.PAN_ZOOM:
        legacyEvent.type = InteractionType.PAN_ZOOM_TO_HOTSPOT;
        legacyEvent.zoomFactor = primaryInteraction.zoomLevel;
        break;

      case InteractionType.SPOTLIGHT:
        legacyEvent.type = InteractionType.HIGHLIGHT_HOTSPOT;
        legacyEvent.highlightRadius = primaryInteraction.radius;
        break;

      case InteractionType.PULSE_HIGHLIGHT:
        legacyEvent.type = InteractionType.PULSE_HOTSPOT;
        // Ensure duration is defined before attempting multiplication
        legacyEvent.duration = (primaryInteraction.duration || 2) * 1000; // Convert to ms, default 2s
        break;

      // For new types that don't map back to a specific legacy type,
      // we might set a generic legacy type or the original type from the new system if it exists in legacy.
      // Example: If QUIZ has no legacy equivalent, what should event.type be?
      // For now, only converting those explicitly mentioned. If no mapping,
      // the event.type might remain the new type or a default.
      default:
        // If the primary interaction's type is one of the original legacy types,
        // we can set the event.type to that.
        if (Object.values(InteractionType).includes(primaryInteraction.type)) {
             // Check if it's one of the original enum values
            const legacyTypes = [
                InteractionType.SHOW_HOTSPOT,
                InteractionType.HIDE_HOTSPOT,
                InteractionType.PULSE_HOTSPOT,
                InteractionType.SHOW_MESSAGE,
                InteractionType.PAN_ZOOM_TO_HOTSPOT,
                InteractionType.HIGHLIGHT_HOTSPOT
            ];
            if (legacyTypes.includes(primaryInteraction.type as any)) {
                 legacyEvent.type = primaryInteraction.type;
            } else {
                // Fallback for new types not mapping to specific legacy ones.
                // Could set to a generic type or leave as is if the consumer can handle it.
                // For this implementation, we'll leave the type as the new type if no direct mapping.
                 legacyEvent.type = primaryInteraction.type; // Keep the new type
            }
        }
        break;
    }

    // Remove the interactions array for true legacy representation,
    // or keep it if systems might use it optionally. The issue implies legacy
    // systems won't know about 'interactions'.
    // delete legacyEvent.interactions; // Optional: depending on how strictly "legacy" it needs to be.
    // Given backward compatibility, it might be safer to keep it unless it causes issues.
    // For now, let's assume we keep event.interactions for flexibility, but legacy fields are primary.

    return legacyEvent;
  }

  /**
   * Safely migrate project data
   */
  static migrateProjectData(projectData: any): any {
    if (!projectData || !projectData.timelineEvents || !Array.isArray(projectData.timelineEvents)) {
      // Return original data if it's not in the expected format
      return projectData;
    }
    return {
      ...projectData,
      timelineEvents: projectData.timelineEvents.map(this.convertLegacyEvent)
    };
  }
}
