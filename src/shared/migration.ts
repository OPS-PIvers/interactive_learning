// src/shared/migration.ts
import { TimelineEventData, InteractionType, VideoSourceType, SpotlightShape, extractYouTubeVideoId, HotspotData } from './types';

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
    
    // Migrate PULSE_HIGHLIGHT to PULSE_HOTSPOT
    if (event.type === 'PULSE_HIGHLIGHT' as any) {
      return {
        ...event,
        type: InteractionType.PULSE_HOTSPOT,
        duration: event.duration || 2000,
        intensity: event.intensity || 80,
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
        youtubeStartTime: event.youtubeStartTime,
        youtubeEndTime: event.youtubeEndTime,
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
        videoPoster: event.poster,
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
    
    // Update existing PULSE_HOTSPOT events to use unified properties
    if (event.type === InteractionType.PULSE_HOTSPOT) {
      return {
        ...event,
        duration: event.duration || 2000,
        intensity: event.intensity || 80,
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
          youtubeVideoId = extractYouTubeVideoId(videoUrl);
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
        videoPoster: event.videoPoster || event.poster,
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
  return migrateEventTypes([event])[0];
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
    
    // Additional processing for pan & zoom events that might be missing target coordinates
    if ((migratedEvent.type === InteractionType.PAN_ZOOM || migratedEvent.type === InteractionType.PAN_ZOOM_TO_HOTSPOT) &&
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
  });
};

// Check if an event needs migration
export const eventNeedsMigration = (event: TimelineEventData): boolean => {
  const deprecatedTypes = [
    'PAN_ZOOM_TO_HOTSPOT',
    'PULSE_HIGHLIGHT', 
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
      return { needsMigration: true, targetType: InteractionType.PULSE_HOTSPOT, description: 'Unified pulse animation' };
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