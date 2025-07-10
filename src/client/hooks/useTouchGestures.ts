import { RefObject, useCallback, useEffect, useRef } from 'react';
import { ImageTransformState } from '../../shared/types';
import { getTouchDistance, getTouchCenter, getValidatedTransform, shouldPreventDefault } from '../utils/touchUtils';

/**
 * Custom hook for handling touch gestures (pan, pinch-zoom, double-tap zoom) on an HTML element.
 * Provides handlers for touch events and manages gesture state.
 *
 * Features:
 * - Single-finger pan.
 * - Two-finger pinch-to-zoom:
 *   - Includes momentum physics for smoother deceleration after gesture ends.
 *   - Scale is bounded by `minScale` and `maxScale`.
 * - Double-tap to zoom:
 *   - Toggles between fit-to-screen (scale 1) and a configurable zoom level (`doubleTapZoomFactor`).
 *   - Centers zoom on the tap point.
 * - Throttled touch move handling for performance.
 * - Option to disable gestures when other interactions (e.g., hotspot dragging) are active.
 * - Ignores gestures originating on hotspot elements to allow their own event handling.
 *
 * @param imageContainerRef Ref to the container element on which gestures are detected.
 * @param imageTransform Current transform state of the image.
 * @param setImageTransform Callback to update the image transform state.
 * @param setIsTransforming Callback to indicate if a gesture/animation is actively changing the transform.
 * @param options Configuration options (minScale, maxScale, doubleTapZoomFactor, etc.).
 * @returns Touch event handlers and a method to check if a gesture is active.
 */
// Throttle utility function for performance optimization
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } => {
  let timeoutId: number | null = null;
  let lastExecTime = 0;

  const throttled = ((...args: Parameters<T>) => {
    const currentTime = Date.now();
    const timeSinceLastExec = currentTime - lastExecTime;

    if (timeSinceLastExec > delay) {
      lastExecTime = currentTime;
      // Clear any existing timeout that would execute the last call
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      return func(...args);
    } else {
      // If a timeout is already set, clear it to reset the timer with the new call
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Set a new timeout to execute after the remaining delay
      timeoutId = window.setTimeout(() => {
        lastExecTime = Date.now();
        func(...args);
        timeoutId = null; // Clear the timeoutId after execution
      }, delay - timeSinceLastExec);
    }
  }) as T & { cancel: () => void };

  // Add cancel method to clear pending timeouts
  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
};

const DOUBLE_TAP_THRESHOLD = 300; // ms
const PAN_THRESHOLD_PIXELS = 5; // For distinguishing tap from pan

// Constants for momentum and animation
const DAMPING_FACTOR = 0.92; // Determines how quickly momentum fades
const VELOCITY_THRESHOLD = 0.005; // Below this, momentum stops for scale and position
const MIN_VELOCITY_FOR_MOMENTUM = 0.05; // Minimum velocity to trigger momentum animation

interface TouchGestureState {
  startDistance: number | null;
  startCenter: { x: number; y: number } | null;
  startTransform: ImageTransformState | null;
  lastTap: number; // Timestamp of the last tap
  isPanning: boolean;
  panStartCoords: { x: number; y: number } | null;
  isActive: boolean; // Track if any gesture is currently active

  // For momentum
  lastMoveTimestamp: number | null;
  scaleVelocity: number;
  translateXVelocity: number;
  translateYVelocity: number;
  animationFrameId: number | null;
}

export interface TouchGestureHandlers {
  handleTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  isGestureActive: () => boolean; // Add method to check if gesture is active
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
    isDragActive?: boolean; // Add drag mode awareness for hotspot dragging
  }
) => {
  const {
    minScale = 0.5,
    maxScale = 5,
    doubleTapZoomFactor = 2,
    isDragging = false,
    isEditing = false,
    isDragActive = false,
  } = options || {};

  // Add gesture coordination
  // Simplified touch handling without complex gesture coordination

  const gestureStateRef = useRef<TouchGestureState>({
    startDistance: null,
    startCenter: null,
    startTransform: null,
    lastTap: 0,
    isPanning: false,
    panStartCoords: null,
    isActive: false,
    // Momentum defaults
    lastMoveTimestamp: null,
    scaleVelocity: 0,
    translateXVelocity: 0,
    translateYVelocity: 0,
    animationFrameId: null,
  });
  const doubleTapTimeoutRef = useRef<number | null>(null);
  const touchEndTimeoutRef = useRef<number | null>(null);
  const throttledTouchMoveRef = useRef<((e: React.TouchEvent<HTMLDivElement>) => void) & { cancel: () => void } | null>(null);

  // Add gesture cleanup function
  const cleanupGesture = useCallback(() => {
    const gestureState = gestureStateRef.current;
    gestureState.startDistance = null;
    gestureState.startCenter = null;
    gestureState.startTransform = null;
    gestureState.isPanning = false;
    gestureState.panStartCoords = null;
    gestureState.isActive = false;
    // Reset momentum state as well
    gestureState.lastMoveTimestamp = null;
    gestureState.scaleVelocity = 0;
    gestureState.translateXVelocity = 0;
    gestureState.translateYVelocity = 0;
    if (gestureState.animationFrameId) {
      cancelAnimationFrame(gestureState.animationFrameId);
      gestureState.animationFrameId = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const gestureState = gestureStateRef.current;
    // Cancel any ongoing momentum animation when a new touch starts
    if (gestureState.animationFrameId) {
      cancelAnimationFrame(gestureState.animationFrameId);
      gestureState.animationFrameId = null;
      setIsTransforming(false); // Ensure transforming state is reset
    }

    try {
    // Check if touch is on a hotspot element - if so, don't interfere
    const target = e.target as HTMLElement;
    const isHotspotElement = target?.closest('[data-hotspot-id]') || 
                            target?.hasAttribute('data-hotspot-id') ||
                            target?.closest('.hotspot-element') ||
                            target?.classList.contains('hotspot-element');
    
    if (isHotspotElement) {
      console.log('Debug [useTouchGestures]: Touch on hotspot element - skipping container gestures');
      return;
    }

    // Early return for better performance - disable container gestures when hotspot is being dragged or in modal editing
    if (isDragging || isEditing || isDragActive) {
      console.log('Debug [useTouchGestures]: Touch start blocked', {
        isDragging,
        isEditing,
        isDragActive,
        timestamp: Date.now()
      });
      return;
    }
    
    const gestureState = gestureStateRef.current;
    // Prevent race conditions by checking if another gesture is already active
    if (gestureState.isActive) {
      console.log('Debug [useTouchGestures]: Touch start blocked - gesture already active');
      return;
    }
    
    const touches = e.touches;
    const touchCount = touches.length;
    const now = Date.now();

    if (touchCount === 1) {
      const touch = touches[0];
      
      // Double tap detection - optimize with early return
      const timeSinceLastTap = now - gestureState.lastTap;
      if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD) {
        // This is a double tap - try to claim zoom gesture
        // Double tap zoom
        
        // Mark gesture as active
        gestureState.isActive = true;
        
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
        if (doubleTapTimeoutRef.current) {
          clearTimeout(doubleTapTimeoutRef.current);
        }
        doubleTapTimeoutRef.current = window.setTimeout(() => {
          setIsTransforming(false);
        }, 300); // Animation duration
        return;
      }
      
      // Single tap - mark gesture as potentially active
      gestureState.isActive = true;
      // Potential single tap or start of a pan
      gestureState.panStartCoords = { x: touch.clientX, y: touch.clientY };
      gestureState.startTransform = { ...imageTransform }; // Capture transform at pan start
      gestureState.lastTap = now;
    } else if (touchCount === 2) {
      // Pinch-to-zoom initialization - try to claim zoom gesture
      // Start pinch zoom
      
      if (shouldPreventDefault(e.nativeEvent, 'zoom')) {
        e.preventDefault();
      }
      setIsTransforming(true);
      
      // Mark gesture as active
      gestureState.isActive = true;
      // Cache values for performance
      const touch1 = touches[0];
      const touch2 = touches[1];
      gestureState.startDistance = getTouchDistance(touch1, touch2);
      gestureState.startCenter = getTouchCenter(touch1, touch2);
      gestureState.startTransform = { ...imageTransform }; // Current image transform
      gestureState.isPanning = false; // Stop panning if it was active

      // Reset velocities and timestamp for pinch-zoom
      gestureState.scaleVelocity = 0;
      gestureState.translateXVelocity = 0;
      gestureState.translateYVelocity = 0;
      gestureState.lastMoveTimestamp = Date.now(); // Initialize for velocity calculation
    }
    } catch (error) {
      console.warn('Touch start error:', error);
      cleanupGesture(); // Ensure cleanup on error
    }
  }, [imageTransform, setImageTransform, setIsTransforming, minScale, maxScale, doubleTapZoomFactor, imageContainerRef, isDragging, isEditing, isDragActive, cleanupGesture]);

  // Internal touch move handler with the heavy calculations
  const handleTouchMoveInternal = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Check if touch is on a hotspot element - if so, don't interfere
    const target = e.target as HTMLElement;
    const isHotspotElement = target?.closest('[data-hotspot-id]') || 
                            target?.hasAttribute('data-hotspot-id') ||
                            target?.closest('.hotspot-element') ||
                            target?.classList.contains('hotspot-element');
    
    if (isHotspotElement) {
      return;
    }

    // Early return for better performance - disable container gestures when hotspot is being dragged or in modal editing
    if (isDragging || isEditing || isDragActive) {
      console.log('Debug [useTouchGestures]: Touch move blocked', {
        isDragging,
        isEditing,
        isDragActive,
        timestamp: Date.now()
      });
      return;
    }
    
    const gestureState = gestureStateRef.current;
    // Only proceed if this gesture is active
    if (!gestureState.isActive) {
      return;
    }
    
    const touches = e.touches;
    const touchCount = touches.length;

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
          // Try to upgrade from tap to pan gesture
          // Start pan gesture
          
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

      const currentTimestamp = Date.now();
      const deltaTime = gestureState.lastMoveTimestamp ? (currentTimestamp - gestureState.lastMoveTimestamp) / 1000 : (1/60); // Delta time in seconds, default to 60fps interval

      if (deltaTime > 0) { // Avoid division by zero and ensure time has passed
        // Calculate velocities based on the change from the *current* imageTransform, not startTransform
        // This requires access to the previous state before this move event's update.
        // We'll use imageTransform directly, assuming it reflects the state before this specific 'setImageTransform' call.
        // This is an approximation; for more accuracy, previous values from last move would be better.

        const prevScale = imageTransform.scale;
        const prevTranslateX = imageTransform.translateX;
        const prevTranslateY = imageTransform.translateY;

        // Validated transform for this step
        const validatedCurrentTransform = getValidatedTransform({
            scale: newScale,
            translateX: newTranslateX,
            translateY: newTranslateY,
        }, { minScale, maxScale });

        // Calculate velocities using the validated current transform
        gestureState.scaleVelocity = (validatedCurrentTransform.scale - prevScale) / deltaTime;
        gestureState.translateXVelocity = (validatedCurrentTransform.translateX - prevTranslateX) / deltaTime;
        gestureState.translateYVelocity = (validatedCurrentTransform.translateY - prevTranslateY) / deltaTime;

        setImageTransform(validatedCurrentTransform);
      }
      gestureState.lastMoveTimestamp = currentTimestamp;

    }
  }, [setImageTransform, minScale, maxScale, imageContainerRef, isDragging, isEditing, isDragActive, imageTransform]); // Added imageTransform dependency

  // Throttled touch move handler to improve performance (60fps)
  const throttledTouchMove = useCallback(
    throttle((e: React.TouchEvent<HTMLDivElement>) => {
      handleTouchMoveInternal(e);
    }, 16), // ~60fps (1000ms / 60fps ≈ 16ms)
    [handleTouchMoveInternal]
  );

  // Store the throttled function reference for cleanup
  throttledTouchMoveRef.current = throttledTouchMove;

  const handleTouchMove = throttledTouchMove;

  const animateStep = useCallback(() => {
    const gestureState = gestureStateRef.current;
    if (!gestureState.animationFrameId) return; // Animation was cancelled

    let currentTransform = imageTransform; // Get the latest transform

    // Apply damping
    gestureState.scaleVelocity *= DAMPING_FACTOR;
    gestureState.translateXVelocity *= DAMPING_FACTOR;
    gestureState.translateYVelocity *= DAMPING_FACTOR;

    const newScale = currentTransform.scale + gestureState.scaleVelocity * (16/1000); // Assuming 60fps, so 16ms per frame
    const newTranslateX = currentTransform.translateX + gestureState.translateXVelocity * (16/1000);
    const newTranslateY = currentTransform.translateY + gestureState.translateYVelocity * (16/1000);

    const nextTransform = getValidatedTransform(
      { scale: newScale, translateX: newTranslateX, translateY: newTranslateY },
      { minScale, maxScale }
    );

    setImageTransform(nextTransform);
    currentTransform = nextTransform; // Update currentTransform for boundary checks

    // Boundary Physics: Simple clamping is done by getValidatedTransform.
    // For bounce, if nextTransform.scale is at min/maxScale and velocity was pushing it further, reverse velocity.
    let stopAnimation = false;
    if ((currentTransform.scale === minScale && gestureState.scaleVelocity < 0) ||
        (currentTransform.scale === maxScale && gestureState.scaleVelocity > 0)) {
      gestureState.scaleVelocity = 0; // Stop scale momentum if hitting boundaries
    }

    // Check if velocities are below threshold
    if (
      Math.abs(gestureState.scaleVelocity) < VELOCITY_THRESHOLD &&
      Math.abs(gestureState.translateXVelocity) < VELOCITY_THRESHOLD &&
      Math.abs(gestureState.translateYVelocity) < VELOCITY_THRESHOLD
    ) {
      stopAnimation = true;
    }

    // Additional check: if scale is at boundary and no more velocity to push it off, or it's not moving
     if ( (currentTransform.scale === minScale || currentTransform.scale === maxScale) && Math.abs(gestureState.scaleVelocity) < VELOCITY_THRESHOLD) {
        // If it's at a boundary and velocity is tiny, ensure it settles.
        // This also helps stop if it's "stuck" at a boundary.
     }


    if (stopAnimation) {
      gestureState.animationFrameId = null;
      setIsTransforming(false);
      // Perform a final validation to ensure it rests within bounds.
      // This is mostly for translation if/when translation bounds are added.
      // setImageTransform(t => getValidatedTransform(t, { minScale, maxScale }));
    } else {
      gestureState.animationFrameId = requestAnimationFrame(animateStep);
    }
  }, [imageTransform, setImageTransform, setIsTransforming, minScale, maxScale]);

  const startMomentumAnimation = useCallback(() => {
    const gestureState = gestureStateRef.current;
    if (
      Math.abs(gestureState.scaleVelocity) > MIN_VELOCITY_FOR_MOMENTUM ||
      Math.abs(gestureState.translateXVelocity) > MIN_VELOCITY_FOR_MOMENTUM ||
      Math.abs(gestureState.translateYVelocity) > MIN_VELOCITY_FOR_MOMENTUM
    ) {
      setIsTransforming(true); // Ensure transforming is true during animation
      if (gestureState.animationFrameId) {
        cancelAnimationFrame(gestureState.animationFrameId);
      }
      gestureState.animationFrameId = requestAnimationFrame(animateStep);
    } else {
      // No significant velocity, just ensure we are not transforming
      setIsTransforming(false);
       // And ensure final state is validated (especially if just a tiny drag occurred without much velocity)
      setImageTransform(t => getValidatedTransform(t, { minScale, maxScale }));
    }
  }, [animateStep, setIsTransforming, minScale, maxScale, setImageTransform]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Check if touch is on a hotspot element - if so, don't interfere
    const target = e.target as HTMLElement;
    const isHotspotElement = target?.closest('[data-hotspot-id]') || 
                            target?.hasAttribute('data-hotspot-id') ||
                            target?.closest('.hotspot-element') ||
                            target?.classList.contains('hotspot-element');
    
    if (isHotspotElement) {
      return;
    }

    // Early return for better performance - disable container gestures when hotspot is being dragged or in modal editing
    if (isDragActive || isDragging || isEditing) {
      console.log('Debug [useTouchGestures]: Touch end blocked', {
        isDragging,
        isEditing,
        isDragActive,
        timestamp: Date.now()
      });
      return;
    }
    
    const gestureState = gestureStateRef.current;
    const wasPanning = gestureState.isPanning;
    const wasZooming = gestureState.startDistance !== null;
    
    // Prevent click if it was a pan
    if (wasPanning && shouldPreventDefault(e.nativeEvent, 'pan')) {
       e.preventDefault();
    }

    // Clean up gesture state - no coordination needed

    // Reset gesture state efficiently - batch updates
    gestureState.startDistance = null;
    gestureState.startCenter = null;
    gestureState.startTransform = null;
    gestureState.isPanning = false;
    gestureState.panStartCoords = null;
    gestureState.isActive = false; // Mark gesture as inactive

    // Optimize transform state updates - only call setIsTransforming if needed
    const remainingTouches = e.touches.length;
    if (touchEndTimeoutRef.current) {
      clearTimeout(touchEndTimeoutRef.current);
      touchEndTimeoutRef.current = null; // Clear the ref
    }

    if (wasZooming && remainingTouches < 2) {
      // Was zooming and now fewer than 2 touches, start momentum
      startMomentumAnimation();
      // setIsTransforming(false) will be handled by animateStep or startMomentumAnimation
    } else if (wasPanning && remainingTouches < 1) {
      // Was panning and now no touches
      // Future: Could add momentum to panning as well if desired
      setIsTransforming(false); // For now, panning stops immediately
      // Ensure final state is validated if panning stops
      setImageTransform(t => getValidatedTransform(t, { minScale, maxScale }));
    } else if (remainingTouches === 0 && !wasPanning && !wasZooming) {
        // This case handles if it was a tap that didn't become a double tap or pan
        setIsTransforming(false);
    }
    // Double tap transforming is handled in touchStart with its own timeout and setIsTransforming call

  }, [setIsTransforming, isDragging, isEditing, isDragActive, startMomentumAnimation, minScale, maxScale, setImageTransform]);

  // Effect to clear timeouts when the hook unmounts or dependencies change significantly
  useEffect(() => {
    return () => {
      // Cleanup all timeouts
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
        doubleTapTimeoutRef.current = null;
      }
      if (touchEndTimeoutRef.current) {
        clearTimeout(touchEndTimeoutRef.current);
        touchEndTimeoutRef.current = null;
      }
      // Cancel throttled function to prevent memory leaks
      if (throttledTouchMoveRef.current) {
        throttledTouchMoveRef.current.cancel();
        throttledTouchMoveRef.current = null;
      }
      // Cancel any ongoing animation frame
      if (gestureStateRef.current.animationFrameId) {
        cancelAnimationFrame(gestureStateRef.current.animationFrameId);
        gestureStateRef.current.animationFrameId = null;
      }
      // Reset gesture state
      cleanupGesture();
    };
  }, [cleanupGesture]); // Include cleanupGesture in dependencies

  // Add method to check if gesture is currently active
  const isGestureActive = useCallback(() => {
    return gestureStateRef.current.isActive || isDragging || isEditing || isDragActive;
  }, [isDragging, isEditing, isDragActive]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isGestureActive,
    // touchState can be exposed if needed by the component, though internal ref is often enough
    // touchState: gestureStateRef.current
  };
};
