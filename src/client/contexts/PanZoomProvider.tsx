import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { InteractionType } from '../../shared/InteractionPresets';
import { ImageTransformState, TimelineEventData, HotspotData } from '../../shared/types';
import { useEventGestureCoordination } from '../hooks/useEventGestureCoordination';
import { usePanZoomEngine } from '../hooks/usePanZoomEngine';

interface PanZoomContextValue {
  // Transform state
  currentTransform: ImageTransformState;
  
  // Engine methods
  executePanZoom: (event: TimelineEventData, hotspots?: HotspotData[]) => void;
  resetTransform: (animate?: boolean) => void;
  setTransform: (transform: ImageTransformState, animate?: boolean) => void;
  
  // Gesture coordination
  isEventActive: (eventId?: string) => boolean;
  shouldBlockGestures: () => boolean;
  setEventActive: (eventType: InteractionType, eventId: string, blockGestures?: boolean, duration?: number) => void;
  setEventInactive: () => void;
  
  // Element refs (to be set by consuming components)
  setContainerElement: (element: HTMLElement | null) => void;
  setImageElement: (element: HTMLImageElement | null) => void;
  
  // Configuration
  updateConfig: (config: Partial<PanZoomConfig>) => void;
}

interface PanZoomConfig {
  defaultZoomLevel: number;
  animationDuration: number;
  animationEasing: string;
}

const DEFAULT_CONFIG: PanZoomConfig = {
  defaultZoomLevel: 2.0,
  animationDuration: 600,
  animationEasing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
};

const PanZoomContext = createContext<PanZoomContextValue | null>(null);

interface PanZoomProviderProps {
  children: ReactNode;
  config?: Partial<PanZoomConfig>;
}

export const PanZoomProvider: React.FC<PanZoomProviderProps> = ({ 
  children, 
  config: initialConfig = {} 
}) => {
  const [currentTransform, setCurrentTransform] = useState<ImageTransformState>({
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  
  const [config, setConfig] = useState<PanZoomConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });

  const containerElementRef = useRef<HTMLElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Event/gesture coordination
  const eventGestureCoordination = useEventGestureCoordination();

  // Pan/zoom engine
  const panZoomEngine = usePanZoomEngine({
    containerElement: containerElementRef.current,
    imageElement: imageElementRef.current,
    onTransformUpdate: setCurrentTransform,
    defaultZoomLevel: config.defaultZoomLevel,
    animationDuration: config.animationDuration,
    animationEasing: config.animationEasing
  });

  // Element setters
  const setContainerElement = useCallback((element: HTMLElement | null) => {
    containerElementRef.current = element;
  }, []);

  const setImageElement = useCallback((element: HTMLImageElement | null) => {
    imageElementRef.current = element;
  }, []);

  // Configuration updater
  const updateConfig = useCallback((newConfig: Partial<PanZoomConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const contextValue: PanZoomContextValue = {
    // Transform state
    currentTransform,
    
    // Engine methods
    executePanZoom: panZoomEngine.executePanZoom,
    resetTransform: panZoomEngine.resetTransform,
    setTransform: panZoomEngine.setTransform,
    
    // Gesture coordination
    isEventActive: eventGestureCoordination.isEventActive,
    shouldBlockGestures: eventGestureCoordination.shouldBlockGestures,
    setEventActive: eventGestureCoordination.setEventActive,
    setEventInactive: eventGestureCoordination.setEventInactive,
    
    // Element management
    setContainerElement,
    setImageElement,
    
    // Configuration
    updateConfig
  };

  return (
    <PanZoomContext.Provider value={contextValue}>
      {children}
    </PanZoomContext.Provider>
  );
};

/**
 * Hook to access pan/zoom context
 */
export const usePanZoom = (): PanZoomContextValue => {
  const context = useContext(PanZoomContext);
  if (!context) {
    throw new Error('usePanZoom must be used within a PanZoomProvider');
  }
  return context;
};