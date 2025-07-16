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
  static migrateProjectData(projectData: unknown): InteractiveModuleState {
    // Type guard to ensure we have the expected structure
    if (!projectData || typeof projectData !== 'object' || projectData === null) {
      throw new Error('Invalid project data: must be an object');
    }
    
    const data = projectData as Record<string, unknown>;
    
    if (!data.timelineEvents || !Array.isArray(data.timelineEvents)) {
      throw new Error('Invalid project data: missing or invalid timelineEvents');
    }
    
    // Ensure we have a valid InteractiveModuleState structure
    const migratedData: InteractiveModuleState = {
      hotspots: Array.isArray(data.hotspots) ? data.hotspots as HotspotData[] : [],
      timelineEvents: data.timelineEvents.map(this.convertLegacyEvent),
      currentStep: typeof data.currentStep === 'number' ? data.currentStep : 0,
      backgroundImage: typeof data.backgroundImage === 'string' ? data.backgroundImage : null,
      // Add other required properties with defaults
      isEditing: false,
      isPlaying: false,
      isDragging: false,
      draggedHotspot: null,
      selectedHotspot: null,
      placementMode: false,
      pendingHotspotType: null,
      pendingHotspotData: null,
      imageTransform: { scale: 1, translateX: 0, translateY: 0 },
      isTransforming: false,
      autoPlay: false,
      previewMode: false,
      ...(data as Partial<InteractiveModuleState>)
    };
    
    return migratedData;
  }
}