import React, { useEffect, useState, useCallback } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';

interface MobilePanZoomHandlerProps {
  event: TimelineEventData;
  containerRef: React.RefObject<HTMLElement>;
  onComplete: () => void;
}

const MobilePanZoomHandler: React.FC<MobilePanZoomHandlerProps> = ({
  event,
  containerRef,
  onComplete
}) => {
  const [isActive, setIsActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const imageElement = container.querySelector('img') as HTMLImageElement;
    if (!imageElement) return;

    // Start the pan/zoom animation
    setIsActive(true);
    triggerHapticFeedback('medium');

    const targetX = event.targetX || event.spotlightX || 50;
    const targetY = event.targetY || event.spotlightY || 50;
    const zoomLevel = event.zoomLevel || event.zoomFactor || event.zoom || 2;
    const smooth = event.smooth !== false; // Default to true

    // Calculate the transform values
    const containerRect = container.getBoundingClientRect();
    const imageRect = imageElement.getBoundingClientRect();
    
    // Convert percentage to pixels
    const targetPixelX = (targetX / 100) * imageRect.width;
    const targetPixelY = (targetY / 100) * imageRect.height;
    
    // Calculate translation to center the target point
    const translateX = (containerRect.width / 2) - (targetPixelX * zoomLevel);
    const translateY = (containerRect.height / 2) - (targetPixelY * zoomLevel);

    // Apply the transformation
    const transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
    const transition = smooth ? 'transform 1s ease-in-out' : 'none';

    imageElement.style.transition = transition;
    imageElement.style.transform = transform;
    imageElement.style.transformOrigin = 'top left';

    // Hide instructions after animation starts
    setTimeout(() => {
      setShowInstructions(false);
    }, 1000);

    // Auto-complete after duration or default timeout
    const duration = event.duration || 3000;
    const completionTimer = setTimeout(() => {
      handleComplete();
    }, duration);

    return () => {
      clearTimeout(completionTimer);
      // Reset transform when component unmounts
      if (imageElement) {
        imageElement.style.transform = '';
        imageElement.style.transition = '';
        imageElement.style.transformOrigin = '';
      }
    };
  }, [event, containerRef]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    triggerHapticFeedback('light');
    
    // Reset image transform
    const container = containerRef.current;
    if (container) {
      const imageElement = container.querySelector('img') as HTMLImageElement;
      if (imageElement) {
        imageElement.style.transition = 'transform 0.5s ease-in-out';
        imageElement.style.transform = '';
        imageElement.style.transformOrigin = '';
      }
    }
    
    setTimeout(onComplete, 500); // Allow reset animation
  }, [onComplete, containerRef]);

  const handleOverlayClick = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (!isActive) return null;

  return (
    <div
      className="mobile-pan-zoom-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        pointerEvents: 'auto',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        touchAction: 'manipulation',
      }}
    >
      {showInstructions && (
        <div className="mobile-pan-zoom-instructions">
          <div className="instruction-content">
            <p className="text-white text-sm text-center bg-black bg-opacity-70 px-4 py-2 rounded-full">
              {event.message || 'Zooming to focus area...'}
            </p>
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      <div className="mobile-zoom-indicator">
        <div className="zoom-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
          </svg>
        </div>
      </div>

      <style jsx>{`
        .mobile-pan-zoom-overlay {
          -webkit-tap-highlight-color: transparent;
        }
        
        .mobile-pan-zoom-instructions {
          position: absolute;
          top: 20%;
          left: 50%;
          transform: translateX(-50%);
          animation: fadeInDown 0.5s ease-out;
        }
        
        .instruction-content {
          max-width: 280px;
          padding: 0 20px;
        }
        
        .mobile-zoom-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: zoomPulse 2s infinite;
        }
        
        .zoom-icon {
          width: 48px;
          height: 48px;
          background: rgba(139, 92, 246, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes zoomPulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default MobilePanZoomHandler;