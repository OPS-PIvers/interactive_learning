import { TimelineEventData, HotspotData } from '../shared/types';

/**
 * Data sanitization utility to remove undefined values before Firebase operations
 * Firebase WriteBatch.set() doesn't accept undefined values, so we need to filter them out
 */
export class DataSanitizer {
  /**
   * Remove undefined fields from an object
   * @param obj - Object to sanitize
   * @returns New object with undefined fields removed
   */
  private static removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
    const sanitized: Partial<T> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key as keyof T] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize timeline event data to remove undefined values
   * @param event - Timeline event to sanitize
   * @returns Sanitized timeline event with undefined fields removed
   */
  static sanitizeTimelineEvent(event: TimelineEventData): Partial<TimelineEventData> {
    const sanitized = this.removeUndefinedFields(event);
    
    // Ensure required fields are present with defaults if needed
    return {
      ...sanitized, // Spread sanitized first to prevent undefined override
      id: event.id,
      step: event.step,
      name: event.name || '',
      type: event.type
    };
  }

  /**
   * Sanitize hotspot data to remove undefined values
   * @param hotspot - Hotspot to sanitize
   * @returns Sanitized hotspot with undefined fields removed
   */
  static sanitizeHotspot(hotspot: HotspotData): Partial<HotspotData> {
    const sanitized = this.removeUndefinedFields(hotspot);
    
    // Ensure required fields are present with defaults if needed
    return {
      ...sanitized, // Spread sanitized first to prevent undefined override
      id: hotspot.id,
      x: hotspot.x,
      y: hotspot.y,
      title: hotspot.title || '',
      description: hotspot.description || ''
    };
  }

  /**
   * Sanitize an array of timeline events
   * @param events - Array of timeline events to sanitize
   * @returns Array of sanitized timeline events
   */
  static sanitizeTimelineEvents(events: TimelineEventData[]): Partial<TimelineEventData>[] {
    return events.map(event => this.sanitizeTimelineEvent(event));
  }

  /**
   * Sanitize an array of hotspots
   * @param hotspots - Array of hotspots to sanitize
   * @returns Array of sanitized hotspots
   */
  static sanitizeHotspots(hotspots: HotspotData[]): Partial<HotspotData>[] {
    return hotspots.map(hotspot => this.sanitizeHotspot(hotspot));
  }

  /**
   * Generic object sanitizer for any object that might contain undefined values
   * @param obj - Object to sanitize
   * @returns Sanitized object with undefined fields removed
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): Partial<T> {
    return this.removeUndefinedFields(obj);
  }
}