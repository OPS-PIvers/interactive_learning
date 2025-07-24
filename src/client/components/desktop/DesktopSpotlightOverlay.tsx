import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TimelineEventData, HotspotData } from '../../../shared/types';
import { getActualImageVisibleBoundsRelative } from '../../utils/imageBounds';

interface DesktopSpotlightOverlayProps {
  event: TimelineEventData;
  containerRef: React.RefObject<HTMLElement>;
  onComplete: () => void;
  hotspots?: HotspotData[];
  imageElement?: HTMLImageElement | null;
}

const DesktopSpotlightOverlay: React.FC<DesktopSpotlightOverlayProps> = ({
  event,
  containerRef,
  onComplete,
  hotspots = [],
  imageElement
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const animationRef = useRef<number>();

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setTimeout(onComplete, 300);
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    setIsVisible(true);

    // Get spotlight coordinates - use stored coordinates or find target hotspot
    let spotlightX = event.spotlightX || 50; // Default to center
    let spotlightY = event.spotlightY || 50; // Default to center

    // If we have a target hotspot, use its position
    if (event.targetId) {
      const targetHotspot = hotspots.find(h => h.id === event.targetId);
      if (targetHotspot) {
        spotlightX = targetHotspot.x;
        spotlightY = targetHotspot.y;
        if (localStorage.getItem('debug_spotlight') === 'true') {
          console.log('[DesktopSpotlight] Using hotspot position:', { 
            spotlightX, 
            spotlightY, 
            hotspotId: targetHotspot.id,
            fullHotspot: targetHotspot 
          });
        }
      } else {
        console.warn('[DesktopSpotlight] Target hotspot not found:', event.targetId);
      }
    }

    if (localStorage.getItem('debug_spotlight') === 'true') {
      console.log('[DesktopSpotlight] Final spotlight coordinates:', { spotlightX, spotlightY });
    }

    // Animation parameters
    const spotlightWidth = event.spotlightWidth || 150;
    const spotlightHeight = event.spotlightHeight || 150;
    const shape = event.spotlightShape || 'circle';
    const dimPercentage = event.backgroundDimPercentage || 70;
    
    // Calculate spotlight position in pixels
    let centerX: number;
    let centerY: number;

    if (imageElement) {
      // Get actual image bounds within the container (same function as pan/zoom and hotspots)
      const imageBounds = getActualImageVisibleBoundsRelative(imageElement, container);
      if (imageBounds) {
        // Convert percentage coordinates to pixel coordinates within image bounds
        // This matches exactly how hotspots and pan/zoom calculate positions
        const imageX = (spotlightX / 100) * imageBounds.width;
        const imageY = (spotlightY / 100) * imageBounds.height;
        
        // Add image offset to get container-relative coordinates
        // NOTE: imageBounds.x and imageBounds.y are already container-relative from getActualImageVisibleBoundsRelative
        centerX = imageBounds.x + imageX;
        centerY = imageBounds.y + imageY;
        
        // Debug logging can be enabled by setting localStorage.debug_spotlight = 'true'
        if (localStorage.getItem('debug_spotlight') === 'true') {
          console.log('[DesktopSpotlight] Image-based positioning (using relative bounds):', {
            imageBounds,
            percentageCoords: { spotlightX, spotlightY },
            imageCoords: { imageX, imageY },
            finalCoords: { centerX, centerY }
          });
        }
      } else {
        // Fallback to container-relative positioning
        const rect = container.getBoundingClientRect();
        centerX = (spotlightX / 100) * rect.width;
        centerY = (spotlightY / 100) * rect.height;
        
        if (localStorage.getItem('debug_spotlight') === 'true') {
          console.log('[DesktopSpotlight] Container-based positioning (fallback):', {
            containerSize: { width: rect.width, height: rect.height },
            percentageCoords: { spotlightX, spotlightY },
            finalCoords: { centerX, centerY }
          });
        }
      }
    } else {
      // No image element, use container-relative positioning
      const rect = container.getBoundingClientRect();
      centerX = (spotlightX / 100) * rect.width;
      centerY = (spotlightY / 100) * rect.height;
      
      if (localStorage.getItem('debug_spotlight') === 'true') {
        console.log('[DesktopSpotlight] Container-only positioning:', {
          containerSize: { width: rect.width, height: rect.height },
          percentageCoords: { spotlightX, spotlightY },
          finalCoords: { centerX, centerY }
        });
      }
    }

    // Animation state
    let currentOpacity = 0;
    const targetOpacity = dimPercentage / 100;
    const animationDuration = 500; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Ease-in-out animation
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      currentOpacity = easeProgress * targetOpacity;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw dimmed background with spotlight cutout
      ctx.save();
      
      // Fill entire canvas with dim overlay
      ctx.fillStyle = `rgba(0, 0, 0, ${currentOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create spotlight cutout using composite operation
      ctx.globalCompositeOperation = 'destination-out';
      
      if (shape === 'circle') {
        // Draw circle spotlight
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(spotlightWidth, spotlightHeight) / 2, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // Draw rectangular spotlight
        ctx.fillRect(
          centerX - spotlightWidth / 2,
          centerY - spotlightHeight / 2,
          spotlightWidth,
          spotlightHeight
        );
      }

      ctx.restore();

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete, start auto-completion timer
        const duration = event.duration || 3000;
        setTimeout(handleComplete, duration);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [event, containerRef, handleComplete, hotspots, imageElement]);

  const handleOverlayClick = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: 'auto' }}
      onClick={handleOverlayClick}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: 'pointer' }}
      />
      
      {/* Instructions overlay */}
      <div
        className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
        style={{ animation: 'fadeInDown 0.5s ease-out' }}
      >
        <p className="text-white text-sm text-center bg-black bg-opacity-70 px-4 py-2 rounded-full">
          {event.message || 'Click anywhere to continue...'}
        </p>
      </div>
    </div>
  );
};

export default DesktopSpotlightOverlay;