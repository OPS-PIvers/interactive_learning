import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TimelineEventData, InteractionType, HotspotData } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';
import { getSpotlightPosition, debugMobilePositioning } from '../../utils/unifiedMobilePositioning';

interface MobileSpotlightOverlayProps {
  event: TimelineEventData;
  containerRef: React.RefObject<HTMLElement>;
  onComplete: () => void;
  hotspots?: HotspotData[]; // ADD: hotspots prop to get target hotspot
  imageElement?: HTMLImageElement | null; // ADD: image element ref
}

const MobileSpotlightOverlay: React.FC<MobileSpotlightOverlayProps> = ({
  event,
  containerRef,
  onComplete,
  hotspots = [], // ADD
  imageElement // ADD
}) => {
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const animationRef = useRef<number>();

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    triggerHapticFeedback('light');
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setTimeout(onComplete, 300);
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size to match viewport
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Find the target hotspot
    const targetHotspot = hotspots.find(h => h.id === event.targetId);
    if (!targetHotspot) {
      console.error('MobileSpotlightOverlay: Target hotspot not found:', event.targetId);
      handleComplete();
      return;
    }

    setIsVisible(true);
    triggerHapticFeedback('light');

    // Animation parameters
    const spotlightWidth = event.spotlightWidth || 150;
    const spotlightHeight = event.spotlightHeight || 150;
    const shape = event.spotlightShape || 'circle';
    const dimPercentage = event.backgroundDimPercentage || 70;
    
    // USE UNIFIED POSITIONING - This ensures perfect alignment with hotspots
    const positionResult = getSpotlightPosition(
      targetHotspot,
      imageElement || null,
      container,
      {
        customX: event.spotlightX, // Allow custom positioning if specified
        customY: event.spotlightY,
        width: spotlightWidth,
        height: spotlightHeight
      }
    );

    if (!positionResult.isValid) {
      console.error('MobileSpotlightOverlay: Could not calculate valid position');
      handleComplete();
      return;
    }

    // Debug logging
    if (localStorage.getItem('debug_mobile_positioning') === 'true') {
      debugMobilePositioning(targetHotspot, imageElement || null, container, 'MobileSpotlight');
    }

    const { spotlightRect } = positionResult;

    // Animation state
    let currentOpacity = 0;
    const targetOpacity = dimPercentage / 100;
    const animationDuration = 500; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      currentOpacity = targetOpacity * easeOutCubic;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw dimming overlay
      ctx.fillStyle = `rgba(0, 0, 0, ${currentOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create spotlight cutout using UNIFIED POSITIONING
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      
      if (shape === 'circle') {
        const radius = Math.min(spotlightWidth, spotlightHeight) / 2;
        ctx.beginPath();
        ctx.arc(
          spotlightRect.x + spotlightWidth / 2,
          spotlightRect.y + spotlightHeight / 2,
          radius * easeOutCubic,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else {
        // Rectangle or oval spotlight
        const currentWidth = spotlightWidth * easeOutCubic;
        const currentHeight = spotlightHeight * easeOutCubic;
        const rectX = spotlightRect.x + (spotlightWidth - currentWidth) / 2;
        const rectY = spotlightRect.y + (spotlightHeight - currentHeight) / 2;
        
        if (shape === 'oval') {
          ctx.beginPath();
          ctx.ellipse(
            spotlightRect.x + spotlightWidth / 2,
            spotlightRect.y + spotlightHeight / 2,
            currentWidth / 2,
            currentHeight / 2,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else {
          ctx.fillRect(rectX, rectY, currentWidth, currentHeight);
        }
      }
      
      ctx.restore();

      // Add soft edge for circle shape
      if (shape === 'circle') {
        ctx.globalCompositeOperation = 'source-over';
        const radius = Math.min(spotlightWidth, spotlightHeight) / 2;
        const centerX = spotlightRect.x + spotlightWidth / 2;
        const centerY = spotlightRect.y + spotlightHeight / 2;
        const currentRadius = radius * easeOutCubic;
        
        const gradient = ctx.createRadialGradient(
          centerX, centerY, currentRadius * 0.8,
          centerX, centerY, currentRadius * 1.2
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${currentOpacity})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    // Auto-complete timer
    const duration = event.duration || 3000;
    const completeTimer = setTimeout(handleComplete, duration);

    return () => {
      clearTimeout(completeTimer);
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [event, containerRef, handleComplete]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 z-[1000] transition-opacity duration-300 mobile-spotlight-canvas ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          pointerEvents: 'none',
          touchAction: 'none',
        }}
      />
      
      {/* Tap to continue overlay */}
      <div
        className="fixed inset-0 z-[1001] mobile-event-overlay"
        onClick={handleComplete}
        style={{
          pointerEvents: 'auto',
          cursor: 'pointer',
        }}
      />
      
      {/* Instructions */}
      {isVisible && (
        <div 
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[1002] pointer-events-none"
          style={{ animation: 'fadeInUp 0.5s ease-out' }}
        >
          <p className="text-white text-sm text-center bg-black bg-opacity-50 px-4 py-2 rounded-full">
            {event.message || 'Tap anywhere to continue'}
          </p>
        </div>
      )}
    </>
  );
};

export default MobileSpotlightOverlay;