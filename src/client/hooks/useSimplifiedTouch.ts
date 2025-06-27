// Create: src/client/hooks/useSimplifiedTouch.ts
import { useCallback, useRef } from 'react';

interface TouchState {
  isActive: boolean;
  startPoint: { x: number; y: number } | null;
  lastPoint: { x: number; y: number } | null;
  startTime: number;
}

interface SimplifiedTouchOptions {
  dragThreshold?: number;
  tapDurationThreshold?: number;
  tapDistanceThreshold?: number;
}

const defaultOptions: Required<SimplifiedTouchOptions> = {
  dragThreshold: 5, // px
  tapDurationThreshold: 300, // ms
  tapDistanceThreshold: 10, // px
};

export const useSimplifiedTouch = (
  handlers: {
    onTap?: (point: { x: number; y: number }) => void;
    onDrag?: (delta: { x: number; y: number }, point: { x: number; y: number }) => void;
    onDragEnd?: () => void;
  },
  options?: SimplifiedTouchOptions
) => {
  const mergedOptions = { ...defaultOptions, ...options };
  const { onTap, onDrag, onDragEnd } = handlers;

  const touchState = useRef<TouchState>({
    isActive: false,
    startPoint: null,
    lastPoint: null,
    startTime: 0
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // Only handle single touch

    const touch = e.touches[0];
    const point = { x: touch.clientX, y: touch.clientY };

    touchState.current = {
      isActive: true,
      startPoint: point,
      lastPoint: point,
      startTime: Date.now()
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.current.isActive || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const point = { x: touch.clientX, y: touch.clientY };
    const { startPoint, lastPoint } = touchState.current;

    if (startPoint && lastPoint && onDrag) {
      const delta = {
        x: point.x - lastPoint.x,
        y: point.y - lastPoint.y
      };

      // Only call onDrag if we've moved more than dragThreshold from start
      const totalDistance = Math.hypot(point.x - startPoint.x, point.y - startPoint.y);
      if (totalDistance > mergedOptions.dragThreshold) {
        e.preventDefault(); // Prevent scroll
        onDrag(delta, point);
      }
    }

    touchState.current.lastPoint = point;
  }, [onDrag]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchState.current.isActive) return;

    const { startPoint, startTime } = touchState.current;
    const duration = Date.now() - startTime;

    // If it was a quick tap (less than tapDurationThreshold and small movement), call onTap
    if (startPoint && duration < mergedOptions.tapDurationThreshold) {
      const changedTouch = e.changedTouches[0];
      const endPoint = { x: changedTouch.clientX, y: changedTouch.clientY };
      const distance = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);

      if (distance < mergedOptions.tapDistanceThreshold && onTap) {
        onTap(endPoint);
      }
    }

    if (onDragEnd) {
      onDragEnd();
    }

    touchState.current = {
      isActive: false,
      startPoint: null,
      lastPoint: null,
      startTime: 0
    };
  }, [onTap, onDragEnd]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
};
