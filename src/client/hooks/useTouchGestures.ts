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
  }
) => {
  const {
    minScale = 0.5,
    maxScale = 5,
    doubleTapZoomFactor = 2,
  } = options || {};

  const gestureStateRef = useRef<TouchGestureState>({
    startDistance: null,
    startCenter: null,
    startTransform: null,
    lastTap: 0,
    isPanning: false,
    panStartCoords: null,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;
    const now = Date.now();
    const gestureState = gestureStateRef.current;

    if (touches.length === 1) {
      // Potential single tap or start of a pan
      gestureState.panStartCoords = { x: touches[0].clientX, y: touches[0].clientY };
      gestureState.startTransform = { ...imageTransform }; // Capture transform at pan start

      // Double tap detection
      if (now - gestureState.lastTap < DOUBLE_TAP_THRESHOLD) {
        // This is a double tap
        if (shouldPreventDefault(e.nativeEvent, 'tap')) {
          e.preventDefault();
        }
        setIsTransforming(true);

        const targetElement = imageContainerRef.current;
        if (!targetElement) return;
        const rect = targetElement.getBoundingClientRect();
        const tapX = touches[0].clientX - rect.left;
        const tapY = touches[0].clientY - rect.top;

        setImageTransform(prevTransform => {
          let nextScale: number;
          let nextTranslateX: number;
          let nextTranslateY: number;

          if (prevTransform.scale > 1) { // If already zoomed, zoom out
            nextScale = 1;
            nextTranslateX = 0;
            nextTranslateY = 0;
          } else { // Zoom in
            nextScale = Math.min(maxScale, prevTransform.scale * doubleTapZoomFactor);
            // Center zoom on tap point
            // Formula: newTranslate = tapPoint - (tapPoint - oldTranslate) * (newScale / oldScale)
            nextTranslateX = tapX - (tapX - prevTransform.translateX) * (nextScale / prevTransform.scale);
            nextTranslateY = tapY - (tapY - prevTransform.translateY) * (nextScale / prevTransform.scale);
          }

          return getValidatedTransform({
            scale: nextScale,
            translateX: nextTranslateX,
            translateY: nextTranslateY,
          }, { minScale, maxScale });
        });

        gestureState.lastTap = 0; // Reset lastTap to prevent triple tap zoom
        setTimeout(() => setIsTransforming(false), 300); // Animation duration
        return;
      }
      gestureState.lastTap = now;
    } else if (touches.length === 2) {
      // Pinch-to-zoom
      if (shouldPreventDefault(e.nativeEvent, 'zoom')) {
        e.preventDefault();
      }
      setIsTransforming(true);
      gestureState.startDistance = getTouchDistance(touches[0], touches[1]);
      gestureState.startCenter = getTouchCenter(touches[0], touches[1]);
      gestureState.startTransform = { ...imageTransform };
      gestureState.isPanning = false; // Stop panning if it was active
    }
  }, [imageTransform, setImageTransform, setIsTransforming, minScale, maxScale, doubleTapZoomFactor, imageContainerRef]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;
    const gestureState = gestureStateRef.current;

    if (touches.length === 1 && gestureState.panStartCoords && gestureState.startTransform) {
      // Single-finger pan
      const deltaX = touches[0].clientX - gestureState.panStartCoords.x;
      const deltaY = touches[0].clientY - gestureState.panStartCoords.y;

      if (!gestureState.isPanning && (Math.abs(deltaX) > PAN_THRESHOLD_PIXELS || Math.abs(deltaY) > PAN_THRESHOLD_PIXELS)) {
        gestureState.isPanning = true;
         if (shouldPreventDefault(e.nativeEvent, 'pan')) {
          e.preventDefault(); // Start preventing default once panning is confirmed
        }
      }

      if (gestureState.isPanning) {
        if (shouldPreventDefault(e.nativeEvent, 'pan')) {
          e.preventDefault();
        }
        //setIsTransforming(true); // Panning is a continuous transform

        const newTranslateX = gestureState.startTransform.translateX + deltaX;
        const newTranslateY = gestureState.startTransform.translateY + deltaY;

        setImageTransform(prev => getValidatedTransform({
          ...prev,
          translateX: newTranslateX,
          translateY: newTranslateY,
        }, { minScale, maxScale }));
      }
    } else if (touches.length === 2 && gestureState.startDistance && gestureState.startCenter && gestureState.startTransform) {
      // Pinch-to-zoom
      if (shouldPreventDefault(e.nativeEvent, 'zoom')) {
        e.preventDefault();
      }
      //setIsTransforming(true); // Zooming is a continuous transform

      const currentDistance = getTouchDistance(touches[0], touches[1]);
      const scaleChange = currentDistance / gestureState.startDistance;
      const newScale = gestureState.startTransform.scale * scaleChange;

      // Calculate new translation to keep zoom centered on the pinch center
      // The pinch center relative to the image container (startCenter is screen coords)
      const targetElement = imageContainerRef.current;
      if (!targetElement) return;
      const rect = targetElement.getBoundingClientRect();
      const pinchCenterX = gestureState.startCenter.x - rect.left;
      const pinchCenterY = gestureState.startCenter.y - rect.top;

      // Formula: newTranslate = pinchCenter - (pinchCenter - oldTranslate) * (newScale / oldScale)
      const newTranslateX = pinchCenterX - (pinchCenterX - gestureState.startTransform.translateX) * (newScale / gestureState.startTransform.scale);
      const newTranslateY = pinchCenterY - (pinchCenterY - gestureState.startTransform.translateY) * (newScale / gestureState.startTransform.scale);

      setImageTransform(
        getValidatedTransform({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY,
        }, { minScale, maxScale })
      );
    }
  }, [setImageTransform, setIsTransforming, minScale, maxScale, imageContainerRef]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const gestureState = gestureStateRef.current;
    // Prevent click if it was a pan
    if (gestureState.isPanning && shouldPreventDefault(e.nativeEvent, 'pan')) {
       e.preventDefault();
    }

    // Reset gesture state
    gestureState.startDistance = null;
    gestureState.startCenter = null;
    gestureState.startTransform = null;
    gestureState.isPanning = false;
    gestureState.panStartCoords = null;

    // If it was a transform, set transforming to false after a short delay for animation
    // This is now handled per gesture type for better control
    if (e.touches.length < 2 && gestureStateRef.current.startDistance !== null) { // Was zooming
        setTimeout(() => setIsTransforming(false), 50); // Shorter delay for zoom end
    }
    if (e.touches.length < 1 && gestureStateRef.current.isPanning) { // Was panning
        setTimeout(() => setIsTransforming(false), 50);
    }
    // Double tap transforming is handled in touchStart

  }, [setIsTransforming]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    // touchState can be exposed if needed by the component, though internal ref is often enough
    // touchState: gestureStateRef.current
  };
};
