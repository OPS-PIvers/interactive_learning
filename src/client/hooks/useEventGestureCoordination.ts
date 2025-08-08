import { useCallback, useRef, useState } from 'react';
import { InteractionType } from '../../shared/InteractionPresets';

interface EventGestureState {
  isEventActive: boolean;
  activeEventType: InteractionType | null;
  activeEventId: string | null;
  blockUserGestures: boolean;
}

/**
 * Hook for managing coordination between programmatic events and user gestures
 * Prevents interference and provides smooth transitions between states
 */
export const useEventGestureCoordination = () => {
  const [state, setState] = useState<EventGestureState>({
    isEventActive: false,
    activeEventType: null,
    activeEventId: null,
    blockUserGestures: false
  });

  const eventTimeoutRef = useRef<number | null>(null);

  /**
   * Mark event as inactive, allowing user gestures
   */
  const setEventInactive = useCallback(() => {
    if (eventTimeoutRef.current) {
      clearTimeout(eventTimeoutRef.current);
      eventTimeoutRef.current = null;
    }

    setState({
      isEventActive: false,
      activeEventType: null,
      activeEventId: null,
      blockUserGestures: false
    });
  }, []);

  /**
   * Mark an event as active, blocking user gestures if needed
   */
  const setEventActive = useCallback((
    eventType: InteractionType,
    eventId: string,
    blockGestures: boolean = true,
    duration?: number
  ) => {
    // Clear any existing timeout
    if (eventTimeoutRef.current) {
      clearTimeout(eventTimeoutRef.current);
      eventTimeoutRef.current = null;
    }

    setState({
      isEventActive: true,
      activeEventType: eventType,
      activeEventId: eventId,
      blockUserGestures: blockGestures
    });

    // Auto-clear after duration if specified
    if (duration) {
      eventTimeoutRef.current = window.setTimeout(() => {
        setEventInactive();
      }, duration);
    }
  }, [setEventInactive]);

  /**
   * Check if user gestures should be blocked
   */
  const shouldBlockGestures = useCallback(() => {
    return state.blockUserGestures && state.isEventActive;
  }, [state.blockUserGestures, state.isEventActive]);

  /**
   * Check if a specific event is currently active
   */
  const isEventActive = useCallback((eventId?: string) => {
    if (!eventId) {
      return state.isEventActive;
    }
    return state.isEventActive && state.activeEventId === eventId;
  }, [state.isEventActive, state.activeEventId]);

  /**
   * Get current active event info
   */
  const getActiveEvent = useCallback(() => {
    if (!state.isEventActive) {
      return null;
    }
    return {
      eventType: state.activeEventType,
      eventId: state.activeEventId
    };
  }, [state.isEventActive, state.activeEventType, state.activeEventId]);

  /**
   * Force clear all event states (emergency reset)
   */
  const forceReset = useCallback(() => {
    if (eventTimeoutRef.current) {
      clearTimeout(eventTimeoutRef.current);
      eventTimeoutRef.current = null;
    }

    setState({
      isEventActive: false,
      activeEventType: null,
      activeEventId: null,
      blockUserGestures: false
    });
  }, []);

  return {
    // State queries
    isEventActive,
    shouldBlockGestures,
    getActiveEvent,
    
    // State management
    setEventActive,
    setEventInactive,
    forceReset,
    
    // Current state (for debugging)
    currentState: state
  };
};