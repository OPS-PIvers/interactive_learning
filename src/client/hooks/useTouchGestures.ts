import { RefObject, useCallback, useRef, useState } from 'react';
import { ImageTransformState } from '../../shared/types';
import { getTouchDistance, getTouchCenter, getValidatedTransform, shouldPreventDefault } from '../utils/touchUtils';

const DOUBLE_TAP_THRESHOLD = 300; // ms
const PAN_THRESHOLD_PIXELS = 5; // For distinguishing tap from pan

interface TouchGestureState {
  startDistance: number | null;
  startCenter: { x: number; y: number } | null;
  startTransform: ImageTransformState | null;
  lastTap: number; // Timestamp of the last tap
  isPanning: boolean;
  panStartCoords: { x: number; y: number } | null;
}

export interface TouchGestureHandlers {
  handleTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  // handleDoubleTap is implicitly handled by touchEnd/touchStart logic
}

export const useTouchGestures = (
  imageContainerRef: RefObject<HTMLDivElement>,
  imageTransform: ImageTransformState,
  setImageTransform: (transform: ImageTransformState | ((prevTransform: ImageTransformState) => ImageTransformState)) => void,
  setIsTransforming: (transforming: boolean) => void,
  options?: {
    minScale?: number;
    maxScale?: number;
    doubleTapZoomFactor?: number;
    isDragging?: boolean; // Add isDragging awareness
    isEditing?: boolean; // Add editing mode awareness
  }
) => {
  const {
    minScale = 0.5,
    maxScale = 5,
    doubleTapZoomFactor = 2,
    isDragging = false,
    isEditing = false,
  } = options || {};

  const gestureStateRef = useRef<TouchGestureState>({
    startDistance: null,
    startCenter: null,
    startTransform: null,
    lastTap: 0,
    isPanning: false,
    panStartCoords: null,
  });

  // Ref to store the timeout ID for setIsTransforming(false)
  const transformTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Early return for better performance - disable container gestures when hotspot is being dragged or in modal editing
    if (isDragging || isEditing) {
      return;
    }
    
    const touches = e.touches;
    const touchCount = touches.length;
    const now = Date.now();
    const gestureState = gestureStateRef.current;

    if (touchCount === 1) {
      const touch = touches[0];
      // Potential single tap or start of a pan
      gestureState.panStartCoords = { x: touch.clientX, y: touch.clientY };
      gestureState.startTransform = { ...imageTransform }; // Capture transform at pan start

      // Double tap detection - optimize with early return
      const timeSinceLastTap = now - gestureState.lastTap;
      if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD) {
        // This is a double tap - handle immediately
        if (shouldPreventDefault(e.nativeEvent, 'tap')) {
          e.preventDefault();
        }
        setIsTransforming(true);

        const targetElement = imageContainerRef.current;
        if (!targetElement) {
          gestureState.lastTap = 0;
          return;
        }
        
        const rect = targetElement.getBoundingClientRect();
        const tapX = touch.clientX - rect.left;
        const tapY = touch.clientY - rect.top;

        setImageTransform(prevTransform => {
          // Optimize zoom logic
          const isZoomedIn = prevTransform.scale > 1;
          if (isZoomedIn) {
            // Zoom out to fit
            return getValidatedTransform({
              scale: 1,
              translateX: 0,
              translateY: 0,
            }, { minScale, maxScale });
          } else {
            // Zoom in centered on tap point
            const nextScale = Math.min(maxScale, prevTransform.scale * doubleTapZoomFactor);
            // Formula: newTranslate = tapPoint - (tapPoint - oldTranslate) * (newScale / oldScale)
            const scaleRatio = nextScale / prevTransform.scale;
            const nextTranslateX = tapX - (tapX - prevTransform.translateX) * scaleRatio;
            const nextTranslateY = tapY - (tapY - prevTransform.translateY) * scaleRatio;

            return getValidatedTransform({
              scale: nextScale,
              translateX: nextTranslateX,
              translateY: nextTranslateY,
            }, { minScale, maxScale });
          }
        });

        gestureState.lastTap = 0; // Reset to prevent triple tap
        if (transformTimeoutIdRef.current) {
          clearTimeout(transformTimeoutIdRef.current);
        }
        transformTimeoutIdRef.current = setTimeout(() => setIsTransforming(false), 300); // Animation duration
        return;
      }
      gestureState.lastTap = now;
    } else if (touchCount === 2) {
      // Pinch-to-zoom initialization
      if (shouldPreventDefault(e.nativeEvent, 'zoom')) {
        e.preventDefault();
      }
      setIsTransforming(true);
      
      // Cache values for performance
      const touch1 = touches[0];
      const touch2 = touches[1];
      gestureState.startDistance = getTouchDistance(touch1, touch2);
      gestureState.startCenter = getTouchCenter(touch1, touch2);
      gestureState.startTransform = { ...imageTransform };
      gestureState.isPanning = false; // Stop panning if it was active
    }
  }, [imageTransform, setImageTransform, setIsTransforming, minScale, maxScale, doubleTapZoomFactor, imageContainerRef, isDragging, isEditing]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Early return for better performance - disable container gestures when hotspot is being dragged or in modal editing
    if (isDragging || isEditing) {
      return;
    }
    
    const touches = e.touches;
    const touchCount = touches.length;
    const gestureState = gestureStateRef.current;

    if (touchCount === 1 && gestureState.panStartCoords && gestureState.startTransform) {
      // Single-finger pan - optimize coordinate access
      const touch = touches[0];
      const deltaX = touch.clientX - gestureState.panStartCoords.x;
      const deltaY = touch.clientY - gestureState.panStartCoords.y;

      // Check if panning should start (threshold detection)
      if (!gestureState.isPanning) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        if (absDeltaX > PAN_THRESHOLD_PIXELS || absDeltaY > PAN_THRESHOLD_PIXELS) {
          gestureState.isPanning = true;
          if (shouldPreventDefault(e.nativeEvent, 'pan')) {
            e.preventDefault(); // Start preventing default once panning is confirmed
          }
        }
      }

      if (gestureState.isPanning) {
        if (shouldPreventDefault(e.nativeEvent, 'pan')) {
          e.preventDefault();
        }

        // Optimize transform calculation - avoid spread operator
        const newTranslateX = gestureState.startTransform.translateX + deltaX;
        const newTranslateY = gestureState.startTransform.translateY + deltaY;

        setImageTransform(prev => getValidatedTransform({
          scale: prev.scale,
          translateX: newTranslateX,
          translateY: newTranslateY,
        }, { minScale, maxScale }));
      }
    } else if (touchCount === 2 && gestureState.startDistance && gestureState.startCenter && gestureState.startTransform) {
      // Pinch-to-zoom - optimize touch access
      if (shouldPreventDefault(e.nativeEvent, 'zoom')) {
        e.preventDefault();
      }

      const touch1 = touches[0];
      const touch2 = touches[1];
      const currentDistance = getTouchDistance(touch1, touch2);
      const scaleChange = currentDistance / gestureState.startDistance;
      const newScale = gestureState.startTransform.scale * scaleChange;

      // Calculate new translation to keep zoom centered on the pinch center
      const targetElement = imageContainerRef.current;
      if (!targetElement) return;
      
      const rect = targetElement.getBoundingClientRect();
      const pinchCenterX = gestureState.startCenter.x - rect.left;
      const pinchCenterY = gestureState.startCenter.y - rect.top;

      // Optimize translation calculation
      const scaleRatio = newScale / gestureState.startTransform.scale;
      const newTranslateX = pinchCenterX - (pinchCenterX - gestureState.startTransform.translateX) * scaleRatio;
      const newTranslateY = pinchCenterY - (pinchCenterY - gestureState.startTransform.translateY) * scaleRatio;

      setImageTransform(
        getValidatedTransform({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY,
        }, { minScale, maxScale })
      );
    }
  }, [setImageTransform, minScale, maxScale, imageContainerRef, isDragging, isEditing]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Early return for better performance - disable container gestures when hotspot is being dragged or in modal editing
    if (isDragging || isEditing) {
      return;
    }
    
    const gestureState = gestureStateRef.current;
    const wasPanning = gestureState.isPanning;
    const wasZooming = gestureState.startDistance !== null;
    
    // Prevent click if it was a pan
    if (wasPanning && shouldPreventDefault(e.nativeEvent, 'pan')) {
       e.preventDefault();
    }

    // Reset gesture state efficiently - batch updates
    gestureState.startDistance = null;
    gestureState.startCenter = null;
    gestureState.startTransform = null;
    gestureState.isPanning = false;
    gestureState.panStartCoords = null;

    // Optimize transform state updates - only call setIsTransforming if needed
    const remainingTouches = e.touches.length;
    if (transformTimeoutIdRef.current) {
      clearTimeout(transformTimeoutIdRef.current);
    }

    if (wasZooming && remainingTouches < 2) {
        // Was zooming and now fewer than 2 touches
        transformTimeoutIdRef.current = setTimeout(() => setIsTransforming(false), 50);
    } else if (wasPanning && remainingTouches < 1) {
        // Was panning and now no touches
        transformTimeoutIdRef.current = setTimeout(() => setIsTransforming(false), 50);
    }
    // Double tap transforming is handled in touchStart with its own timeout

  }, [setIsTransforming, isDragging, isEditing]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    // touchState can be exposed if needed by the component, though internal ref is often enough
    // touchState: gestureStateRef.current
  };
};
