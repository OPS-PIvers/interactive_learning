import { useCallback, useRef } from 'react';
import { triggerHapticFeedback } from '../utils/hapticUtils';

export const useMobileTouchGestures = (
  onTap: (id: string) => void,
  onDoubleTap: (id: string) => void,
  onLongPress: (id: string) => void
) => {
  const lastTapRef = useRef<{ time: number; id: string | null }>({ time: 0, id: null });
  const longPressTimerRef = useRef<NodeJS.Timeout>();

  const handleTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    // Clear any existing long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Set up long press detection
    longPressTimerRef.current = setTimeout(() => {
      triggerHapticFeedback('heavy');
      onLongPress(id);
    }, 500);

    // Handle tap/double tap detection
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current.time;
    
    if (timeSinceLastTap < 300 && lastTapRef.current.id === id) {
      // Double tap detected
      clearTimeout(longPressTimerRef.current);
      triggerHapticFeedback('medium');
      onDoubleTap(id);
      lastTapRef.current = { time: 0, id: null };
    } else {
      // Single tap
      lastTapRef.current = { time: now, id };
    }
  }, [onTap, onDoubleTap, onLongPress]);

  const handleTouchEnd = useCallback((id: string) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    // Execute single tap after delay to allow double tap detection
    setTimeout(() => {
      if (lastTapRef.current.id === id && lastTapRef.current.time > 0) {
        triggerHapticFeedback('light');
        onTap(id);
        lastTapRef.current = { time: 0, id: null };
      }
    }, 300);
  }, [onTap]);

  return { handleTouchStart, handleTouchEnd };
};