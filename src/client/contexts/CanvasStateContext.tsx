import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ImageTransformState } from '../../shared/types';
import { ViewportBounds } from '../utils/touchUtils';

// Canvas dimension types
export interface CanvasDimensions {
  width: number;
  height: number;
  top: number;
  left: number;
}

// Drag state types
export interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  hasMovedBeyondThreshold: boolean;
}

// Touch gesture state types
export interface GestureState {
  isActive: boolean;
  type: 'pan' | 'pinch' | 'rotate' | null;
  startTime: number;
  initialDistance: number;
  initialAngle: number;
}

// Canvas state interface
export interface CanvasState {
  dimensions: CanvasDimensions;
  viewportTransform: ImageTransformState;
  dragState: DragState;
  touchGestures: GestureState;
  viewportBounds: ViewportBounds;
  isTransforming: boolean;
}

// Initial states
const initialDragState: DragState = {
  isDragging: false,
  elementId: null,
  startPosition: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 },
  hasMovedBeyondThreshold: false,
};

const initialGestureState: GestureState = {
  isActive: false,
  type: null,
  startTime: 0,
  initialDistance: 0,
  initialAngle: 0,
};

const initialCanvasState: CanvasState = {
  dimensions: { width: 1, height: 1, top: 0, left: 0 },
  viewportTransform: { scale: 1, translateX: 0, translateY: 0 },
  dragState: initialDragState,
  touchGestures: initialGestureState,
  viewportBounds: { width: 0, height: 0, contentWidth: 0, contentHeight: 0 },
  isTransforming: false,
};

// Context type
interface CanvasStateContextType {
  state: CanvasState;
  // Dimension management
  updateDimensions: (dimensions: CanvasDimensions) => void;
  // Transform management
  setViewportTransform: (transform: ImageTransformState | ((prev: ImageTransformState) => ImageTransformState)) => void;
  resetTransform: () => void;
  // Drag state management
  startDrag: (elementId: string, startPosition: { x: number; y: number }) => void;
  updateDrag: (currentPosition: { x: number; y: number }, hasMovedBeyondThreshold?: boolean) => void;
  endDrag: () => void;
  // Gesture state management
  startGesture: (type: GestureState['type'], initialDistance?: number, initialAngle?: number) => void;
  endGesture: () => void;
  // Viewport management
  updateViewportBounds: (bounds: ViewportBounds) => void;
  setIsTransforming: (isTransforming: boolean) => void;
}

const CanvasStateContext = createContext<CanvasStateContextType | null>(null);

// Provider component
interface CanvasStateProviderProps {
  children: ReactNode;
}

export const CanvasStateProvider: React.FC<CanvasStateProviderProps> = ({ children }) => {
  const [state, setState] = useState<CanvasState>(initialCanvasState);

  // Dimension management
  const updateDimensions = (dimensions: CanvasDimensions) => {
    setState(prev => ({
      ...prev,
      dimensions,
    }));
  };

  // Transform management
  const setViewportTransform = (transform: ImageTransformState | ((prev: ImageTransformState) => ImageTransformState)) => {
    setState(prev => ({
      ...prev,
      viewportTransform: typeof transform === 'function' ? transform(prev.viewportTransform) : transform,
    }));
  };

  const resetTransform = () => {
    setViewportTransform({ scale: 1, translateX: 0, translateY: 0 });
  };

  // Drag state management
  const startDrag = (elementId: string, startPosition: { x: number; y: number }) => {
    setState(prev => ({
      ...prev,
      dragState: {
        isDragging: true,
        elementId,
        startPosition,
        currentPosition: startPosition,
        hasMovedBeyondThreshold: false,
      },
    }));
  };

  const updateDrag = (currentPosition: { x: number; y: number }, hasMovedBeyondThreshold = false) => {
    setState(prev => ({
      ...prev,
      dragState: {
        ...prev.dragState,
        currentPosition,
        hasMovedBeyondThreshold: hasMovedBeyondThreshold || prev.dragState.hasMovedBeyondThreshold,
      },
    }));
  };

  const endDrag = () => {
    setState(prev => ({
      ...prev,
      dragState: initialDragState,
    }));
  };

  // Gesture state management
  const startGesture = (type: GestureState['type'], initialDistance = 0, initialAngle = 0) => {
    setState(prev => ({
      ...prev,
      touchGestures: {
        isActive: true,
        type,
        startTime: Date.now(),
        initialDistance,
        initialAngle,
      },
    }));
  };

  const endGesture = () => {
    setState(prev => ({
      ...prev,
      touchGestures: initialGestureState,
    }));
  };

  // Viewport management
  const updateViewportBounds = (bounds: ViewportBounds) => {
    setState(prev => ({
      ...prev,
      viewportBounds: bounds,
    }));
  };

  const setIsTransforming = (isTransforming: boolean) => {
    setState(prev => ({
      ...prev,
      isTransforming,
    }));
  };

  const contextValue: CanvasStateContextType = {
    state,
    updateDimensions,
    setViewportTransform,
    resetTransform,
    startDrag,
    updateDrag,
    endDrag,
    startGesture,
    endGesture,
    updateViewportBounds,
    setIsTransforming,
  };

  return (
    <CanvasStateContext.Provider value={contextValue}>
      {children}
    </CanvasStateContext.Provider>
  );
};

// Hook to use the context
export const useCanvasState = () => {
  const context = useContext(CanvasStateContext);
  if (!context) {
    throw new Error('useCanvasState must be used within a CanvasStateProvider');
  }
  return context;
};