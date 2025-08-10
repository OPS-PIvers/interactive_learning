import React, { useEffect } from 'react';
import { InteractionType } from '../../shared/InteractionPresets';
import { TimelineEventData } from '../../shared/type-defs';
import { HotspotData } from '../../shared/types';
import { usePanZoom } from '../contexts/PanZoomProvider';

interface PanZoomRendererProps {
  events: TimelineEventData[];
  hotspots: HotspotData[];
  isActive: boolean;
  onEventComplete?: (eventId: string) => void;
}

/**
 * Unified PanZoomRenderer component that works for both mobile and desktop
 * Handles PAN_ZOOM events with consistent behavior across platforms
 */
export const PanZoomRenderer: React.FC<PanZoomRendererProps> = ({
  events,
  hotspots,
  isActive,
  onEventComplete
}) => {
  const { 
    executePanZoom, 
    setEventActive, 
    setEventInactive,
    isEventActive 
  } = usePanZoom();

  useEffect(() => {
    if (!isActive) {
      return;
    }

    // Find active pan/zoom events
    const panZoomEvents = events.filter(event => 
      event.type === InteractionType.PAN_ZOOM
    );

    if (panZoomEvents.length === 0) {
      return;
    }

    // Execute each pan/zoom event in sequence
    panZoomEvents.forEach((event, index) => {
      // Calculate delay for sequential execution
      const delay = index * 100; // Small delay between multiple events
      
      setTimeout(() => {
        // Mark event as active with duration based on animation + buffer
        const duration = event.smooth !== false ? 800 : 100; // Animation time + buffer
        setEventActive(InteractionType.PAN_ZOOM, event.id, true, duration);

        // Execute the pan/zoom
        executePanZoom(event, hotspots);

        // Handle completion
        setTimeout(() => {
          if (onEventComplete) {
            onEventComplete(event.id);
          }
          
          // Only mark inactive if this specific event is still active
          if (isEventActive(event.id)) {
            setEventInactive();
          }
        }, duration - 50); // Slightly before auto-timeout
        
      }, delay);
    });

    // Cleanup function
    return () => {
      setEventInactive();
    };
  }, [
    events,
    hotspots,
    isActive,
    executePanZoom,
    setEventActive,
    setEventInactive,
    isEventActive,
    onEventComplete
  ]);

  // This component renders nothing - it's purely for effect handling
  return null;
};