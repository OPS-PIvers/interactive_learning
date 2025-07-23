import React, { useEffect, useState, useCallback } from 'react';
import { TimelineEventData, ImageTransformState } from '../../../shared/types';
import { useEventCleanup } from '../../hooks/useEventCleanup';
import { calculatePanZoomTransform, createResetTransform } from '../../utils/panZoomUtils';

interface DesktopPanZoomHandlerProps {
  event: TimelineEventData;
  containerRef: React.RefObject<HTMLElement>;
  imageElement?: HTMLImageElement | null;
  onComplete: () => void;
  currentTransform?: ImageTransformState;
  onTransformUpdate?: (transform: ImageTransformState) => void;
}

const DesktopPanZoomHandler: React.FC<DesktopPanZoomHandlerProps> = ({
  event,
  containerRef,
  imageElement,
  onComplete,
  onTransformUpdate,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const cleanup = useCallback(() => {
    setIsActive(false);
  }, []);

  useEventCleanup(cleanup);

  const handleComplete = useCallback(() => {
    setIsActive(false);

    if (onTransformUpdate) {
      onTransformUpdate(createResetTransform());
    }

    setTimeout(onComplete, 250); // Consistent with mobile timing
  }, [onComplete, onTransformUpdate]);

  useEffect(() => {
    if (!containerRef.current || !onTransformUpdate) return;

    setIsActive(true);

    const containerRect = containerRef.current.getBoundingClientRect();
    const newTransform = calculatePanZoomTransform(
      event, 
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

      {/* Overlay to capture clicks for early completion */}
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

export default DesktopPanZoomHandler;