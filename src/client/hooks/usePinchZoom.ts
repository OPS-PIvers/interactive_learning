import { useState, useCallback, useRef, useEffect } from 'react';

interface ZoomState {
  scale: number;
  translateX: number;
  translateY: number;
  centerX: number;
  centerY: number;
  isZooming: boolean;
  isPanning: boolean;
}

interface PinchZoomConfig {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  boundaryPadding?: number;
  snapBackDuration?: number;
  containerWidth?: number;
  containerHeight?: number;
}

interface UsePinchZoomReturn {
  zoomState: ZoomState;
  transformStyle: React.CSSProperties;
  handlePinchZoom: (scale: number, centerX: number, centerY: number) => void;
  handlePanGesture: (deltaX: number, deltaY: number, currentScale: number) => void;
  handleGestureStart: (gestureType: string) => void;
  handleGestureEnd: () => void;
  resetZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  isZoomed: boolean;
}

/**
 * usePinchZoom - Hook for managing pinch-to-zoom and pan interactions
 * 
 * Provides comprehensive zoom and pan state management with boundary constraints
 */
export const usePinchZoom = (config: PinchZoomConfig = {}): UsePinchZoomReturn => {
  const {
    minScale = 0.5,
    maxScale = 3.0,
    initialScale = 1.0,
    boundaryPadding = 50,
    snapBackDuration = 300,
    containerWidth = 800,
    containerHeight = 600
  } = config;

  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: initialScale,
    translateX: 0,
    translateY: 0,
    centerX: 50,
    centerY: 50,
    isZooming: false,
    isPanning: false
  });

  const animationRef = useRef<number>();
  const gestureStartStateRef = useRef<ZoomState>();

  // Calculate boundary constraints for pan
  const calculateBoundaries = useCallback((scale: number) => {
    const scaledWidth = containerWidth * scale;
    const scaledHeight = containerHeight * scale;
    
    // Maximum translation to keep content visible
    const maxTranslateX = Math.max(0, (scaledWidth - containerWidth) / 2 + boundaryPadding);
    const maxTranslateY = Math.max(0, (scaledHeight - containerHeight) / 2 + boundaryPadding);
    
    return {
      minX: -maxTranslateX,
      maxX: maxTranslateX,
      minY: -maxTranslateY,
      maxY: maxTranslateY
    };
  }, [containerWidth, containerHeight, boundaryPadding]);

  // Constrain values within boundaries
  const constrainToBoundaries = useCallback((
    scale: number,
    translateX: number,
    translateY: number
  ) => {
    const constrainedScale = Math.max(minScale, Math.min(maxScale, scale));
    const boundaries = calculateBoundaries(constrainedScale);
    
    const constrainedX = Math.max(boundaries.minX, Math.min(boundaries.maxX, translateX));
    const constrainedY = Math.max(boundaries.minY, Math.min(boundaries.maxY, translateY));
    
    return {
      scale: constrainedScale,
      translateX: constrainedX,
      translateY: constrainedY
    };
  }, [minScale, maxScale, calculateBoundaries]);

  // Handle pinch zoom
  const handlePinchZoom = useCallback((scale: number, centerX: number, centerY: number) => {
    setZoomState(prev => {
      // Store gesture start state if this is the beginning of a zoom
      if (!prev.isZooming && !gestureStartStateRef.current) {
        gestureStartStateRef.current = { ...prev };
      }

      // Calculate zoom around the center point
      const prevScale = gestureStartStateRef.current?.scale || prev.scale;
      const scaleChange = scale / prevScale;
      
      // Calculate new translation to zoom around center point
      const centerXPx = (centerX / 100) * containerWidth;
      const centerYPx = (centerY / 100) * containerHeight;
      
      const prevTranslateX = gestureStartStateRef.current?.translateX || 0;
      const prevTranslateY = gestureStartStateRef.current?.translateY || 0;
      
      // Calculate new translation
      const newTranslateX = prevTranslateX + (centerXPx - containerWidth / 2) * (scaleChange - 1);
      const newTranslateY = prevTranslateY + (centerYPx - containerHeight / 2) * (scaleChange - 1);
      
      const constrained = constrainToBoundaries(scale, newTranslateX, newTranslateY);
      
      return {
        ...prev,
        scale: constrained.scale,
        translateX: constrained.translateX,
        translateY: constrained.translateY,
        centerX,
        centerY,
        isZooming: true
      };
    });
  }, [containerWidth, containerHeight, constrainToBoundaries]);

  // Handle pan gesture
  const handlePanGesture = useCallback((deltaX: number, deltaY: number, currentScale: number) => {
    setZoomState(prev => {
      const constrained = constrainToBoundaries(prev.scale, deltaX, deltaY);
      
      return {
        ...prev,
        translateX: constrained.translateX,
        translateY: constrained.translateY,
        isPanning: true
      };
    });
  }, [constrainToBoundaries]);

  // Handle gesture start
  const handleGestureStart = useCallback((gestureType: string) => {
    setZoomState(prev => ({
      ...prev,
      isZooming: gestureType === 'pinch',
      isPanning: gestureType === 'pan'
    }));
  }, []);

  // Handle gesture end with snap-back animation
  const handleGestureEnd = useCallback(() => {
    setZoomState(prev => {
      const newState = {
        ...prev,
        isZooming: false,
        isPanning: false
      };
      
      // Check if we need to snap back within boundaries
      const constrained = constrainToBoundaries(prev.scale, prev.translateX, prev.translateY);
      
      if (
        Math.abs(constrained.scale - prev.scale) > 0.01 ||
        Math.abs(constrained.translateX - prev.translateX) > 1 ||
        Math.abs(constrained.translateY - prev.translateY) > 1
      ) {
        // Animate snap back
        const startTime = Date.now();
        const startScale = prev.scale;
        const startX = prev.translateX;
        const startY = prev.translateY;
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / snapBackDuration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
          
          const currentScale = startScale + (constrained.scale - startScale) * easeOut;
          const currentX = startX + (constrained.translateX - startX) * easeOut;
          const currentY = startY + (constrained.translateY - startY) * easeOut;
          
          setZoomState(s => ({
            ...s,
            scale: currentScale,
            translateX: currentX,
            translateY: currentY
          }));
          
          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
        };
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = requestAnimationFrame(animate);
      }
      
      return newState;
    });
    
    // Clear gesture start state
    gestureStartStateRef.current = undefined;
  }, [constrainToBoundaries, snapBackDuration]);

  // Reset zoom to initial state
  const resetZoom = useCallback(() => {
    setZoomState({
      scale: initialScale,
      translateX: 0,
      translateY: 0,
      centerX: 50,
      centerY: 50,
      isZooming: false,
      isPanning: false
    });
  }, [initialScale]);

  // Zoom in by a fixed amount
  const zoomIn = useCallback(() => {
    setZoomState(prev => {
      const newScale = Math.min(maxScale, prev.scale * 1.25);
      const constrained = constrainToBoundaries(newScale, prev.translateX, prev.translateY);
      
      return {
        ...prev,
        scale: constrained.scale,
        translateX: constrained.translateX,
        translateY: constrained.translateY
      };
    });
  }, [maxScale, constrainToBoundaries]);

  // Zoom out by a fixed amount
  const zoomOut = useCallback(() => {
    setZoomState(prev => {
      const newScale = Math.max(minScale, prev.scale / 1.25);
      const constrained = constrainToBoundaries(newScale, prev.translateX, prev.translateY);
      
      return {
        ...prev,
        scale: constrained.scale,
        translateX: constrained.translateX,
        translateY: constrained.translateY
      };
    });
  }, [minScale, constrainToBoundaries]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Calculate transform style
  const transformStyle: React.CSSProperties = {
    transform: `translate(${zoomState.translateX}px, ${zoomState.translateY}px) scale(${zoomState.scale})`,
    transformOrigin: 'center center',
    transition: zoomState.isZooming || zoomState.isPanning ? 'none' : `transform ${snapBackDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
    willChange: 'transform'
  };

  return {
    zoomState,
    transformStyle,
    handlePinchZoom,
    handlePanGesture,
    handleGestureStart,
    handleGestureEnd,
    resetZoom,
    zoomIn,
    zoomOut,
    isZoomed: Math.abs(zoomState.scale - initialScale) > 0.01
  };
};