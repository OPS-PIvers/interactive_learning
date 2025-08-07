import React, { useRef, useCallback, useState, useEffect } from 'react';

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

export interface TouchGestureState {
  isActive: boolean;
  gestureType: 'none' | 'pan' | 'pinch' | 'tap';
  touches: TouchPoint[];
  initialDistance?: number;
  currentScale: number;
  panOffset: { x: number; y: number };
  initialPanOffset: { x: number; y: number };
}

export interface TouchContainerProps {
  children: React.ReactNode;
  className?: string;
  onPinchZoom?: (scale: number, centerX: number, centerY: number) => void;
  onPanGesture?: (deltaX: number, deltaY: number, scale: number) => void;
  onTap?: (x: number, y: number) => void;
  onGestureStart?: (gestureType: string) => void;
  onGestureEnd?: () => void;
  isolateTouch?: boolean;
  minScale?: number;
  maxScale?: number;
  enablePan?: boolean;
  enableZoom?: boolean;
  style?: React.CSSProperties;
}

/**
 * TouchContainer - Isolated touch event handling for mobile gestures
 * 
 * Provides pinch-to-zoom, pan, and tap recognition while preventing
 * event propagation to parent containers
 */
export const TouchContainer: React.FC<TouchContainerProps> = ({
  children,
  className = '',
  onPinchZoom,
  onPanGesture,
  onTap,
  onGestureStart,
  onGestureEnd,
  isolateTouch = true,
  minScale = 0.5,
  maxScale = 3.0,
  enablePan = true,
  enableZoom = true,
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gestureState, setGestureState] = useState<TouchGestureState>({
    isActive: false,
    gestureType: 'none',
    touches: [],
    currentScale: 1,
    panOffset: { x: 0, y: 0 },
    initialPanOffset: { x: 0, y: 0 }
  });

  // Calculate distance between two points
  const calculateDistance = useCallback((touch1: TouchPoint, touch2: TouchPoint): number => {
    const dx = touch2.x - touch1.x;
    const dy = touch2.y - touch1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate center point between two touches
  const calculateCenter = useCallback((touch1: TouchPoint, touch2: TouchPoint) => {
    return {
      x: (touch1.x + touch2.x) / 2,
      y: (touch1.y + touch2.y) / 2
    };
  }, []);

  // Convert touch event to touch points
  const getTouchPoints = useCallback((touches: TouchList, container: HTMLElement): TouchPoint[] => {
    const rect = container.getBoundingClientRect();
    const points: TouchPoint[] = [];
    
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      if (touch) {
        points.push({
          id: touch.identifier,
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        });
      }
    }
    
    return points;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isolateTouch) {
      e.preventDefault();
      e.stopPropagation();
    }

    const container = containerRef.current;
    if (!container) return;

    const touchPoints = getTouchPoints(e.touches, container);
    
    if (touchPoints.length === 1) {
      // Single touch - potential tap or pan start
      setGestureState(prev => ({
        ...prev,
        isActive: true,
        gestureType: 'tap',
        touches: touchPoints,
        initialPanOffset: { ...prev.panOffset }
      }));
      
      onGestureStart?.('tap');
    } else if (touchPoints.length === 2 && enableZoom) {
      // Two touches - pinch zoom
      if (touchPoints[0] && touchPoints[1]) {
        const distance = calculateDistance(touchPoints[0], touchPoints[1]);
        
        setGestureState(prev => ({
          ...prev,
          isActive: true,
          gestureType: 'pinch',
          touches: touchPoints,
          initialDistance: distance,
          initialPanOffset: { ...prev.panOffset }
        }));
        
        onGestureStart?.('pinch');
      }
    }
  }, [isolateTouch, getTouchPoints, calculateDistance, enableZoom, onGestureStart]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isolateTouch) {
      e.preventDefault();
      e.stopPropagation();
    }

    const container = containerRef.current;
    if (!container || !gestureState.isActive) return;

    const touchPoints = getTouchPoints(e.touches, container);

    if (gestureState.gestureType === 'tap' && touchPoints.length === 1) {
      // Check if we should switch to pan mode
      const touch = touchPoints[0];
      const initialTouch = gestureState.touches[0];
      
      if (touch && initialTouch) {
        const deltaX = touch.x - initialTouch.x;
        const deltaY = touch.y - initialTouch.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 10) { // Threshold for pan detection
          // Switch to pan mode
          setGestureState(prev => ({
            ...prev,
            gestureType: 'pan',
            touches: touchPoints
          }));
          
          onGestureStart?.('pan');
        }
      }
    } else if (gestureState.gestureType === 'pan' && touchPoints.length === 1 && enablePan) {
      // Handle panning
      const touch = touchPoints[0];
      const initialTouch = gestureState.touches[0];
      
      if (touch && initialTouch) {
        const deltaX = touch.x - initialTouch.x;
        const deltaY = touch.y - initialTouch.y;
        
        const newPanOffset = {
          x: gestureState.initialPanOffset.x + deltaX,
          y: gestureState.initialPanOffset.y + deltaY
        };
        
        setGestureState(prev => ({
          ...prev,
          panOffset: newPanOffset,
          touches: touchPoints
        }));
        
        onPanGesture?.(newPanOffset.x, newPanOffset.y, gestureState.currentScale);
      }
    } else if (gestureState.gestureType === 'pinch' && touchPoints.length === 2 && enableZoom) {
      // Handle pinch zoom
      if (touchPoints[0] && touchPoints[1]) {
        const currentDistance = calculateDistance(touchPoints[0], touchPoints[1]);
        const initialDistance = gestureState.initialDistance;
        
        if (initialDistance && initialDistance > 0) {
          const scaleChange = currentDistance / initialDistance;
          const newScale = Math.max(minScale, Math.min(maxScale, gestureState.currentScale * scaleChange));
          
          // Calculate zoom center
          const center = calculateCenter(touchPoints[0], touchPoints[1]);
          const containerRect = container.getBoundingClientRect();
          const centerX = (center.x / containerRect.width) * 100;
          const centerY = (center.y / containerRect.height) * 100;
          
          setGestureState(prev => ({
            ...prev,
            currentScale: newScale,
            touches: touchPoints
          }));
          
          onPinchZoom?.(newScale, centerX, centerY);
        }
      }
    }
  }, [
    isolateTouch, 
    gestureState, 
    getTouchPoints, 
    calculateDistance, 
    calculateCenter, 
    enablePan, 
    enableZoom, 
    minScale, 
    maxScale, 
    onPanGesture, 
    onPinchZoom, 
    onGestureStart
  ]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (isolateTouch) {
      e.preventDefault();
      e.stopPropagation();
    }

    const container = containerRef.current;
    if (!container) return;

    if (e.touches.length === 0) {
      // All touches ended
      if (gestureState.gestureType === 'tap' && gestureState.touches.length === 1) {
        // Handle tap
        const touch = gestureState.touches[0];
        if (touch) {
          onTap?.(touch.x, touch.y);
        }
      }
      
      setGestureState(prev => {
        const newState = { ...prev, isActive: false, gestureType: 'none' as const, touches: [] };
        delete newState.initialDistance;
        return newState;
      });
      
      onGestureEnd?.();
    } else {
      // Some touches remain - update touch points
      const remainingTouchPoints = getTouchPoints(e.touches, container);
      
      if (remainingTouchPoints.length === 1 && gestureState.gestureType === 'pinch') {
        // Switched from pinch to potential pan
        setGestureState(prev => {
          const newState = { ...prev, gestureType: 'tap' as const, touches: remainingTouchPoints };
          delete newState.initialDistance;
          return newState;
        });
      } else {
        setGestureState(prev => ({
          ...prev,
          touches: remainingTouchPoints
        }));
      }
    }
  }, [isolateTouch, gestureState, getTouchPoints, onTap, onGestureEnd]);

  // Add touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive: false to allow preventDefault
    const options = { passive: false };
    
    container.addEventListener('touchstart', handleTouchStart, options);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, options);
    container.addEventListener('touchcancel', handleTouchEnd, options);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const containerStyle: React.CSSProperties = {
    ...style,
    touchAction: isolateTouch ? 'none' : 'auto',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
    >
      {children}
    </div>
  );
};

export default TouchContainer;