import { RefObject, useCallback, useEffect, useRef } from 'react';
import { ImageTransformState } from '../../shared/types';
import { debugLog } from '../utils/debugUtils';
import { triggerHapticFeedback } from '../utils/hapticUtils';
import { getTouchDistance, getTouchCenter, getValidatedTransform, getSpringBackTransform, shouldPreventDefault, ViewportBounds } from '../utils/touchUtils';

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
const DOUBLE_TAP_THRESHOLD = 300; // ms
const PAN_THRESHOLD_PIXELS = 60; // For distinguishing tap from pan (research-backed optimal value for touch)

// Constants for momentum and animation
const DAMPING_FACTOR = 0.93; // Determines how quickly momentum fades
const VELOCITY_THRESHOLD = 0.004; // Below this, momentum stops for scale and position
const MIN_VELOCITY_FOR_MOMENTUM = 0.05; // Minimum velocity to trigger momentum animation

interface TouchGestureState {
  startDistance: number | null;
  startCenter: {x: number;y: number;} | null;
  startTransform: ImageTransformState | null;
  lastTap: number; // Timestamp of the last tap
  isPanning: boolean;
  panStartCoords: {x: number;y: number;} | null;
  isActive: boolean; // Track if any gesture is currently active
  isEventActive: boolean; // Track if events are controlling transforms

  // For momentum
  lastMoveTimestamp: number | null;
  scaleVelocity: number;
  translateXVelocity: number;
  translateYVelocity: number;
  animationFrameId: number | null;
  moveAnimationId: number | null; // For throttling move events
}

export interface TouchGestureHandlers {
  handleTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  handleTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  isGestureActive: () => boolean;
  setEventActive: (active: boolean) => void;
  isEventActive: () => boolean;
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
  disabled?: boolean; // Add option to disable gestures completely
  viewportBounds?: ViewportBounds; // Add viewport bounds for translation constraints
}) =>
{
  const {
    minScale = 0.5,
    maxScale = 5,
    doubleTapZoomFactor = 2,
    isDragging = false,
    isEditing = false,
    isDragActive = false,
    disabled = false,
    viewportBounds
  } = options || {};

  const isPinchingRef = useRef(false);
  const initialPinchDistanceRef = useRef(0);
  const imageTransformRef = useRef(imageTransform);

  const gestureStateRef = useRef<TouchGestureState>({
    startDistance: null,
    startCenter: null,
    startTransform: null,
    lastTap: 0,
    isPanning: false,
    panStartCoords: null,
    isActive: false,
    isEventActive: false,
    // Momentum defaults
    lastMoveTimestamp: null,
    scaleVelocity: 0,
    translateXVelocity: 0,
    translateYVelocity: 0,
    animationFrameId: null,
    moveAnimationId: null
  });
  const doubleTapTimeoutRef = useRef<number | null>(null);
  const touchEndTimeoutRef = useRef<number | null>(null);
  const throttledTouchMoveRef = useRef<{cancel: () => void;} | null>(null);

  // Add gesture cleanup function
  const cleanupGesture = useCallback((preserveEventState = false) => {
    const gestureState = gestureStateRef.current;
    gestureState.startDistance = null;
    gestureState.startCenter = null;
    gestureState.startTransform = null;
    gestureState.isPanning = false;
    gestureState.panStartCoords = null;
    gestureState.isActive = false;

    // Only reset event state if explicitly requested
    if (!preserveEventState) {
      gestureState.isEventActive = false;
    }

    // Reset momentum state as well
    gestureState.lastMoveTimestamp = null;
    gestureState.scaleVelocity = 0;
    gestureState.translateXVelocity = 0;
    gestureState.translateYVelocity = 0;

    // Cancel any pending animations
    if (gestureState.animationFrameId) {
      cancelAnimationFrame(gestureState.animationFrameId);
      gestureState.animationFrameId = null;
    }
    if (gestureState.moveAnimationId) {
      cancelAnimationFrame(gestureState.moveAnimationId);
      gestureState.moveAnimationId = null;
    }
  }, []);

  const handlePinchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 2) {
      const touch1 = touches.item(0);
      const touch2 = touches.item(1);
      if (touch1 && touch2) {
        initialPinchDistanceRef.current = getTouchDistance(touch1, touch2);
        isPinchingRef.current = true;
        triggerHapticFeedback('light');
      }
    }
  };

  const handlePinchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 2 && isPinchingRef.current) {
      const touch1 = touches.item(0);
      const touch2 = touches.item(1);
      if (touch1 && touch2) {
        const newDistance = getTouchDistance(touch1, touch2);
        const scale = newDistance / initialPinchDistanceRef.current;
        setImageTransform((prev) => ({ ...prev, scale: prev.scale * scale }));
        initialPinchDistanceRef.current = newDistance;
      }
    }
  };

  const handlePinchEnd = () => {
    isPinchingRef.current = false;
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;

    const gestureState = gestureStateRef.current;
    if (gestureState.animationFrameId) {
      cancelAnimationFrame(gestureState.animationFrameId);
      gestureState.animationFrameId = null;
      setIsTransforming(false);
    }

    try {
      const target = e.target as HTMLElement;
      const isHotspotElement = target?.closest('[data-hotspot-id]') ||
      target?.hasAttribute('data-hotspot-id') ||
      target?.closest('.hotspot-element') ||
      target?.classList.contains('hotspot-element');

      if (isHotspotElement) {
        debugLog.info('Touch on hotspot element - skipping container gestures');
        return;
      }

      // Early return for better performance - disable container gestures when hotspot is being dragged or in modal editing
      if (isDragging || isEditing || isDragActive) {
        debugLog.info('Touch start blocked', {
          isDragging,
          isEditing,
          isDragActive,
          timestamp: Date.now()
        });
        return;
      }

      // Block gestures when events are controlling transforms
      if (gestureState.isEventActive) {
        debugLog.info('Touch start blocked - event is controlling transforms');
        return;
      }

      // Prevent race conditions by checking if another gesture is already active
      if (gestureState.isActive) {
        debugLog.info('Touch start blocked - gesture already active');
        return;
      }

      const touches = e.nativeEvent.touches;
      const touchCount = touches.length;
      const now = Date.now();

      if (touchCount === 1) {
        const touch = touches.item(0);
        if (!touch) return;

        // Double tap detection - optimize with early return
        const timeSinceLastTap = now - gestureState.lastTap;
        if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD) {
          // This is a double tap - atomically claim the gesture
          // Clear any existing state first
          cleanupGesture();

          // Mark gesture as active immediately to prevent race conditions
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

          setImageTransform((prevTransform) => {
            // Optimize zoom logic
            const isZoomedIn = prevTransform.scale > 1;
            if (isZoomedIn) {
              // Zoom out to fit
              return getValidatedTransform({
                scale: 1,
                translateX: 0,
                translateY: 0
              }, { minScale, maxScale }, viewportBounds);
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
                translateY: nextTranslateY
              }, { minScale, maxScale }, viewportBounds);
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

        // Single tap - atomically claim gesture
        gestureState.isActive = true;
        // Potential single tap or start of a pan
        gestureState.panStartCoords = { x: touch.clientX, y: touch.clientY };
        gestureState.startTransform = { ...imageTransform }; // Capture transform at pan start
        gestureState.lastTap = now;

        // Initialize velocity tracking for potential pan momentum
        gestureState.translateXVelocity = 0;
        gestureState.translateYVelocity = 0;
        gestureState.lastMoveTimestamp = now;
      } else if (touchCount === 2) {
        // Pinch-to-zoom initialization - atomically claim zoom gesture
        if (shouldPreventDefault(e.nativeEvent, 'zoom')) {
          e.preventDefault();
        }
        setIsTransforming(true);

        // Mark gesture as active immediately to prevent race conditions
        gestureState.isActive = true;
        // Cache values for performance
        const touch1 = touches.item(0);
        const touch2 = touches.item(1);
        if (!touch1 || !touch2) return;
        gestureState.startDistance = getTouchDistance(touch1, touch2);
        gestureState.startCenter = getTouchCenter(touch1, touch2);
        gestureState.startTransform = { ...imageTransform }; // Current image transform
        gestureState.isPanning = false; // Stop panning if it was active

        // Reset velocities and timestamp for pinch-zoom
        gestureState.scaleVelocity = 0;
        gestureState.translateXVelocity = 0;
        gestureState.translateYVelocity = 0;
        gestureState.lastMoveTimestamp = Date.now();
      }
      handlePinchStart(e);
    } catch (error) {
      debugLog.warn('Touch start error:', error);
      cleanupGesture();
    }
  }, [imageTransform, setImageTransform, setIsTransforming, minScale, maxScale, doubleTapZoomFactor, imageContainerRef, isDragging, isEditing, isDragActive, cleanupGesture, disabled, viewportBounds]);

  const handleTouchMoveInternal = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
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
      debugLog.info('Touch move blocked', {
        isDragging,
        isEditing,
        isDragActive,
        timestamp: Date.now()
      });
      return;
    }

    // Block gestures when events are controlling transforms
    if (gestureStateRef.current.isEventActive) {
      debugLog.info('Touch move blocked - event is controlling transforms');
      return;
    }

    const gestureState = gestureStateRef.current;
    // Only proceed if this gesture is active
    if (!gestureState.isActive) {
      return;
    }

    const touches = e.nativeEvent.touches;
    const touchCount = touches.length;

    if (touchCount === 1 && gestureState.panStartCoords && gestureState.startTransform) {
      // Single-finger pan - optimize coordinate access
      const touch = touches.item(0);
      if (!touch) return;
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
        const newTranslateX = gestureState.startTransform!.translateX + deltaX;
        const newTranslateY = gestureState.startTransform!.translateY + deltaY;

        // Calculate pan velocity
        const currentTimestamp = Date.now();
        const deltaTime = gestureState.lastMoveTimestamp ? (currentTimestamp - gestureState.lastMoveTimestamp) / 1000 : 1 / 60;

        if (deltaTime > 0) {
          const prevTranslateX = imageTransform.translateX;
          const prevTranslateY = imageTransform.translateY;

          const validated = getValidatedTransform({
            scale: imageTransform.scale,
            translateX: newTranslateX,
            translateY: newTranslateY
          }, { minScale, maxScale }, viewportBounds);

          // Calculate pan velocities
          gestureState.translateXVelocity = (validated.translateX - prevTranslateX) / deltaTime;
          gestureState.translateYVelocity = (validated.translateY - prevTranslateY) / deltaTime;

          // Use a ref to avoid race conditions with rapid updates
          setImageTransform(() => validated);

          // Update gesture state with the validated transform for consistency
          if (gestureState.startTransform) {
            gestureState.startTransform = {
              ...gestureState.startTransform,
              translateX: validated.translateX,
              translateY: validated.translateY
            };
          }
        } else {
          // Fallback for when deltaTime is 0
          setImageTransform((prev) => {
            const validated = getValidatedTransform({
              scale: prev.scale,
              translateX: newTranslateX,
              translateY: newTranslateY
            }, { minScale, maxScale }, viewportBounds);

            // Update gesture state with the validated transform for consistency
            if (gestureState.startTransform) {
              gestureState.startTransform = {
                ...gestureState.startTransform,
                translateX: validated.translateX,
                translateY: validated.translateY
              };
            }

            return validated;
          });
        }

        gestureState.lastMoveTimestamp = currentTimestamp;
      }
    } else if (touchCount === 2 && gestureState.startDistance && gestureState.startCenter && gestureState.startTransform) {
      // Pinch-to-zoom - optimize touch access
      if (shouldPreventDefault(e.nativeEvent, 'zoom')) {
        e.preventDefault();
      }

      const touch1 = touches.item(0);
      const touch2 = touches.item(1);
      if (!touch1 || !touch2) return;
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
      const deltaTime = gestureState.lastMoveTimestamp ? (currentTimestamp - gestureState.lastMoveTimestamp) / 1000 : 1 / 60; // Delta time in seconds, default to 60fps interval

      if (deltaTime > 0) {// Avoid division by zero and ensure time has passed
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
          translateY: newTranslateY
        }, { minScale, maxScale }, viewportBounds);

        // Calculate velocities using the validated current transform
        gestureState.scaleVelocity = (validatedCurrentTransform.scale - prevScale) / deltaTime;
        gestureState.translateXVelocity = (validatedCurrentTransform.translateX - prevTranslateX) / deltaTime;
        gestureState.translateYVelocity = (validatedCurrentTransform.translateY - prevTranslateY) / deltaTime;

        // Use callback to ensure we're working with the latest state
        setImageTransform(() => validatedCurrentTransform);
      }
      gestureState.lastMoveTimestamp = currentTimestamp;

    }
  }, [setImageTransform, minScale, maxScale, imageContainerRef, isDragging, isEditing, isDragActive, imageTransform, disabled, handlePinchMove, viewportBounds]); // Added imageTransform and disabled dependency

  // Create throttled touch move handler only once
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;

    // Use requestAnimationFrame for better performance than throttle
    if (gestureStateRef.current.moveAnimationId) {
      return; // Already have a pending move update
    }

    gestureStateRef.current.moveAnimationId = requestAnimationFrame(() => {
      gestureStateRef.current.moveAnimationId = null;
      handleTouchMoveInternal(e);
    });
  }, [handleTouchMoveInternal, disabled]);

  // Store the handler reference for cleanup
  throttledTouchMoveRef.current = { cancel: () => {
      if (gestureStateRef.current.moveAnimationId) {
        cancelAnimationFrame(gestureStateRef.current.moveAnimationId);
        gestureStateRef.current.moveAnimationId = null;
      }
    } };

  const animateStep = useCallback(() => {
    const gestureState = gestureStateRef.current;
    if (!gestureState.animationFrameId) return; // Animation was cancelled

    // Use ref to get current transform to avoid dependency loop
    let currentTransform = imageTransformRef.current;

    // Apply damping
    gestureState.scaleVelocity *= DAMPING_FACTOR;
    gestureState.translateXVelocity *= DAMPING_FACTOR;
    gestureState.translateYVelocity *= DAMPING_FACTOR;

    const newScale = currentTransform.scale + gestureState.scaleVelocity * (16 / 1000); // Assuming 60fps, so 16ms per frame
    const newTranslateX = currentTransform.translateX + gestureState.translateXVelocity * (16 / 1000);
    const newTranslateY = currentTransform.translateY + gestureState.translateYVelocity * (16 / 1000);

    const nextTransform = getValidatedTransform(
      { scale: newScale, translateX: newTranslateX, translateY: newTranslateY },
      { minScale, maxScale },
      viewportBounds
    );

    setImageTransform(nextTransform);
    currentTransform = nextTransform; // Update currentTransform for boundary checks

    // Boundary Physics: Simple clamping is done by getValidatedTransform.
    // For bounce, if nextTransform.scale is at min/maxScale and velocity was pushing it further, reverse velocity.
    let stopAnimation = false;
    if (currentTransform.scale === minScale && gestureState.scaleVelocity < 0 ||
    currentTransform.scale === maxScale && gestureState.scaleVelocity > 0) {
      gestureState.scaleVelocity = 0; // Stop scale momentum if hitting boundaries
    }

    // Check if velocities are below threshold
    if (
    Math.abs(gestureState.scaleVelocity) < VELOCITY_THRESHOLD &&
    Math.abs(gestureState.translateXVelocity) < VELOCITY_THRESHOLD &&
    Math.abs(gestureState.translateYVelocity) < VELOCITY_THRESHOLD)
    {
      stopAnimation = true;
    }

    // Also check if we've reached the spring-back target
    if (viewportBounds) {
      const springBackTransform = getSpringBackTransform(currentTransform, { minScale, maxScale }, viewportBounds);
      const reachedSpringBackTarget =
      Math.abs(currentTransform.translateX - springBackTransform.translateX) < 1 &&
      Math.abs(currentTransform.translateY - springBackTransform.translateY) < 1 &&
      Math.abs(currentTransform.scale - springBackTransform.scale) < 0.01;


      if (reachedSpringBackTarget) {
        // Snap to exact spring-back position and stop
        setImageTransform(springBackTransform);
        stopAnimation = true;
      }
    }

    // Additional check: if scale is at boundary and no more velocity to push it off, or it's not moving
    if ((currentTransform.scale === minScale || currentTransform.scale === maxScale) && Math.abs(gestureState.scaleVelocity) < VELOCITY_THRESHOLD) {


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
  }, [setImageTransform, setIsTransforming, minScale, maxScale, viewportBounds]);

  const startMomentumAnimation = useCallback(() => {
    const gestureState = gestureStateRef.current;
    const hasSignificantVelocity =
    Math.abs(gestureState.scaleVelocity) > MIN_VELOCITY_FOR_MOMENTUM ||
    Math.abs(gestureState.translateXVelocity) > MIN_VELOCITY_FOR_MOMENTUM ||
    Math.abs(gestureState.translateYVelocity) > MIN_VELOCITY_FOR_MOMENTUM;


    // Check if spring-back is needed (content is outside hard bounds)
    const currentTransform = imageTransformRef.current;
    const springBackTransform = getSpringBackTransform(currentTransform, { minScale, maxScale }, viewportBounds);
    const needsSpringBack =
    Math.abs(currentTransform.translateX - springBackTransform.translateX) > 1 ||
    Math.abs(currentTransform.translateY - springBackTransform.translateY) > 1 ||
    Math.abs(currentTransform.scale - springBackTransform.scale) > 0.01;


    if (hasSignificantVelocity || needsSpringBack) {
      setIsTransforming(true); // Ensure transforming is true during animation
      if (gestureState.animationFrameId) {
        cancelAnimationFrame(gestureState.animationFrameId);
      }

      // If spring-back is needed but no significant velocity, create spring-back velocity
      if (needsSpringBack && !hasSignificantVelocity) {
        const springBackFactor = 5; // Controls spring-back speed
        gestureState.translateXVelocity = (springBackTransform.translateX - currentTransform.translateX) * springBackFactor;
        gestureState.translateYVelocity = (springBackTransform.translateY - currentTransform.translateY) * springBackFactor;
        gestureState.scaleVelocity = (springBackTransform.scale - currentTransform.scale) * springBackFactor;
      }

      gestureState.animationFrameId = requestAnimationFrame(animateStep);
    } else {
      // No significant velocity and no spring-back needed
      setIsTransforming(false);
      // Ensure final state is validated
      setImageTransform((t) => getValidatedTransform(t, { minScale, maxScale }, viewportBounds));
    }
  }, [animateStep, setIsTransforming, viewportBounds]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;

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
      debugLog.info('Touch end blocked', {
        isDragging,
        isEditing,
        isDragActive,
        timestamp: Date.now()
      });
      return;
    }

    // Block gestures when events are controlling transforms
    if (gestureStateRef.current.isEventActive) {
      debugLog.info('Touch end blocked - event is controlling transforms');
      return;
    }

    const gestureState = gestureStateRef.current;

    // Only process if we own the gesture
    if (!gestureState.isActive) {
      return;
    }

    const wasPanning = gestureState.isPanning;
    const wasZooming = gestureState.startDistance !== null;

    // Prevent click if it was a pan
    if (wasPanning && shouldPreventDefault(e.nativeEvent, 'pan')) {
      e.preventDefault();
    }

    // Atomically clean up gesture state
    const remainingTouches = e.nativeEvent.touches.length;

    // Reset gesture state efficiently - batch updates
    gestureState.startDistance = null;
    gestureState.startCenter = null;
    gestureState.startTransform = null;
    gestureState.isPanning = false;
    gestureState.panStartCoords = null;
    gestureState.isActive = false; // Mark gesture as inactive

    // Optimize transform state updates - only call setIsTransforming if needed
    if (touchEndTimeoutRef.current) {
      clearTimeout(touchEndTimeoutRef.current);
      touchEndTimeoutRef.current = null; // Clear the ref
    }

    if (wasZooming && remainingTouches < 2) {
      // Was zooming and now fewer than 2 touches, start momentum
      startMomentumAnimation();
      // setIsTransforming(false) will be handled by animateStep or startMomentumAnimation
    } else if (wasPanning && remainingTouches < 1) {
      // Was panning and now no touches - start momentum animation for pan
      startMomentumAnimation();
      // setIsTransforming(false) will be handled by animateStep or startMomentumAnimation
    } else if (remainingTouches === 0 && !wasPanning && !wasZooming) {
      // This case handles if it was a tap that didn't become a double tap or pan
      setIsTransforming(false);
    }
    // Double tap transforming is handled in touchStart with its own timeout and setIsTransforming call
    handlePinchEnd();
  }, [setIsTransforming, isDragging, isEditing, isDragActive, startMomentumAnimation, disabled]);

  // Keep ref synchronized with state to avoid animation loop
  useEffect(() => {
    imageTransformRef.current = imageTransform;
  }, [imageTransform]);

  useEffect(() => {
    const gestureState = gestureStateRef.current;
    return () => {
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
      // Cancel any ongoing animation frames
      if (gestureState.animationFrameId) {
        cancelAnimationFrame(gestureState.animationFrameId);
        gestureState.animationFrameId = null;
      }
      if (gestureState.moveAnimationId) {
        cancelAnimationFrame(gestureState.moveAnimationId);
        gestureState.moveAnimationId = null;
      }
      // Reset gesture state
      cleanupGesture();
    };
  }, [cleanupGesture]); // Include cleanupGesture in dependencies

  // Add method to check if gesture is currently active
  const isGestureActive = useCallback(() => {
    const gestureState = gestureStateRef.current;
    return gestureState.isActive || gestureState.isEventActive || isDragging || isEditing || isDragActive;
  }, [isDragging, isEditing, isDragActive]);

  // Add event control methods with improved coordination
  const setEventActive = useCallback((active: boolean) => {
    const gestureState = gestureStateRef.current;
    const wasEventActive = gestureState.isEventActive;
    gestureState.isEventActive = active;

    if (active && !wasEventActive) {
      // Event is taking control - cancel any ongoing gestures

      cleanupGesture(true); // Preserve event state
      setIsTransforming(true); // Let the event handle transforming state
    } else if (!active && wasEventActive) {
      // Event is releasing control

      setIsTransforming(false);
    }

    debugLog.info('Event active state changed', {
      isEventActive: active,
      wasEventActive,
      wasGestureActive: gestureState.isActive,
      timestamp: Date.now()
    });
  }, [cleanupGesture, setIsTransforming]);

  const isEventActive = useCallback(() => {
    return gestureStateRef.current.isEventActive;
  }, []);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isGestureActive,
    setEventActive,
    isEventActive
    // touchState can be exposed if needed by the component, though internal ref is often enough
    // touchState: gestureStateRef.current
  } as TouchGestureHandlers;
};