import { useState, useCallback } from 'react';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  dx: number;
  dy: number;
}

interface DragHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export const useSimpleDrag = (
  onDragMove?: (dx: number, dy: number) => void,
  onDragEnd?: (dx: number, dy: number) => void
): DragHandlers => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    dx: 0,
    dy: 0,
  });

  const handleDragStart = useCallback((x: number, y: number) => {
    setDragState({
      isDragging: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      dx: 0,
      dy: 0,
    });
  }, []);

  const handleDragMove = useCallback((x: number, y: number) => {
    if (!dragState.isDragging) return;

    const dx = x - dragState.startX;
    const dy = y - dragState.startY;

    setDragState(prev => ({ ...prev, currentX: x, currentY: y, dx, dy }));
    onDragMove?.(dx, dy);
  }, [dragState.isDragging, dragState.startX, dragState.startY, onDragMove]);

  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging) return;

    onDragEnd?.(dragState.dx, dragState.dy);
    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      dx: 0,
      dy: 0,
    });
  }, [dragState.isDragging, dragState.dx, dragState.dy, onDragEnd]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    handleDragEnd();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) return;
    const touch = e.touches[0];
    if (touch) {
      handleDragStart(touch.clientX, touch.clientY);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 1) return;
    const touch = e.touches[0];
    if (touch) {
      handleDragMove(touch.clientX, touch.clientY);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    handleDragEnd();
  };

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
