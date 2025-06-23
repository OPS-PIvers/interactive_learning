import { RefObject, useState, useCallback, useRef } from 'react';
import { ImageTransformState, getTouchDistance, getTouchCenter, getValidatedTransform } from '../utils/touchUtils';

// State for managing touch gestures
export interface TouchGestureState {
  startDistance: number | null; // For pinch-zoom: initial distance between two fingers
  startCenter: { x: number; y: number } | null; // For pinch-zoom: initial center point between two fingers
  startTransform: ImageTransformState | null; // For pinch-zoom & pan: image transform state at the start of the gesture
  lastTap: number; // Timestamp of the last tap, for double-tap detection
  isPanning: boolean; // True if a pan gesture is in progress
  isZooming: boolean; // True if a pinch-zoom gesture is in progress
  panStartPoint: { x: number; y: number } | null; // For pan: screen coordinates where pan started
}

// Return type for the hook, providing gesture handlers and current state
export interface TouchGestureHandlers {
  handleTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  // handleDoubleTap is implicitly handled by touchEnd/touchStart logic
  touchState: TouchGestureState;
  resetTouchState: () => void;
}

const DOUBLE_TAP_THRESHOLD = 300; // ms
const MIN_SCALE = 0.5;
const MAX_SCALE = 5.0;
// const PAN_THRESHOLD = 5; // pixels, to prevent accidental pans

export const useTouchGestures = (
  imageContainerRef: RefObject<HTMLDivElement>,
  imageTransform: ImageTransformState,
  setImageTransform: (transform: ImageTransformState | ((prevTransform: ImageTransformState) => ImageTransformState)) => void,
  setIsTransforming: (transforming: boolean) => void,
  options?: { minScale?: number; maxScale?: number; panThreshold?: number }
): TouchGestureHandlers => {
  const { minScale = MIN_SCALE, maxScale = MAX_SCALE } = options || {};

  const [touchState, setTouchState] = useState<TouchGestureState>({
    startDistance: null,
    startCenter: null,
    startTransform: null,
    lastTap: 0,
    isPanning: false,
    isZooming: false,
    panStartPoint: null,
  });

  // Ref to store the initial image transform for panning calculations relative to the start of the pan
  const panStartTransformRef = useRef<ImageTransformState | null>(null);


  const resetTouchState = useCallback(() => {
    setTouchState({
      startDistance: null,
      startCenter: null,
      startTransform: null,
      lastTap: touchState.lastTap, // Preserve lastTap for double tap detection across gestures
      isPanning: false,
      isZooming: false,
      panStartPoint: null,
    });
    panStartTransformRef.current = null;
    setIsTransforming(false);
  }, [touchState.lastTap, setIsTransforming]);


  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // e.preventDefault(); // Prevent default only if a gesture is active or starting
    const touches = e.touches;

    if (touches.length === 1) {
      // Single touch: potential tap or start of a pan
      const currentTime = new Date().getTime();
      const tapLength = currentTime - touchState.lastTap;

      if (tapLength < DOUBLE_TAP_THRESHOLD && tapLength > 0) {
        // Double tap detected
        e.preventDefault(); // Prevent default zoom on some devices
        const targetElement = imageContainerRef.current;
        if (!targetElement) return;

        const rect = targetElement.getBoundingClientRect();
        const touch = touches[0];

        // Calculate tap position relative to the container (for zoom origin)
        const tapX = touch.clientX - rect.left;
        const tapY = touch.clientY - rect.top;

        setImageTransform(prevTransform => {
          let newScale: number;
          let newTranslateX = prevTransform.translateX;
          let newTranslateY = prevTransform.translateY;

          if (prevTransform.scale > 1.5) { // If already zoomed in, zoom out
            newScale = 1;
            newTranslateX = 0;
            newTranslateY = 0;
          } else { // Zoom in to 2x or a specified doubleTapZoomFactor
            newScale = 2.0; // Or some other factor

            // Calculate translation to center the zoom on the tap point
            // The logic here needs to consider the current transform and zoom origin
            // (tapX, tapY) is the point on the container we want to be the center of the new view
            // prevTransform.translateX/Y are current offsets of the image content
            // prevTransform.scale is the current scale

            // Position of tap point on the *unscaled* image content
            const imageTapX = (tapX - prevTransform.translateX) / prevTransform.scale;
            const imageTapY = (tapY - prevTransform.translateY) / prevTransform.scale;

            // New translations to make (imageTapX, imageTapY) appear at (tapX, tapY) with newScale
            newTranslateX = tapX - imageTapX * newScale;
            newTranslateY = tapY - imageTapY * newScale;
          }

          const validated = getValidatedTransform({
            scale: newScale,
            translateX: newTranslateX,
            translateY: newTranslateY,
          }, { minScale, maxScale });

          setIsTransforming(true);
          setTimeout(() => setIsTransforming(false), 300); // Duration of zoom animation
          return validated;
        });

        // Reset lastTap to prevent triple tap from acting as double tap
        setTouchState(prev => ({ ...prev, lastTap: 0, panStartPoint: null, isPanning: false }));
      } else {
        // Regular single tap or start of a pan
        setTouchState(prev => ({
          ...prev,
          lastTap: currentTime,
          panStartPoint: { x: touches[0].clientX, y: touches[0].clientY },
          // isPanning will be set true on move if threshold is passed
        }));
        // Store the transform at the beginning of a potential pan
        panStartTransformRef.current = { ...imageTransform };
      }
    } else if (touches.length === 2) {
      // Two touches: start of a pinch-zoom
      e.preventDefault(); // Usually want to prevent default for two-finger gestures
      const distance = getTouchDistance(touches[0], touches[1]);
      const center = getTouchCenter(touches[0], touches[1]);
      setTouchState(prev => ({
        ...prev,
        startDistance: distance,
        startCenter: center,
        startTransform: { ...imageTransform }, // Store current transform
        isZooming: true,
        isPanning: false, // Zoom takes precedence over pan if both start simultaneously
        panStartPoint: null,
      }));
      setIsTransforming(true);
    }
  }, [touchState.lastTap, imageContainerRef, imageTransform, setImageTransform, setIsTransforming, minScale, maxScale]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;

    if (touchState.isZooming && touches.length === 2 && touchState.startDistance && touchState.startCenter && touchState.startTransform) {
      e.preventDefault();
      const currentDistance = getTouchDistance(touches[0], touches[1]);
      const scaleFactor = currentDistance / touchState.startDistance;
      let newScale = touchState.startTransform.scale * scaleFactor;

      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      // Calculate new translations to keep the zoom centered on the initial pinch center
      const currentCenter = getTouchCenter(touches[0], touches[1]);

      // Original pinch center relative to the image content at the start of the zoom
      const imagePinchX = (touchState.startCenter.x - touchState.startTransform.translateX) / touchState.startTransform.scale;
      const imagePinchY = (touchState.startCenter.y - touchState.startTransform.translateY) / touchState.startTransform.scale;

      // The new translation required to keep imagePinchX/Y at currentCenter with newScale
      let newTranslateX = currentCenter.x - imagePinchX * newScale;
      let newTranslateY = currentCenter.y - imagePinchY * newScale;

      // Apply transform
      setImageTransform(getValidatedTransform({
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      }, { minScale, maxScale }));

    } else if (!touchState.isZooming && touches.length === 1 && touchState.panStartPoint && panStartTransformRef.current) {
      // Single touch move: Pan
      // No pan threshold for now, can be added via options
      // const panThreshold = options?.panThreshold ?? PAN_THRESHOLD;
      const deltaX = touches[0].clientX - touchState.panStartPoint.x;
      const deltaY = touches[0].clientY - touchState.panStartPoint.y;

      // if (Math.abs(deltaX) > panThreshold || Math.abs(deltaY) > panThreshold || touchState.isPanning) {
      if (imageTransform.scale <= 1) { // Pan is disabled if not zoomed in (scale <= 1)
        // Allow native scroll or other default browser behavior if not zoomed.
        return;
      }
      e.preventDefault(); // Prevent scroll if panning on zoomed image

      if (!touchState.isPanning) {
        setTouchState(prev => ({ ...prev, isPanning: true }));
        setIsTransforming(true); // Indicate that a transform-affecting gesture is active
      }

      const initialTransform = panStartTransformRef.current;
      const newTranslateX = initialTransform.translateX + deltaX;
      const newTranslateY = initialTransform.translateY + deltaY;

      setImageTransform(prev => getValidatedTransform({
        ...prev, // Preserve scale and other properties
        translateX: newTranslateX,
        translateY: newTranslateY,
      }, { minScale, maxScale }));
      // }
    }
  }, [touchState, imageTransform.scale, setImageTransform, setIsTransforming, minScale, maxScale]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // If a gesture was active (zooming or panning), prevent click/tap handlers on end.
    if (touchState.isZooming || touchState.isPanning) {
        e.preventDefault();
    }

    // Reset state for the ended gesture
    if (touchState.isZooming) {
      setTouchState(prev => ({ ...prev, isZooming: false, startDistance: null, startCenter: null, startTransform: null }));
    }
    if (touchState.isPanning) {
      setTouchState(prev => ({ ...prev, isPanning: false, panStartPoint: null }));
      panStartTransformRef.current = null;
    }

    // If all touches are lifted, mark transforming as false
    if (e.touches.length === 0) {
      setIsTransforming(false);
    }

    // Note: `lastTap` is preserved for double tap detection logic in `handleTouchStart`.
    // If it was a quick tap (not a pan or zoom), `lastTap` would have been updated in `handleTouchStart`.
    // If it was the end of a pan/zoom, `lastTap` remains from before that gesture.
  }, [touchState.isZooming, touchState.isPanning, setIsTransforming]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    touchState,
    resetTouchState,
  };
};
