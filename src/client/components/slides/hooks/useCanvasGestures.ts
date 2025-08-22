import { useState, useCallback } from 'react';
import { SlideElement, DeviceType, FixedPosition, ResponsivePosition } from '../../../../shared/slideTypes';

const DRAG_THRESHOLD_PIXELS = 60;
const TAP_MAX_DURATION = 300;

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startPosition: { x: number; y: number };
  startElementPosition: FixedPosition;
  hasMovedBeyondThreshold: boolean;
}

interface TouchState {
  isTouching: boolean;
  isDragging: boolean;
  elementId: string | null;
  startPosition: { x: number; y: number };
  startElementPosition: FixedPosition;
  startTimestamp: number;
}

const INITIAL_DRAG_STATE: DragState = {
  isDragging: false,
  elementId: null,
  startPosition: { x: 0, y: 0 },
  startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
  hasMovedBeyondThreshold: false,
};

const INITIAL_TOUCH_STATE: TouchState = {
  isTouching: false,
  isDragging: false,
  elementId: null,
  startPosition: { x: 0, y: 0 },
  startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
  startTimestamp: 0,
};

const createResponsivePosition = (
  existingPosition: ResponsivePosition | undefined,
  deviceType: DeviceType,
  newPosition: FixedPosition
): ResponsivePosition => {
  const defaultPosition = { x: 0, y: 0, width: 100, height: 100 };
  return {
    desktop: existingPosition?.desktop || defaultPosition,
    tablet: existingPosition?.tablet || defaultPosition,
    mobile: existingPosition?.mobile || defaultPosition,
    [deviceType]: newPosition,
  };
};

export const useCanvasGestures = (
  isEditable: boolean,
  currentSlide: SlideElement[] | undefined,
  deviceType: DeviceType,
  canvasRef: React.RefObject<HTMLDivElement>,
  handleElementUpdate: (elementId: string, updates: Partial<SlideElement>) => void,
  handleElementSelect: (elementId: string | null) => void,
  handleHotspotClick: (elementId: string, element: SlideElement) => void
) => {
  const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE);

  const [touchState, setTouchState] = useState<TouchState>(INITIAL_TOUCH_STATE);

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    const element = currentSlide?.find((el) => el.id === elementId);
    if (!element) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentPosition = element.position?.[deviceType as keyof typeof element.position] || { x: 0, y: 0, width: 100, height: 100 };
    setDragState({
      isDragging: true,
      elementId,
      startPosition: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      startElementPosition: currentPosition,
      hasMovedBeyondThreshold: false,
    });
  }, [isEditable, currentSlide, deviceType, canvasRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.elementId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentMousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const deltaX = currentMousePos.x - dragState.startPosition.x;
    const deltaY = currentMousePos.y - dragState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (!dragState.hasMovedBeyondThreshold && distance > DRAG_THRESHOLD_PIXELS) {
      setDragState((prev) => ({ ...prev, hasMovedBeyondThreshold: true }));
    }

    if (dragState.hasMovedBeyondThreshold) {
      const newPosition = {
        ...dragState.startElementPosition,
        x: Math.max(0, dragState.startElementPosition.x + deltaX),
        y: Math.max(0, dragState.startElementPosition.y + deltaY),
      };
      const existingPosition = currentSlide?.find((el) => el.id === dragState.elementId)?.position;
      const newResponsivePosition = createResponsivePosition(existingPosition, deviceType, newPosition);
      handleElementUpdate(dragState.elementId, { position: newResponsivePosition });
    }
  }, [dragState, deviceType, handleElementUpdate, currentSlide, canvasRef]);

  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging) return;
    if (!dragState.hasMovedBeyondThreshold && dragState.elementId) {
      const element = currentSlide?.find((el) => el.id === dragState.elementId);
      if (element?.type === 'hotspot') {
        handleHotspotClick(dragState.elementId, element);
      } else if (element) {
        handleElementSelect(dragState.elementId);
      }
    }
    setDragState(INITIAL_DRAG_STATE);
  }, [dragState, currentSlide, handleHotspotClick, handleElementSelect]);

  const handleTouchStartElement = useCallback((e: React.TouchEvent, elementId: string) => {
    if (!isEditable) return;
    e.stopPropagation();
    const element = currentSlide?.find((el) => el.id === elementId);
    if (!element) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentPosition = element.position?.[deviceType as keyof typeof element.position] || { x: 0, y: 0, width: 100, height: 100 };
    setTouchState({
      isTouching: true,
      isDragging: false,
      elementId,
      startPosition: { x: touch.clientX - rect.left, y: touch.clientY - rect.top },
      startElementPosition: currentPosition,
      startTimestamp: Date.now(),
    });
  }, [isEditable, currentSlide, deviceType, canvasRef]);

  const handleTouchMoveElement = useCallback((e: React.TouchEvent) => {
    if (!touchState.isTouching || !touchState.elementId) return;
    e.stopPropagation();
    const touch = e.touches?.[0];
    if (!touch) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentTouchPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    const deltaX = currentTouchPos.x - touchState.startPosition.x;
    const deltaY = currentTouchPos.y - touchState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (!touchState.isDragging && distance > DRAG_THRESHOLD_PIXELS) {
      setTouchState((prev) => ({ ...prev, isDragging: true }));
    }

    if (touchState.isDragging) {
      e.preventDefault();
      const newPosition = {
        ...touchState.startElementPosition,
        x: Math.max(0, touchState.startElementPosition.x + deltaX),
        y: Math.max(0, touchState.startElementPosition.y + deltaY),
      };
      const existingPosition = currentSlide?.find((el) => el.id === touchState.elementId)?.position;
      const newResponsivePosition = createResponsivePosition(existingPosition, deviceType, newPosition);
      handleElementUpdate(touchState.elementId, { position: newResponsivePosition });
    }
  }, [touchState, deviceType, handleElementUpdate, currentSlide, canvasRef]);

  const handleTouchEndElement = useCallback((e: React.TouchEvent) => {
    if (!touchState.isTouching) return;
    e.stopPropagation();
    const touchDuration = Date.now() - touchState.startTimestamp;
    if (!touchState.isDragging && touchDuration < TAP_MAX_DURATION && touchState.elementId) {
      const element = currentSlide?.find((el) => el.id === touchState.elementId);
      if (element?.type === 'hotspot') {
        handleHotspotClick(touchState.elementId, element);
      } else {
        handleElementSelect(touchState.elementId);
      }
    }
    setTouchState(INITIAL_TOUCH_STATE);
  }, [touchState, handleHotspotClick, handleElementSelect, currentSlide]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStartElement,
    handleTouchMoveElement,
    handleTouchEndElement,
  };
};
