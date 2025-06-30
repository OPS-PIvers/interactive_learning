import { useCallback, useRef } from 'react';

export type GestureType = 'touch' | 'drag' | 'pan' | 'zoom' | 'tap';

interface GestureCoordinationState {
  activeGesture: GestureType | null;
  gestureStartTime: number;
  priority: Record<GestureType, number>;
}

/**
 * Hook for coordinating different gesture types to prevent conflicts
 * Higher priority numbers take precedence over lower priority gestures
 */
export const useGestureCoordination = () => {
  const stateRef = useRef<GestureCoordinationState>({
    activeGesture: null,
    gestureStartTime: 0,
    priority: {
      drag: 100,     // Highest priority - user is intentionally dragging
      zoom: 80,      // High priority - pinch to zoom
      pan: 60,       // Medium priority - single finger pan
      tap: 40,       // Lower priority - can be interrupted
      touch: 20,     // Lowest priority - generic touch
    }
  });

  /**
   * Attempt to claim a gesture type
   * Returns true if the gesture was successfully claimed, false if blocked
   */
  const claimGesture = useCallback((gestureType: GestureType): boolean => {
    const state = stateRef.current;
    const now = Date.now();

    // If no active gesture, claim immediately
    if (!state.activeGesture) {
      state.activeGesture = gestureType;
      state.gestureStartTime = now;
      console.log(`[GestureCoordination] Claimed gesture: ${gestureType}`);
      return true;
    }

    // If same gesture type, allow (prevent duplicate claims)
    if (state.activeGesture === gestureType) {
      return true;
    }

    // Check priority - higher priority can interrupt lower priority
    const currentPriority = state.priority[state.activeGesture];
    const newPriority = state.priority[gestureType];

    if (newPriority > currentPriority) {
      console.log(`[GestureCoordination] Gesture ${gestureType} (priority ${newPriority}) interrupting ${state.activeGesture} (priority ${currentPriority})`);
      state.activeGesture = gestureType;
      state.gestureStartTime = now;
      return true;
    }

    // If gesture has been active for very short time, allow higher priority to interrupt
    const timeSinceStart = now - state.gestureStartTime;
    if (timeSinceStart < 100 && newPriority >= currentPriority) {
      console.log(`[GestureCoordination] Gesture ${gestureType} interrupting recent ${state.activeGesture} (${timeSinceStart}ms)`);
      state.activeGesture = gestureType;
      state.gestureStartTime = now;
      return true;
    }

    console.log(`[GestureCoordination] Gesture ${gestureType} blocked by active ${state.activeGesture}`);
    return false;
  }, []);

  /**
   * Release a gesture type
   */
  const releaseGesture = useCallback((gestureType: GestureType): void => {
    const state = stateRef.current;
    
    // Only release if this gesture type was active
    if (state.activeGesture === gestureType) {
      console.log(`[GestureCoordination] Released gesture: ${gestureType}`);
      state.activeGesture = null;
      state.gestureStartTime = 0;
    }
  }, []);

  /**
   * Check if a specific gesture type is currently active
   */
  const isGestureActive = useCallback((gestureType?: GestureType): boolean => {
    const state = stateRef.current;
    
    if (gestureType) {
      return state.activeGesture === gestureType;
    }
    
    return state.activeGesture !== null;
  }, []);

  /**
   * Get the currently active gesture type
   */
  const getActiveGesture = useCallback((): GestureType | null => {
    return stateRef.current.activeGesture;
  }, []);

  /**
   * Force release all gestures (emergency reset)
   */
  const releaseAllGestures = useCallback((): void => {
    const state = stateRef.current;
    console.log(`[GestureCoordination] Force released all gestures`);
    state.activeGesture = null;
    state.gestureStartTime = 0;
  }, []);

  return {
    claimGesture,
    releaseGesture,
    isGestureActive,
    getActiveGesture,
    releaseAllGestures,
  };
};