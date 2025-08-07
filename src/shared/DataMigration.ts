// src/shared/DataMigration.ts - Data migration utilities
import { InteractionType } from './InteractionPresets';
import { TimelineEventData, InteractiveModuleState, HotspotData } from './types';

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
      type: event.type || InteractionType.SHOW_TEXT
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
      type: event.type || InteractionType.SHOW_TEXT
    };
  }

  /**
   * Safely migrate project data
   */
  static migrateProjectData(projectData: unknown): InteractiveModuleState {
    // Type guard to ensure we have the expected structure
    if (!projectData || typeof projectData !== 'object' || projectData === null) {
      throw new Error('Invalid project data: must be an object');
    }
    
    const data = projectData as Record<string, unknown>;
    
    if (!data['timelineEvents'] || !Array.isArray(data['timelineEvents'])) {
      throw new Error('Invalid project data: missing or invalid timelineEvents');
    }
    
    // Ensure we have a valid InteractiveModuleState structure
    const backgroundVideoType = (data['backgroundVideoType'] as any) === 'mp4' || (data['backgroundVideoType'] as any) === 'youtube'
        ? data['backgroundVideoType'] as 'mp4' | 'youtube'
        : null;

    const imageFitMode = ['cover', 'contain', 'fill'].includes(data['imageFitMode'] as any)
        ? data['imageFitMode'] as 'cover' | 'contain' | 'fill'
        : null;

    const viewerModes = typeof data['viewerModes'] === 'object' && data['viewerModes'] !== null
        ? data['viewerModes'] as InteractiveModuleState['viewerModes']
        : null;

    const migratedData: InteractiveModuleState = {
      hotspots: Array.isArray(data['hotspots']) ? data['hotspots'] as HotspotData[] : [],
      timelineEvents: data['timelineEvents'].map(this.convertLegacyEvent),
      ...(typeof data['backgroundImage'] === 'string' && { backgroundImage: data['backgroundImage'] }),
      backgroundType: (data['backgroundType'] as any) === 'video' ? 'video' : 'image',
      ...(backgroundVideoType && { backgroundVideoType }),
      ...(imageFitMode && { imageFitMode }),
      ...(viewerModes && { viewerModes })
    };
    
    return migratedData;
  }
}