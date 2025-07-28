import { TimelineEventData, HotspotData } from '../shared/types';
import { SlideDeck, InteractiveSlide, SlideElement, ResponsivePosition, FixedPosition } from '../shared/slideTypes';

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
   * Sanitize timeline event data to remove undefined values (Enhanced version)
   * @param event - Timeline event to sanitize
   * @returns Sanitized timeline event with undefined fields removed
   */
  static sanitizeTimelineEvent(event: Partial<TimelineEventData>): Partial<TimelineEventData> {
    const sanitized = this.removeUndefinedFields(event);

    // Enhanced validation with detailed error context
    const missingFields: string[] = [];
    if (!sanitized.id) missingFields.push('id');
    if (sanitized.step === undefined) missingFields.push('step');
    if (!sanitized.type) missingFields.push('type');

    if (missingFields.length > 0) {
      throw new Error(`TimelineEvent validation failed - missing required fields: ${missingFields.join(', ')}. Event data: ${JSON.stringify(event)}`);
    }

    // Enhanced defaults with validation
    const defaults = {
      name: '',
      zoomFactor: Math.max(1, Math.min(10, sanitized.zoomFactor || 2)), // Clamp between 1-10
      highlightRadius: Math.max(10, Math.min(200, sanitized.highlightRadius || 60)), // Clamp between 10-200
      highlightShape: (['circle', 'square', 'rectangle'].includes(sanitized.highlightShape as string) ? sanitized.highlightShape : 'circle') as const,
      dimPercentage: Math.max(0, Math.min(100, sanitized.dimPercentage || 70)), // Clamp between 0-100
    }

    // Return sanitized object with validated required fields
    return {
      ...defaults,
      ...sanitized,
      // Ensure step is a valid number
      step: Math.max(0, sanitized.step || 0)
    };
  }

  /**
   * Sanitize hotspot data to remove undefined values (Enhanced version)
   * @param hotspot - Hotspot to sanitize
   * @returns Sanitized hotspot with undefined fields removed
   */
  static sanitizeHotspot(hotspot: Partial<HotspotData>): Partial<HotspotData> {
    const sanitized = this.removeUndefinedFields(hotspot);

    // Enhanced validation with detailed error context
    const missingFields: string[] = [];
    if (!sanitized.id) missingFields.push('id');
    if (sanitized.x === undefined) missingFields.push('x');
    if (sanitized.y === undefined) missingFields.push('y');

    if (missingFields.length > 0) {
      throw new Error(`Hotspot validation failed - missing required fields: ${missingFields.join(', ')}. Hotspot data: ${JSON.stringify(hotspot)}`);
    }

    // Enhanced defaults with validation
    const defaults = {
      title: '',
      description: '',
      size: (['small', 'medium', 'large'].includes(sanitized.size as string) ? sanitized.size : 'medium') as const,
      displayHotspotInEvent: Boolean(sanitized.displayHotspotInEvent),
    };

    // Return sanitized object with validated coordinates
    return {
      ...defaults,
      ...sanitized,
      // Ensure coordinates are valid numbers
      x: Math.max(0, sanitized.x || 0),
      y: Math.max(0, sanitized.y || 0)
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

  /**
   * Validate and sanitize slide deck data
   * @param slideDeck - Slide deck to validate
   * @returns Sanitized slide deck with validation errors if any
   */
  static sanitizeSlideDeck(slideDeck: Partial<SlideDeck>): { sanitized: Partial<SlideDeck>; errors: string[] } {
    const errors: string[] = [];
    
    // Validate required fields
    if (!slideDeck.id) {
      errors.push('SlideDeck is missing required field: id');
    }
    if (!slideDeck.title) {
      errors.push('SlideDeck is missing required field: title');
    }
    if (!slideDeck.slides) {
      errors.push('SlideDeck is missing required field: slides');
    }
    
    const sanitized = this.removeUndefinedFields(slideDeck);
    
    // Sanitize slides array
    if (sanitized.slides && Array.isArray(sanitized.slides)) {
      const slideResults = sanitized.slides.map((slide, index) => {
        const slideResult = this.sanitizeSlide(slide);
        slideResult.errors.forEach(error => 
          errors.push(`Slide ${index + 1}: ${error}`)
        );
        return slideResult.sanitized;
      });
      sanitized.slides = slideResults as InteractiveSlide[];
    }
    
    // Ensure metadata exists with proper structure
    if (!sanitized.metadata) {
      sanitized.metadata = {
        version: '2.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      sanitized.metadata = {
        version: sanitized.metadata.version || '2.0',
        createdAt: sanitized.metadata.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString() // Always update timestamp
      };
    }
    
    return { sanitized, errors };
  }

  /**
   * Validate and sanitize individual slide data
   * @param slide - Slide to validate
   * @returns Sanitized slide with validation errors if any
   */
  static sanitizeSlide(slide: Partial<InteractiveSlide>): { sanitized: Partial<InteractiveSlide>; errors: string[] } {
    const errors: string[] = [];
    
    // Validate required fields
    if (!slide.id) {
      errors.push('InteractiveSlide is missing required field: id');
    }
    if (!slide.title) {
      errors.push('InteractiveSlide is missing required field: title');
    }
    if (!slide.elements) {
      errors.push('InteractiveSlide is missing required field: elements');
    }
    
    const sanitized = this.removeUndefinedFields(slide);
    
    // Sanitize elements array
    if (sanitized.elements && Array.isArray(sanitized.elements)) {
      const elementResults = sanitized.elements.map((element, index) => {
        const elementResult = this.sanitizeSlideElement(element);
        elementResult.errors.forEach(error => 
          errors.push(`Element ${index + 1}: ${error}`)
        );
        return elementResult.sanitized;
      });
      sanitized.elements = elementResults as SlideElement[];
    }
    
    // Ensure required arrays exist
    if (!sanitized.transitions) {
      sanitized.transitions = [];
    }
    
    // Validate layout
    if (!sanitized.layout) {
      sanitized.layout = {
        aspectRatio: '16:9',
        backgroundFit: 'contain'
      };
    }
    
    return { sanitized, errors };
  }

  /**
   * Validate and sanitize slide element data
   * @param element - Element to validate
   * @returns Sanitized element with validation errors if any
   */
  static sanitizeSlideElement(element: Partial<SlideElement>): { sanitized: Partial<SlideElement>; errors: string[] } {
    const errors: string[] = [];
    
    // Validate required fields
    if (!element.id) {
      errors.push('SlideElement is missing required field: id');
    }
    if (!element.type) {
      errors.push('SlideElement is missing required field: type');
    }
    if (!element.position) {
      errors.push('SlideElement is missing required field: position');
    }
    
    const sanitized = this.removeUndefinedFields(element);
    
    // Validate responsive positioning
    if (sanitized.position) {
      const positionResult = this.sanitizeResponsivePosition(sanitized.position);
      positionResult.errors.forEach(error => errors.push(`Position: ${error}`));
      sanitized.position = positionResult.sanitized;
    }
    
    // Ensure required arrays exist
    if (!sanitized.interactions) {
      sanitized.interactions = [];
    }
    
    // Provide default content if missing
    if (!sanitized.content) {
      sanitized.content = {};
    }
    
    // Provide default style if missing  
    if (!sanitized.style) {
      sanitized.style = {};
    }
    
    return { sanitized, errors };
  }

  /**
   * Validate and sanitize responsive position data
   * @param position - Position to validate
   * @returns Sanitized position with validation errors if any
   */
  static sanitizeResponsivePosition(position: Partial<ResponsivePosition>): { sanitized: Partial<ResponsivePosition>; errors: string[] } {
    const errors: string[] = [];
    const sanitized = this.removeUndefinedFields(position);
    
    // Validate each device type
    const deviceTypes: (keyof ResponsivePosition)[] = ['desktop', 'tablet', 'mobile'];
    
    deviceTypes.forEach(device => {
      if (!sanitized[device]) {
        errors.push(`Missing ${device} position`);
        // Provide default position
        sanitized[device] = { x: 0, y: 0, width: 100, height: 50 };
      } else {
        const devicePosition = sanitized[device];
        const positionResult = this.sanitizeFixedPosition(devicePosition!);
        positionResult.errors.forEach(error => errors.push(`${device}: ${error}`));
        sanitized[device] = positionResult.sanitized;
      }
    });
    
    return { sanitized, errors };
  }

  /**
   * Validate and sanitize fixed position data
   * @param position - Fixed position to validate
   * @returns Sanitized position with validation errors if any
   */
  static sanitizeFixedPosition(position: Partial<FixedPosition>): { sanitized: Partial<FixedPosition>; errors: string[] } {
    const errors: string[] = [];
    const sanitized = this.removeUndefinedFields(position);
    
    // Validate numeric fields
    const numericFields: (keyof FixedPosition)[] = ['x', 'y', 'width', 'height'];
    
    numericFields.forEach(field => {
      if (sanitized[field] === undefined) {
        errors.push(`Missing ${field} coordinate`);
        sanitized[field] = field === 'width' || field === 'height' ? 50 : 0; // Default dimensions
      } else if (typeof sanitized[field] !== 'number' || isNaN(sanitized[field]!)) {
        errors.push(`Invalid ${field}: must be a number`);
        sanitized[field] = field === 'width' || field === 'height' ? 50 : 0;
      } else if (sanitized[field]! < 0) {
        errors.push(`Invalid ${field}: cannot be negative`);
        sanitized[field] = 0;
      }
    });
    
    return { sanitized, errors };
  }

  /**
   * Validate project data for consistency between legacy and slide architectures
   * @param project - Project to validate
   * @returns Validation result with errors and warnings
   */
  static validateProjectConsistency(project: any): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check for mixed architectures (should use either hotspots OR slides, not both)
    const hasHotspots = project.interactiveData?.hotspots?.length > 0;
    const hasSlides = project.slideDeck?.slides?.length > 0;
    
    if (hasHotspots && hasSlides) {
      warnings.push('Project contains both legacy hotspots and slide deck - recommend migrating to slide-only architecture');
    }
    
    // Validate project type consistency
    if (project.projectType === 'slide' && !hasSlides) {
      errors.push('Project marked as slide type but contains no slide deck');
    }
    
    if (project.projectType === 'hotspot' && !hasHotspots) {
      warnings.push('Project marked as hotspot type but contains no hotspots');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}