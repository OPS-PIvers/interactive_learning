import React, { useEffect, useState, useCallback } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';
import { useEventCleanup } from '../../hooks/useEventCleanup';
import { Z_INDEX } from '../../constants/interactionConstants';

interface MobilePanZoomHandlerProps {
  event: TimelineEventData;
  containerRef: React.RefObject<HTMLElement>;
  onComplete: () => void;
  // Add these new props to coordinate with touch gestures
  currentTransform?: { scale: number; translateX: number; translateY: number };
  onTransformUpdate?: (transform: { scale: number; translateX: number; translateY: number }) => void;
}

const MobilePanZoomHandler: React.FC<MobilePanZoomHandlerProps> = ({
  event,
  containerRef,
  onComplete,
  currentTransform,
  onTransformUpdate
}) => {
  const [isActive, setIsActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const cleanup = useCallback(() => {
    // Don't manipulate DOM directly anymore
    setIsActive(false);
  }, []);

  useEventCleanup(cleanup);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    triggerHapticFeedback('light');
    
    // Animate back to original position using state
    if (onTransformUpdate) {
      onTransformUpdate({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
    }
    
    setTimeout(onComplete, 500);
  }, [onComplete, onTransformUpdate]);

  useEffect(() => {
    if (!containerRef.current || !onTransformUpdate) return;

    setIsActive(true);
    triggerHapticFeedback('medium');

    const targetX = event.targetX || event.spotlightX || 50;
    const targetY = event.targetY || event.spotlightY || 50;
    const zoomLevel = event.zoomLevel || event.zoomFactor || event.zoom || 2;
    const smooth = event.smooth !== false;

    // Calculate transform values based on container size
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Convert percentage to actual coordinates
    const targetPixelX = (targetX / 100) * containerRect.width;
    const targetPixelY = (targetY / 100) * containerRect.height;
    
    // Calculate translation to center the target point
    const translateX = (containerRect.width / 2) - (targetPixelX * zoomLevel);
    const translateY = (containerRect.height / 2) - (targetPixelY * zoomLevel);

    // Update transform through state management
    setTimeout(() => {
      onTransformUpdate({
        scale: zoomLevel,
        translateX,
        translateY,
        targetHotspotId: event.targetId // Add target hotspot ID for tracking
      });
    }, 100); // Small delay for smooth transition

    // Hide instructions
    const instructionTimer = setTimeout(() => {
      setShowInstructions(false);
    }, 1000);

    // Auto-complete
    const duration = event.duration || 3000;
    const completionTimer = setTimeout(() => {
      handleComplete();
    }, duration);

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