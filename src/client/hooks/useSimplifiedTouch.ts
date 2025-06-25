// Create: src/client/hooks/useSimplifiedTouch.ts
import { useCallback, useRef } from 'react';

interface TouchState {
  isActive: boolean;
  startPoint: { x: number; y: number } | null;
  lastPoint: { x: number; y: number } | null;
  startTime: number;
}

export const useSimplifiedTouch = (
  onTap?: (point: { x: number; y: number }) => void,
  onDrag?: (delta: { x: number; y: number }, point: { x: number; y: number }) => void,
  onDragEnd?: () => void
) => {
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

      // Only call onDrag if we've moved more than 5px from start
      const totalDistance = Math.hypot(point.x - startPoint.x, point.y - startPoint.y);
      if (totalDistance > 5) {
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

    // If it was a quick tap (less than 300ms and small movement), call onTap
    if (startPoint && duration < 300) {
      const changedTouch = e.changedTouches[0];
      const endPoint = { x: changedTouch.clientX, y: changedTouch.clientY };
      const distance = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);

      if (distance < 10 && onTap) {
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
