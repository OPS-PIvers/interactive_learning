I'll search the project knowledge to understand your actual codebase and identify the specific issues.Based on my analysis of your codebase, I've identified the core issues causing pan/zoom and spotlight events to fail on mobile. Here's a comprehensive fix plan:

## Core Issues Identified

1. **Conflicting Transform Systems**: The `MobilePanZoomHandler` directly manipulates DOM elements while `useTouchGestures` manages transforms via React state
2. **Spotlight CSS Limitations**: The radial-gradient approach doesn't render properly on many mobile browsers
3. **Event System Conflicts**: Timeline pan/zoom events conflict with manual touch gestures
4. **Touch Event Blocking**: Multiple overlays with improper pointer-events configuration

## Fix Implementation

### 1. **Fix MobilePanZoomHandler to Use State-Based Transforms**

Update `src/client/components/mobile/MobilePanZoomHandler.tsx`:

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';
import { useEventCleanup } from '../../hooks/useEventCleanup';

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
      onTransformUpdate({ scale: 1, translateX: 0, translateY: 0 });
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
        translateY
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
        onClick={handleComplete}
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
```

### 2. **Fix MobileSpotlightOverlay with Canvas Rendering**

Update `src/client/components/mobile/MobileSpotlightOverlay.tsx`:

```typescript
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
        className={`fixed inset-0 z-[1000] transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          pointerEvents: 'none',
          touchAction: 'none',
        }}
      />
      
      {/* Tap to continue overlay */}
      <div
        className="fixed inset-0 z-[1001]"
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
```

### 3. **Update MobileEventRenderer to Coordinate with Touch Gestures**

Add coordination props to `src/client/components/mobile/MobileEventRenderer.tsx`:

```typescript
interface MobileEventRendererProps {
  events: TimelineEventData[];
  onEventComplete?: (eventId: string) => void;
  imageContainerRef: React.RefObject<HTMLElement>;
  isActive: boolean;
  // Add these for coordination
  currentTransform?: { scale: number; translateX: number; translateY: number };
  onTransformUpdate?: (transform: { scale: number; translateX: number; translateY: number }) => void;
  isGestureActive?: boolean;
}

// In the render method, pass these props to MobilePanZoomHandler:
case InteractionType.PAN_ZOOM:
case InteractionType.PAN_ZOOM_TO_HOTSPOT:
  return (
    <MobilePanZoomHandler
      key={`pan-zoom-${event.id}`}
      event={event}
      containerRef={imageContainerRef}
      onComplete={handleComplete}
      currentTransform={currentTransform}
      onTransformUpdate={onTransformUpdate}
    />
  );
```

### 4. **Add Critical CSS Fixes**

Add to your global styles or create `src/styles/mobile-fixes.css`:

```css
/* Fix for iOS Safari and Chrome mobile */
.mobile-spotlight-canvas {
  -webkit-transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  image-rendering: -webkit-optimize-contrast;
}

/* Prevent touch event issues in Google Apps Script iframe */
.mobile-event-overlay {
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Fix for transform conflicts */
.mobile-transformable-image {
  will-change: transform;
  -webkit-transform-style: preserve-3d;
  transform-style: preserve-3d;
}

/* Animation keyframes for mobile */
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
```

### 5. **Update Your HTML Meta Tags**

Ensure your `index.html` includes:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
```

## Key Points

1. **State-Based Transforms**: All transforms now go through React state management instead of direct DOM manipulation
2. **Canvas Rendering**: Spotlight uses Canvas API which works reliably on all mobile browsers
3. **Event Coordination**: Pan/zoom events from timeline now coordinate with manual gestures
4. **Proper Touch Handling**: Fixed pointer-events and z-index issues

This should resolve both your pan/zoom and spotlight rendering issues on mobile devices!