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
   * Sanitize timeline event data to remove undefined values and ensure defaults
   * @param event - Timeline event to sanitize
   * @returns Sanitized timeline event with all fields present
   */
  static sanitizeTimelineEvent(event: Partial<TimelineEventData>): TimelineEventData {
    const sanitized = this.removeUndefinedFields(event) as Partial<TimelineEventData>;

    if (!sanitized.id || sanitized.step === undefined || !sanitized.type) {
      throw new Error(`TimelineEvent is missing required fields: ${JSON.stringify(event)}`);
    }

    // Return sanitized object with all fields present, providing defaults for optional fields
    return {
      id: sanitized.id,
      step: sanitized.step,
      name: sanitized.name || '',
      type: sanitized.type,
      targetId: sanitized.targetId,
      message: sanitized.message,
      duration: sanitized.duration,
      zoomFactor: sanitized.zoomFactor ?? 2,
      highlightRadius: sanitized.highlightRadius ?? 60,
      highlightShape: sanitized.highlightShape ?? 'circle',
      dimPercentage: sanitized.dimPercentage ?? 70,
      spotlightX: sanitized.spotlightX,
      spotlightY: sanitized.spotlightY,
      spotlightWidth: sanitized.spotlightWidth,
      spotlightHeight: sanitized.spotlightHeight,
      textContent: sanitized.textContent,
      textPosition: sanitized.textPosition,
      textX: sanitized.textX,
      textY: sanitized.textY,
      textWidth: sanitized.textWidth,
      textHeight: sanitized.textHeight,
      quizQuestion: sanitized.quizQuestion,
      quizOptions: sanitized.quizOptions,
      quizCorrectAnswer: sanitized.quizCorrectAnswer,
      quizExplanation: sanitized.quizExplanation,
      quizShuffleOptions: sanitized.quizShuffleOptions,
      mediaType: sanitized.mediaType,
      mediaUrl: sanitized.mediaUrl,
      imageUrl: sanitized.imageUrl,
      caption: sanitized.caption,
      zoomLevel: sanitized.zoomLevel,
      smooth: sanitized.smooth,
      radius: sanitized.radius,
      intensity: sanitized.intensity,
      audioUrl: sanitized.audioUrl,
      volume: sanitized.volume,
      videoUrl: sanitized.videoUrl,
      youtubeVideoId: sanitized.youtubeVideoId,
      youtubeStartTime: sanitized.youtubeStartTime,
      youtubeEndTime: sanitized.youtubeEndTime,
      autoplay: sanitized.autoplay,
      loop: sanitized.loop,
      poster: sanitized.poster,
      artist: sanitized.artist,
      shape: sanitized.shape,
      opacity: sanitized.opacity,
      position: sanitized.position,
      size: sanitized.size,
      targetX: sanitized.targetX,
      targetY: sanitized.targetY,
      zoom: sanitized.zoom,
      content: sanitized.content,
      modalPosition: sanitized.modalPosition,
      modalSize: sanitized.modalSize,
      url: sanitized.url,
      targetHotspotId: sanitized.targetHotspotId,
      question: sanitized.question,
      options: sanitized.options,
      correctAnswer: sanitized.correctAnswer,
      positioningVersion: sanitized.positioningVersion,
      constraintsApplied: sanitized.constraintsApplied,
    };
  }

  /**
   * Sanitize hotspot data to remove undefined values and ensure defaults
   * @param hotspot - Hotspot to sanitize
   * @returns Sanitized hotspot with all fields present
   */
  static sanitizeHotspot(hotspot: Partial<HotspotData>): HotspotData {
    const sanitized = this.removeUndefinedFields(hotspot) as Partial<HotspotData>;

    if (!sanitized.id || sanitized.x === undefined || sanitized.y === undefined) {
      throw new Error(`Hotspot is missing required fields: ${JSON.stringify(hotspot)}`);
    }

    // Return sanitized object with all fields present, providing defaults for optional fields
    return {
      id: sanitized.id,
      x: sanitized.x,
      y: sanitized.y,
      title: sanitized.title || '',
      description: sanitized.description || '',
      color: sanitized.color,
      backgroundColor: sanitized.backgroundColor,
      size: sanitized.size || 'medium',
      link: sanitized.link,
      displayHotspotInEvent: sanitized.displayHotspotInEvent || false,
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