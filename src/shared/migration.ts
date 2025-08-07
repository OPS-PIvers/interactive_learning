// src/shared/migration.ts
import { TimelineEventData, VideoSourceType, SpotlightShape, extractYouTubeVideoId, HotspotData, InteractiveModuleState, Event as HotspotEvent, Project } from './types';
import { InteractionType } from './InteractionPresets';
import { SlideDeck, SlideElement, InteractiveSlide, ResponsivePosition, ElementContent, ElementInteraction, ElementStyle } from './slideTypes';
import { generateId } from '../client/utils/generateId';

export const migrateEventTypes = (events: TimelineEventData[]): TimelineEventData[] => {
  return events.map(event => {
    // Migrate PAN_ZOOM_TO_HOTSPOT to PAN_ZOOM
    if (event.type === 'PAN_ZOOM_TO_HOTSPOT' as any) {
      return {
        ...event,
        type: InteractionType.PAN_ZOOM,
        zoomLevel: event.zoomFactor || 2, // Use zoomFactor as zoomLevel
        smooth: true,
        // Note: targetX and targetY should be set based on the target hotspot's position
        // This is now handled in the editor components when creating new events
        // Existing events without targetX/targetY will fall back to default center position (50, 50)
      };
    }
    
    // Migrate PULSE_HIGHLIGHT to SPOTLIGHT
    if (event.type === 'PULSE_HIGHLIGHT' as any) {
      return {
        ...event,
        type: InteractionType.SPOTLIGHT,
        spotlightShape: 'circle' as SpotlightShape,
        spotlightX: event.spotlightX || 50,
        spotlightY: event.spotlightY || 50,
        spotlightWidth: 120,
        spotlightHeight: 120,
        backgroundDimPercentage: 70,
        spotlightOpacity: 0,
      };
    }
    
    // Migrate PULSE_HOTSPOT to SPOTLIGHT
    if (event.type === 'PULSE_HOTSPOT' as any) {
      return {
        ...event,
        type: InteractionType.SPOTLIGHT,
        spotlightShape: 'circle' as SpotlightShape,
        spotlightX: event.spotlightX || 50,
        spotlightY: event.spotlightY || 50,
        spotlightWidth: 120,
        spotlightHeight: 120,
        backgroundDimPercentage: 70,
        spotlightOpacity: 0,
      };
    }
    
    // Migrate SHOW_YOUTUBE to PLAY_VIDEO
    if (event.type === 'SHOW_YOUTUBE' as any) {
      return {
        ...event,
        type: InteractionType.PLAY_VIDEO,
        videoSource: 'youtube' as VideoSourceType,
        videoUrl: event.youtubeVideoId ? `https://youtube.com/watch?v=${event.youtubeVideoId}` : '',
        videoDisplayMode: 'modal' as const,
        videoShowControls: true,
        ...(event.youtubeStartTime && { youtubeStartTime: event.youtubeStartTime }),
        ...(event.youtubeEndTime && { youtubeEndTime: event.youtubeEndTime }),
        autoplay: event.autoplay || false,
      };
    }
    
    // Migrate SHOW_VIDEO to PLAY_VIDEO  
    if (event.type === 'SHOW_VIDEO' as any) {
      return {
        ...event,
        type: InteractionType.PLAY_VIDEO,
        videoSource: 'url' as VideoSourceType,
        videoUrl: event.videoUrl || event.url || '',
        videoDisplayMode: 'modal' as const,
        videoShowControls: true,
        ...(event.poster && { videoPoster: event.poster }),
        autoplay: event.autoplay || false,
        loop: event.loop || false,
      };
    }
    
    // Migrate SHOW_AUDIO_MODAL to PLAY_AUDIO
    if (event.type === 'SHOW_AUDIO_MODAL' as any) {
      return {
        ...event,
        type: InteractionType.PLAY_AUDIO,
        audioUrl: event.audioUrl || event.url || '',
        audioDisplayMode: 'modal' as const,
        audioShowControls: true,
        audioTitle: event.textContent || event.content,
        audioArtist: event.artist,
        autoplay: event.autoplay || false,
        volume: event.volume || 80,
      };
    }
    
    // Migrate SHOW_MESSAGE to SHOW_TEXT
    if (event.type === 'SHOW_MESSAGE' as any) {
      return {
        ...event,
        type: InteractionType.SHOW_TEXT,
        textContent: event.message || event.content || '',
        textPosition: 'center' as const,
        textX: 50,
        textY: 50,
        textWidth: 300,
        textHeight: 100,
      };
    }
    
    // Migrate HIGHLIGHT_HOTSPOT to SPOTLIGHT
    if (event.type === 'HIGHLIGHT_HOTSPOT' as any) {
      return {
        ...event,
        type: InteractionType.SPOTLIGHT,
        spotlightShape: (event.highlightShape as SpotlightShape) || 'circle',
        spotlightX: event.spotlightX || 50,
        spotlightY: event.spotlightY || 50,
        spotlightWidth: event.highlightRadius ? event.highlightRadius * 2 : 120,
        spotlightHeight: event.highlightRadius ? event.highlightRadius * 2 : 120,
        backgroundDimPercentage: event.dimPercentage || 70,
        spotlightOpacity: 0, // Always bright in spotlight
      };
    }
    
    // Update existing PAN_ZOOM events to use unified properties
    if (event.type === InteractionType.PAN_ZOOM) {
      return {
        ...event,
        zoomLevel: event.zoomLevel || event.zoomFactor || 2,
        smooth: event.smooth !== undefined ? event.smooth : true,
      };
    }
    
    
    // Update existing PLAY_VIDEO events to use unified properties
    if (event.type === InteractionType.PLAY_VIDEO) {
      let videoSource: VideoSourceType = 'url';
      let videoUrl = event.videoUrl || event.url || '';
      let youtubeVideoId = event.youtubeVideoId;
      
      // Detect video source if not specified
      if (!event.videoSource && videoUrl) {
        if (extractYouTubeVideoId(videoUrl)) {
          videoSource = 'youtube';
          youtubeVideoId = extractYouTubeVideoId(videoUrl) || undefined;
        } else {
          videoSource = 'url';
        }
      }
      
      return {
        ...event,
        videoSource: event.videoSource || videoSource,
        videoUrl,
        youtubeVideoId,
        videoDisplayMode: event.videoDisplayMode || 'inline',
        videoShowControls: event.videoShowControls !== undefined ? event.videoShowControls : true,
        ...((event.videoPoster || event.poster) && { videoPoster: event.videoPoster || event.poster }),
        autoplay: event.autoplay || false,
        loop: event.loop || false,
      };
    }
    
    // Update existing PLAY_AUDIO events to use unified properties
    if (event.type === InteractionType.PLAY_AUDIO) {
      return {
        ...event,
        audioUrl: event.audioUrl || event.url || '',
        audioDisplayMode: event.audioDisplayMode || 'background',
        audioShowControls: event.audioShowControls !== undefined ? event.audioShowControls : false,
        audioTitle: event.audioTitle || event.textContent || event.content,
        audioArtist: event.audioArtist || event.artist,
        autoplay: event.autoplay !== undefined ? event.autoplay : true,
        volume: event.volume || 80,
      };
    }
    
    // Update existing SHOW_TEXT events to use unified properties
    if (event.type === InteractionType.SHOW_TEXT) {
      return {
        ...event,
        textContent: event.textContent || event.content || event.message || '',
        textPosition: event.textPosition || 'center',
        textX: event.textX || 50,
        textY: event.textY || 50,
        textWidth: event.textWidth || 300,
        textHeight: event.textHeight || 100,
      };
    }
    
    // Update existing SPOTLIGHT events to use unified properties
    if (event.type === InteractionType.SPOTLIGHT) {
      return {
        ...event,
        spotlightShape: event.spotlightShape || (event.highlightShape as SpotlightShape) || 'circle',
        spotlightX: event.spotlightX || 50,
        spotlightY: event.spotlightY || 50,
        spotlightWidth: event.spotlightWidth || (event.highlightRadius ? event.highlightRadius * 2 : 120),
        spotlightHeight: event.spotlightHeight || (event.highlightRadius ? event.highlightRadius * 2 : 120),
        backgroundDimPercentage: event.backgroundDimPercentage || event.dimPercentage || 70,
        spotlightOpacity: 0, // Always bright in spotlight
      };
    }
    
    return event;
  });
};

// Helper function to migrate a single event
export const migrateSingleEvent = (event: TimelineEventData): TimelineEventData => {
  const migrated = migrateEventTypes([event])[0];
  if (!migrated) {
    throw new Error('Failed to migrate event');
  }
  return migrated;
};

// Enhanced migration function that can set target coordinates for pan & zoom events
export const migrateEventTypesWithHotspots = (events: TimelineEventData[], hotspots: HotspotData[]): TimelineEventData[] => {
  console.log('[migrateEventTypesWithHotspots] Starting migration:', {
    eventsCount: events.length,
    hotspotsCount: hotspots.length,
    events: events.map(e => ({ id: e.id, type: e.type, targetId: e.targetId, hasCoords: !!(e.targetX || e.targetY || e.spotlightX || e.spotlightY) }))
  });

  return events.map(event => {
    // First apply the standard migration
    const migratedEvent = migrateEventTypes([event])[0];
    if (!migratedEvent) return undefined;
    
    // Additional processing for pan & zoom events that might be missing target coordinates
    if (migratedEvent.type === InteractionType.PAN_ZOOM &&
        (migratedEvent.targetX === undefined || migratedEvent.targetY === undefined) &&
        migratedEvent.targetId) {
      
      console.log('[migrateEventTypesWithHotspots] Processing PAN_ZOOM event:', {
        eventId: migratedEvent.id,
        eventType: migratedEvent.type,
        targetId: migratedEvent.targetId,
        currentTargetX: migratedEvent.targetX,
        currentTargetY: migratedEvent.targetY
      });
      
      // Find the target hotspot to get its coordinates
      const targetHotspot = hotspots.find(h => h.id === migratedEvent.targetId);
      if (targetHotspot) {
        console.log('[migrateEventTypesWithHotspots] Found target hotspot, assigning coordinates:', {
          hotspotId: targetHotspot.id,
          hotspotX: targetHotspot.x,
          hotspotY: targetHotspot.y
        });
        
        return {
          ...migratedEvent,
          targetX: targetHotspot.x,
          targetY: targetHotspot.y,
          zoomLevel: migratedEvent.zoomLevel || 2,
          smooth: migratedEvent.smooth !== false,
        };
      } else {
        console.warn('[migrateEventTypesWithHotspots] Target hotspot not found:', {
          targetId: migratedEvent.targetId,
          availableHotspots: hotspots.map(h => h.id)
        });
      }
    }
    
    // Additional processing for spotlight events that might be missing spotlight coordinates
    if (migratedEvent.type === InteractionType.SPOTLIGHT &&
        (migratedEvent.spotlightX === undefined || migratedEvent.spotlightY === undefined) &&
        migratedEvent.targetId) {
      
      console.log('[migrateEventTypesWithHotspots] Processing SPOTLIGHT event:', {
        eventId: migratedEvent.id,
        eventType: migratedEvent.type,
        targetId: migratedEvent.targetId,
        currentSpotlightX: migratedEvent.spotlightX,
        currentSpotlightY: migratedEvent.spotlightY
      });
      
      // Find the target hotspot to get its coordinates
      const targetHotspot = hotspots.find(h => h.id === migratedEvent.targetId);
      if (targetHotspot) {
        console.log('[migrateEventTypesWithHotspots] Found target hotspot, assigning spotlight coordinates:', {
          hotspotId: targetHotspot.id,
          hotspotX: targetHotspot.x,
          hotspotY: targetHotspot.y
        });
        
        return {
          ...migratedEvent,
          spotlightX: targetHotspot.x,
          spotlightY: targetHotspot.y,
          spotlightShape: migratedEvent.spotlightShape || 'circle',
          backgroundDimPercentage: migratedEvent.backgroundDimPercentage || 70,
          spotlightOpacity: 0,
        };
      } else {
        console.warn('[migrateEventTypesWithHotspots] Target hotspot not found for spotlight:', {
          targetId: migratedEvent.targetId,
          availableHotspots: hotspots.map(h => h.id)
        });
      }
    }
    
    return migratedEvent;
  }).filter((event): event is TimelineEventData => event !== undefined);
};

// Check if an event needs migration
export const eventNeedsMigration = (event: TimelineEventData): boolean => {
  const deprecatedTypes = [
    'PAN_ZOOM_TO_HOTSPOT',
    'PULSE_HIGHLIGHT',
    'PULSE_HOTSPOT',
    'SHOW_YOUTUBE',
    'SHOW_VIDEO',
    'SHOW_AUDIO_MODAL',
    'SHOW_MESSAGE'
  ];
  
  return deprecatedTypes.includes(event.type as string);
};

// Get migration info for an event
export const getMigrationInfo = (event: TimelineEventData): { needsMigration: boolean; targetType?: InteractionType; description?: string } => {
  const type = event.type as string;
  
  switch (type) {
    case 'PAN_ZOOM_TO_HOTSPOT':
      return { needsMigration: true, targetType: InteractionType.PAN_ZOOM, description: 'Unified pan & zoom functionality' };
    case 'PULSE_HIGHLIGHT':
    case 'PULSE_HOTSPOT':
      return { needsMigration: true, targetType: InteractionType.SPOTLIGHT, description: 'Unified spotlight highlighting' };
    case 'SHOW_YOUTUBE':
    case 'SHOW_VIDEO':
      return { needsMigration: true, targetType: InteractionType.PLAY_VIDEO, description: 'Unified video playback with source detection' };
    case 'SHOW_AUDIO_MODAL':
      return { needsMigration: true, targetType: InteractionType.PLAY_AUDIO, description: 'Unified audio playback with display options' };
    case 'SHOW_MESSAGE':
      return { needsMigration: true, targetType: InteractionType.SHOW_TEXT, description: 'Unified text display with positioning' };
    default:
      return { needsMigration: false };
  }
};

// New migration functions for converting to slide-based architecture
const DESKTOP_RESOLUTION = { width: 1920, height: 1080 };
const MOBILE_RESOLUTION = { width: 480, height: 800 };

function convertHotspotToSlideElement(
  hotspot: HotspotData,
  timelineEvent: TimelineEventData,
  module: InteractiveModuleState
): SlideElement {
  // Map hotspot size to dimensions (addressing hardcoded width/height issue)
  let width = 100, height = 100;
  if (hotspot.size === 'small') {
    width = height = 60;
  } else if (hotspot.size === 'large') {
    width = height = 140;
  }
  // medium is default 100x100

  const desktopPosition = {
    x: Math.round((hotspot.x / 100) * DESKTOP_RESOLUTION.width) - width/2,
    y: Math.round((hotspot.y / 100) * DESKTOP_RESOLUTION.height) - height/2,
    width,
    height,
  };

  const mobileWidth = Math.round(width * 0.6);
  const mobileHeight = Math.round(height * 0.6);
  const mobilePosition = {
    x: Math.round((hotspot.x / 100) * MOBILE_RESOLUTION.width) - mobileWidth/2,
    y: Math.round((hotspot.y / 100) * MOBILE_RESOLUTION.height) - mobileHeight/2,
    width: mobileWidth,
    height: mobileHeight,
  };

  // For tablet, use intermediate sizing
  const tabletWidth = Math.round(width * 0.8);
  const tabletHeight = Math.round(height * 0.8);
  const tabletPosition = {
    x: Math.round((hotspot.x / 100) * 1024) - tabletWidth/2, // Tablet resolution
    y: Math.round((hotspot.y / 100) * 768) - tabletHeight/2,
    width: tabletWidth,
    height: tabletHeight,
  };

  const position: ResponsivePosition = {
    desktop: desktopPosition,
    tablet: tabletPosition,
    mobile: mobilePosition,
  };

  const content: ElementContent = {
    title: hotspot.title,
    description: hotspot.description,
  };

  const interactions: ElementInteraction[] = [];
  const style: ElementStyle = {
    backgroundColor: hotspot.backgroundColor || hotspot.color || '#3b82f6',
    borderRadius: 20,
    opacity: 0.9,
  };

  return {
    id: hotspot.id,
    type: 'hotspot',
    position,
    content,
    interactions,
    style,
    isVisible: true,
  };
}

export function convertHotspotToSlideDeck(module: InteractiveModuleState): SlideDeck {
  const slide: InteractiveSlide = {
    id: generateId(),
    title: 'Migrated Slide',
    ...(module.backgroundImage && { backgroundImage: module.backgroundImage }),
    elements: [],
    transitions: [],
    layout: {
      containerWidth: DESKTOP_RESOLUTION.width,
      containerHeight: DESKTOP_RESOLUTION.height,
      aspectRatio: '16:9',
      scaling: 'fit',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  };

  // Convert hotspots to slide elements
  if (module.hotspots && module.timelineEvents) {
    // Create a map for quick hotspot lookup
    const hotspotMap = new Map(module.hotspots.map(h => [h.id, h]));

    // For each timeline event that targets a hotspot, create a slide element
    module.timelineEvents.forEach(event => {
      if (event.targetId) {
        const hotspot = hotspotMap.get(event.targetId);
        if (hotspot) {
          const element = convertHotspotToSlideElement(hotspot, event, module);
          // Only add if not already added (avoid duplicates)
          if (!slide.elements.find(el => el.id === hotspot.id)) {
            slide.elements.push(element);
          }
        }
      }
    });

    // Add any hotspots that don't have timeline events
    module.hotspots.forEach(hotspot => {
      if (!slide.elements.find(el => el.id === hotspot.id)) {
        // Create a dummy timeline event for conversion
        const dummyEvent: TimelineEventData = {
          id: generateId(),
          name: hotspot.title || 'Untitled Event',
          type: InteractionType.SHOW_TEXT,
          step: 1,
          targetId: hotspot.id,
          textContent: hotspot.description || 'Interactive hotspot',
        };
        const element = convertHotspotToSlideElement(hotspot, dummyEvent, module);
        slide.elements.push(element);
      }
    });
  }

  const slideDeck: SlideDeck = {
    id: generateId(),
    title: 'Migrated Project',
    description: 'Converted from hotspot-based architecture',
    slides: [slide],
    settings: {
      autoAdvance: false,
      autoAdvanceDelay: 5000,
      allowNavigation: true,
      showProgress: true,
      showControls: true,
      keyboardShortcuts: true,
      touchGestures: true,
      fullscreenMode: false,
    },
    metadata: {
      created: Date.now(),
      modified: Date.now(),
      author: 'Migration Tool',
      version: '1.0.0',
      tags: ['migrated'],
      isPublic: false,
    },
  };

  return slideDeck;
}

// Migration from legacy format
export interface LegacyMigrationMap {
  hotspotToElement: (hotspot: HotspotData) => SlideElement;
  eventToInteraction: (event: TimelineEventData) => ElementInteraction;
  projectToSlideDeck: (project: Project) => SlideDeck;
}