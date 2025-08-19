/**
 * Element Drag and Drop Hook  
 * 
 * Extracted from UnifiedSlideEditor to handle drag-and-drop functionality
 * for slide elements. Provides optimized drag handling with proper cleanup.
 */

import { useCallback, useRef, useState } from 'react';
import { SlideElement } from '../../shared/slideTypes';

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startPosition: { x: number; y: number };
  startElementPosition: { x: number; y: number; width: number; height: number };
  hasMovedBeyondThreshold: boolean;
}

interface UseElementDragDropProps {
  onElementUpdate: (elementId: string, updates: Partial<SlideElement>) => void;
  dragThreshold?: number;
}

export const useElementDragDrop = ({
  onElementUpdate,
  dragThreshold = 5
}: UseElementDragDropProps) => {
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: null,
    startPosition: { x: 0, y: 0 },
    startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
    hasMovedBeyondThreshold: false
  });

  const dragTimeoutRef = useRef<number | null>(null);

  // Start drag operation
  const handleDragStart = useCallback((elementId: string, startPos: { x: number; y: number }, elementPos: { x: number; y: number; width: number; height: number }) => {
    setDragState({
      isDragging: true,
      elementId,
      startPosition: startPos,
      startElementPosition: elementPos,
      hasMovedBeyondThreshold: false
    });
  }, []);

  // Handle drag movement with threshold
  const handleDragMove = useCallback((currentPos: { x: number; y: number }) => {
    if (!dragState.isDragging || !dragState.elementId) return;

    const deltaX = currentPos.x - dragState.startPosition.x;
    const deltaY = currentPos.y - dragState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > dragThreshold && !dragState.hasMovedBeyondThreshold) {
      setDragState(prev => ({ ...prev, hasMovedBeyondThreshold: true }));
    }

    if (dragState.hasMovedBeyondThreshold) {
      const newPosition = {
        x: dragState.startElementPosition.x + deltaX,
        y: dragState.startElementPosition.y + deltaY,
        width: dragState.startElementPosition.width,
        height: dragState.startElementPosition.height
      };

      onElementUpdate(dragState.elementId, {
        position: {
          desktop: newPosition,
          tablet: newPosition, 
          mobile: newPosition
        }
      });
    }
  }, [dragState, dragThreshold, onElementUpdate]);

  // End drag operation
  const handleDragEnd = useCallback(() => {
    // Clear any pending timeouts
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }

    setDragState({
      isDragging: false,
      elementId: null,
      startPosition: { x: 0, y: 0 },
      startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
      hasMovedBeyondThreshold: false
    });
  }, []);

  // Check if currently dragging
  const isDragging = dragState.isDragging;
  const draggedElementId = dragState.elementId;
  const hasMovedBeyondThreshold = dragState.hasMovedBeyondThreshold;

  return {
    isDragging,
    draggedElementId,
    hasMovedBeyondThreshold,
    handleDragStart,
    handleDragMove,
    handleDragEnd
  };
};