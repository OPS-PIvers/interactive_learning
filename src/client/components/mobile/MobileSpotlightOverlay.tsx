import React, { useEffect, useState, useCallback } from 'react';
import { TimelineEventData, InteractionType } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';
import { Z_INDEX } from '../../constants/interactionConstants';

interface MobileSpotlightOverlayProps {
  event: TimelineEventData;
  containerRef: React.RefObject<HTMLElement>;
  onComplete: () => void;
}

const MobileSpotlightOverlay: React.FC<MobileSpotlightOverlayProps> = ({
  event,
  containerRef,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
    }
  }, [containerRef]);

  useEffect(() => {
    setIsVisible(true);
    triggerHapticFeedback('light');

    // Auto-complete after duration or default timeout
    const duration = event.duration || 3000;
    const timer = setTimeout(() => {
      handleComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [event.duration]);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    triggerHapticFeedback('light');
    setTimeout(onComplete, 300); // Allow fade-out animation
  }, [onComplete]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    // Only complete if clicking outside the spotlight area
    if (e.target === e.currentTarget) {
      handleComplete();
    }
  }, [handleComplete]);

  if (!containerRect) return null;

  const getSpotlightStyle = () => {
    // Enhanced property mapping for both new and legacy properties
    const dimPercentage = event.dimPercentage || event.spotlightDim || 70;
    const radius = event.highlightRadius || event.spotlightRadius || 60;
    const shape = event.highlightShape || event.spotlightShape || 'circle';
    
    // Handle position mapping with fallbacks
    let spotlightX = 50, spotlightY = 50;
    if (event.spotlightX !== undefined) spotlightX = event.spotlightX;
    if (event.spotlightY !== undefined) spotlightY = event.spotlightY;
    if (event.highlightX !== undefined) spotlightX = event.highlightX;
    if (event.highlightY !== undefined) spotlightY = event.highlightY;

    let spotlightWidth = radius * 2;
    let spotlightHeight = radius * 2;
    if (event.spotlightWidth !== undefined) spotlightWidth = event.spotlightWidth;
    if (event.spotlightHeight !== undefined) spotlightHeight = event.spotlightHeight;

    const overlayOpacity = dimPercentage / 100;
    const centerX = (spotlightX / 100) * containerRect.width;
    const centerY = (spotlightY / 100) * containerRect.height;

    if (shape === 'circle') {
      return {
        background: `radial-gradient(circle at ${centerX}px ${centerY}px, 
          transparent ${radius}px, 
          rgba(0, 0, 0, ${overlayOpacity}) ${radius + 20}px)`,
      };
    } else {
      // Rectangle spotlight logic
      return {
        background: `radial-gradient(ellipse ${spotlightWidth}px ${spotlightHeight}px at ${centerX}px ${centerY}px, 
          transparent 0%, transparent 40%, rgba(0, 0, 0, ${overlayOpacity}) 70%)`,
      };
    }
  };

  const renderContent = () => {
    if (event.type === InteractionType.PULSE_HOTSPOT || event.type === InteractionType.PULSE_HIGHLIGHT) {
      return (
        <div className="mobile-spotlight-pulse">
          <div className="pulse-ring" />
          <div className="pulse-ring" style={{ animationDelay: '0.5s' }} />
          <div className="pulse-ring" style={{ animationDelay: '1s' }} />
        </div>
      );
    }

    if (event.type === InteractionType.HIGHLIGHT_HOTSPOT) {
      return (
        <div className="mobile-spotlight-highlight">
          <div className="highlight-indicator" />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`mobile-spotlight-overlay ${isVisible ? 'visible' : 'hidden'}`}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: Z_INDEX.MOBILE_MODAL,
        pointerEvents: 'auto',
        transition: 'opacity 0.3s ease',
        opacity: isVisible ? 1 : 0,
        ...getSpotlightStyle()
      }}
    >
      {renderContent()}
      
      {/* Instruction text */}
      <div className="mobile-spotlight-instruction">
        <p className="text-white text-sm text-center bg-black bg-opacity-50 px-4 py-2 rounded-full">
          {event.message || 'Tap anywhere to continue'}
        </p>
      </div>

      <style jsx>{`
        .mobile-spotlight-overlay {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        
        .mobile-spotlight-instruction {
          position: absolute;
          bottom: 20%;
          left: 50%;
          transform: translateX(-50%);
          animation: fadeInUp 0.5s ease-out;
        }
        
        .mobile-spotlight-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .pulse-ring {
          position: absolute;
          width: 60px;
          height: 60px;
          border: 2px solid rgba(139, 92, 246, 0.8);
          border-radius: 50%;
          animation: pulse 2s infinite;
          top: -30px;
          left: -30px;
        }
        
        .mobile-spotlight-highlight {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .highlight-indicator {
          position: absolute;
          width: 80px;
          height: 80px;
          border: 3px solid rgba(255, 193, 7, 0.9);
          border-radius: 50%;
          animation: highlightGlow 1.5s ease-in-out infinite alternate;
          top: -40px;
          left: -40px;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        
        @keyframes highlightGlow {
          0% {
            opacity: 0.6;
            box-shadow: 0 0 10px rgba(255, 193, 7, 0.4);
          }
          100% {
            opacity: 1;
            box-shadow: 0 0 20px rgba(255, 193, 7, 0.8);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MobileSpotlightOverlay;