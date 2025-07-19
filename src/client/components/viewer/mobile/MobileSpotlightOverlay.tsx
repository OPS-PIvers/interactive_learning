import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TimelineEventData, InteractionType } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
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
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    setIsVisible(true);
    triggerHapticFeedback('light');

    // Animation parameters
    const dimPercentage = event.dimPercentage || 70;
    const radius = event.highlightRadius || 80;
    const shape = event.highlightShape || 'circle';
    
    let spotlightX = event.spotlightX || 50;
    let spotlightY = event.spotlightY || 50;
    let spotlightWidth = event.spotlightWidth || radius * 2;
    let spotlightHeight = event.spotlightHeight || radius * 2;

    // Animation state
    let currentOpacity = 0;
    let currentRadius = 0;
    const targetOpacity = dimPercentage / 100;
    const animationDuration = 500; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      currentOpacity = targetOpacity * easeOutCubic;
      currentRadius = radius * easeOutCubic;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw dimming overlay
      ctx.fillStyle = `rgba(0, 0, 0, ${currentOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate spotlight position relative to container
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.left + (spotlightX / 100) * containerRect.width;
      const centerY = containerRect.top + (spotlightY / 100) * containerRect.height;

      // Create spotlight cutout
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      
      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Rectangle spotlight
        const rectX = centerX - spotlightWidth / 2;
        const rectY = centerY - spotlightHeight / 2;
        ctx.fillRect(rectX, rectY, spotlightWidth, spotlightHeight);
      }
      
      ctx.restore();

      // Add soft edge
      ctx.globalCompositeOperation = 'source-over';
      const gradient = ctx.createRadialGradient(
        centerX, centerY, currentRadius * 0.8,
        centerX, centerY, currentRadius * 1.2
      );
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(1, `rgba(0, 0, 0, ${currentOpacity})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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