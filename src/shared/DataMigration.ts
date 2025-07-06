// src/shared/DataMigration.ts - Data migration utilities
import { TimelineEventData, InteractionType } from './types';

export class DataMigration {
  /**
   * Convert legacy timeline event to enhanced format
   * Maintains backward compatibility
   */
  static convertLegacyEvent(event: TimelineEventData): TimelineEventData {
    // Legacy event conversion - currently returns the event as-is
    // since the current TimelineEventData interface already supports all needed properties
    return {
      ...event,
      // Ensure required properties exist
      name: event.name || 'Legacy Event',
      step: event.step || 1,
      type: event.type || InteractionType.SHOW_HOTSPOT
    };
  }

  /**
   * Convert enhanced event back to legacy format for compatibility
   */
  static convertToLegacyEvent(event: TimelineEventData): TimelineEventData {
    // For backward compatibility, ensure all events have required legacy properties
    return {
      ...event,
      name: event.name || 'Legacy Event',
      step: event.step || 1,
      type: event.type || InteractionType.SHOW_HOTSPOT
    };
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