import React, { useEffect, useState, useCallback } from 'react';
import { TimelineEventData, ImageTransformState } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';
import { useEventCleanup } from '../../hooks/useEventCleanup';
import { calculatePanZoomTransform, createResetTransform } from '../../utils/panZoomUtils';
import { HotspotData, InteractionType } from '../../../shared/types';
import { getUnifiedMobilePosition } from '../../utils/unifiedMobilePositioning';

interface MobilePanZoomHandlerProps {
  event: TimelineEventData;
  containerRef: React.RefObject<HTMLElement>;
  onComplete: () => void;
  currentTransform?: { scale: number; translateX: number; translateY: number };
  onTransformUpdate?: (transform: ImageTransformState) => void;
  hotspots?: HotspotData[];
  imageElement?: HTMLImageElement | null;
}

const MobilePanZoomHandler: React.FC<MobilePanZoomHandlerProps> = ({
  event,
  containerRef,
  onComplete,
  onTransformUpdate,
  hotspots,
  imageElement,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const cleanup = useCallback(() => {
    setIsActive(false);
  }, []);

  useEventCleanup(cleanup);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    triggerHapticFeedback('light');

    if (onTransformUpdate) {
      onTransformUpdate(createResetTransform());
    }

    setTimeout(onComplete, 250); // Reduced delay for snappier feel
  }, [onComplete, onTransformUpdate]);

  useEffect(() => {
    if (!containerRef.current || !onTransformUpdate) return;

    setIsActive(true);
    triggerHapticFeedback('medium');

    const containerRect = containerRef.current.getBoundingClientRect();

    let targetX = event.targetX;
    let targetY = event.targetY;
    
    console.log('[MobilePanZoomHandler] Initial coordinates from event:', {
      eventId: event.id,
      eventType: event.type,
      targetX,
      targetY,
      hasTargetId: !!event.targetId,
      targetId: event.targetId
    });

    // For PAN_ZOOM_TO_HOTSPOT, use unified positioning system
    if (event.type === InteractionType.PAN_ZOOM_TO_HOTSPOT && event.targetId && hotspots && imageElement) {
      const targetHotspot = hotspots.find(h => h.id === event.targetId);
      console.log('[MobilePanZoomHandler] Looking for target hotspot:', {
        targetId: event.targetId,
        hotspotFound: !!targetHotspot,
        availableHotspots: hotspots.map(h => ({ id: h.id, x: h.x, y: h.y }))
      });
      
      if (targetHotspot) {
        const position = getUnifiedMobilePosition({
          hotspot: targetHotspot,
          imageElement,
          containerElement: containerRef.current,
        });
        
        console.log('[MobilePanZoomHandler] Unified positioning result:', {
          isValid: position.isValid,
          hotspotCoords: { x: targetHotspot.x, y: targetHotspot.y },
          unifiedPosition: position.isValid ? {
            imageX: position.imageX,
            imageY: position.imageY,
            imageBounds: position.imageBounds
          } : 'INVALID'
        });
        
        if (position.isValid && position.imageBounds.width > 0 && position.imageBounds.height > 0) {
          const newTargetX = (position.imageX / position.imageBounds.width) * 100;
          const newTargetY = (position.imageY / position.imageBounds.height) * 100;
          
          console.log('[MobilePanZoomHandler] Coordinate conversion:', {
            before: { targetX, targetY },
            after: { targetX: newTargetX, targetY: newTargetY },
            imageBounds: position.imageBounds
          });
          
          targetX = newTargetX;
          targetY = newTargetY;
        } else {
          console.warn('[MobilePanZoomHandler] Invalid unified position or zero image bounds, using fallback coordinates');
        }
      } else {
        console.warn('[MobilePanZoomHandler] Target hotspot not found, using event coordinates as fallback');
      }
    }
    
    // Safety check for undefined coordinates
    if (targetX === undefined || targetY === undefined) {
      console.warn('[MobilePanZoomHandler] Undefined coordinates detected, using center as fallback:', {
        originalX: targetX,
        originalY: targetY,
        eventId: event.id
      });
      targetX = targetX ?? 50;
      targetY = targetY ?? 50;
    }
    
    console.log('[MobilePanZoomHandler] Final coordinates for pan/zoom:', {
      eventId: event.id,
      finalX: targetX,
      finalY: targetY
    });

    const newTransform = calculatePanZoomTransform(
      { ...event, targetX, targetY }, 
      containerRect,
      imageElement, 
      containerRef.current
    );

    // Apply the new transform
    setTimeout(() => {
      onTransformUpdate(newTransform);
    }, 100);

    // Hide instructions after a delay
    const instructionTimer = setTimeout(() => {
      setShowInstructions(false);
    }, 1500);

    // Auto-complete the event after its duration
    const duration = event.duration || 3000;
    const completionTimer = setTimeout(handleComplete, duration);

    return () => {
      clearTimeout(instructionTimer);
      clearTimeout(completionTimer);
    };
  }, [event, containerRef, handleComplete, onTransformUpdate]);

  const handleOverlayClick = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (!isActive) return null;

  return (
    <>
      {showInstructions && (
        <div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[1001] pointer-events-none"
          style={{ animation: 'fadeInDown 0.5s ease-out' }}
        >
          <p className="text-white text-sm text-center bg-black bg-opacity-70 px-4 py-2 rounded-full">
            {event.message || 'Zooming to focus area...'}
          </p>
        </div>
      )}

      {/* Overlay to capture taps for early completion */}
      <div
        className="fixed inset-0 z-[999]"
        onClick={handleOverlayClick}
        style={{
          pointerEvents: 'auto',
          backgroundColor: 'transparent',
          cursor: 'pointer',
        }}
      />
    </>
  );
};

export default MobilePanZoomHandler;