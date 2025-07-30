/**
 * Responsive Canvas Component
 * 
 * Unified slide editor canvas that merges SlideEditor and MobileSlideEditor functionality.
 * Uses mobile-first approach with progressive enhancement for desktop features.
 * Supports both touch and mouse interactions seamlessly.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement, DeviceType, FixedPosition, ResponsivePosition, ElementInteraction } from '../../../shared/slideTypes';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { ImageTransformState, InteractionType } from '../../../shared/types';
import { ViewportBounds } from '../../utils/touchUtils';
import { calculateCanvasDimensions } from '../../utils/aspectRatioUtils';
import { getHotspotSizeClasses, defaultHotspotSize, getHotspotPixelDimensions } from '../../../shared/hotspotStylePresets';
import { HotspotFeedbackAnimation } from '../ui/HotspotFeedbackAnimation';
import SlideTimelineAdapter from '../SlideTimelineAdapter';
import MobilePropertiesPanel from './MobilePropertiesPanel';

export interface ResponsiveCanvasProps {
  slideDeck: SlideDeck;
  currentSlideIndex: number;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
  selectedElementId?: string | null;
  onElementSelect?: (elementId: string | null) => void;
  onElementUpdate?: (elementId: string, updates: Partial<SlideElement>) => void;
  onSlideUpdate?: (slideUpdates: Partial<InteractiveSlide>) => void;
  deviceTypeOverride?: DeviceType;
  className?: string;
  isEditable?: boolean;
  onAspectRatioChange?: (slideIndex: number, aspectRatio: string) => void;
}

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startPosition: { x: number; y: number };
  startElementPosition: FixedPosition;
}

interface TouchState {
  isTouching: boolean;
  isDragging: boolean;
  elementId: string | null;
  startPosition: { x: number; y: number };
  startElementPosition: FixedPosition;
  startTimestamp: number;
}

// Constants for interaction detection
const DRAG_THRESHOLD_PIXELS = 60;
const TAP_MAX_DURATION = 300;

/**
 * ResponsiveCanvas - Unified canvas supporting both touch and mouse interactions
 */
export const ResponsiveCanvas: React.FC<ResponsiveCanvasProps> = ({
  slideDeck,
  currentSlideIndex,
  onSlideDeckChange,
  selectedElementId: propSelectedElementId,
  onElementSelect,
  onElementUpdate,
  onSlideUpdate,
  deviceTypeOverride,
  className = '',
  isEditable = true,
  onAspectRatioChange,
}) => {
  // Device detection
  const { deviceType: detectedDeviceType } = useDeviceDetection();
  const deviceType = deviceTypeOverride || detectedDeviceType;
  const isMobile = useIsMobile();
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const slideAreaRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Internal state
  const [internalSelectedElementId, setInternalSelectedElementId] = useState<string | null>(null);
  const selectedElementId = propSelectedElementId ?? internalSelectedElementId;
  
  // Transform state for mobile pan/zoom
  const [canvasTransform, setCanvasTransform] = useState<ImageTransformState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  
  // Interaction state
  const [isTransforming, setIsTransforming] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: null,
    startPosition: { x: 0, y: 0 },
    startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
  });
  
  const [touchState, setTouchState] = useState<TouchState>({
    isTouching: false,
    isDragging: false,
    elementId: null,
    startPosition: { x: 0, y: 0 },
    startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
    startTimestamp: 0,
  });
  
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | undefined>();
  const [showMobilePropertiesPanel, setShowMobilePropertiesPanel] = useState(false);
  
  // Current slide and elements
  const currentSlide = slideDeck.slides[currentSlideIndex];
  const selectedElement = useMemo(() => {
    if (!selectedElementId || !currentSlide) return null;
    return currentSlide.elements?.find(el => el.id === selectedElementId) || null;
  }, [selectedElementId, currentSlide]);
  
  // Calculate viewport bounds for touch constraints
  const calculateViewportBounds = useCallback((): ViewportBounds | undefined => {
    const slideArea = slideAreaRef.current;
    const canvasContainer = canvasContainerRef.current;
    
    if (!slideArea || !canvasContainer) return undefined;
    
    const slideAreaRect = slideArea.getBoundingClientRect();
    const canvasRect = canvasContainer.getBoundingClientRect();
    
    return {
      minX: slideAreaRect.left - canvasRect.left,
      maxX: slideAreaRect.right - canvasRect.left - canvasRect.width,
      minY: slideAreaRect.top - canvasRect.top,
      maxY: slideAreaRect.bottom - canvasRect.top - canvasRect.height,
    };
  }, []);
  
  // Update viewport bounds when layout changes
  useEffect(() => {
    const bounds = calculateViewportBounds();
    setViewportBounds(bounds);
  }, [calculateViewportBounds, canvasTransform]);
  
  // Touch gesture handling for mobile
  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetTransform,
  } = useTouchGestures(
    canvasTransform,
    setCanvasTransform,
    setIsTransforming,
    canvasContainerRef,
    viewportBounds
  );
  
  // Element selection handlers
  const handleElementSelect = useCallback((elementId: string | null) => {
    if (onElementSelect) {
      onElementSelect(elementId);
    } else {
      setInternalSelectedElementId(elementId);
    }
    
    // Show mobile properties panel when element is selected on mobile
    if (isMobile && elementId && isEditable) {
      setShowMobilePropertiesPanel(true);
    }
  }, [onElementSelect, isMobile, isEditable]);
  
  // Element update handlers
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (onElementUpdate) {
      onElementUpdate(elementId, updates);
      return;
    }
    
    // Fallback to updating slide deck directly
    const updatedSlideDeck = {
      ...slideDeck,
      slides: slideDeck.slides.map((slide, index) => {
        if (index !== currentSlideIndex) return slide;
        
        return {
          ...slide,
          elements: slide.elements?.map(element => 
            element.id === elementId ? { ...element, ...updates } : element
          ) || [],
        };
      }),
    };
    
    onSlideDeckChange(updatedSlideDeck);
  }, [onElementUpdate, slideDeck, currentSlideIndex, onSlideDeckChange]);
  
  // Mouse event handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    if (!isEditable || isMobile) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = currentSlide?.elements?.find(el => el.id === elementId);
    if (!element) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentPosition = element.position?.[deviceType] || { x: 0, y: 0, width: 100, height: 100 };
    
    setDragState({
      isDragging: true,
      elementId,
      startPosition: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      startElementPosition: currentPosition,
    });
    
    handleElementSelect(elementId);
  }, [isEditable, isMobile, currentSlide, deviceType, handleElementSelect]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.elementId || isMobile) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentMousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const deltaX = currentMousePos.x - dragState.startPosition.x;
    const deltaY = currentMousePos.y - dragState.startPosition.y;
    
    const newPosition = {
      ...dragState.startElementPosition,
      x: Math.max(0, dragState.startElementPosition.x + deltaX),
      y: Math.max(0, dragState.startElementPosition.y + deltaY),
    };
    
    handleElementUpdate(dragState.elementId, {
      position: {
        ...currentSlide?.elements?.find(el => el.id === dragState.elementId)?.position,
        [deviceType]: newPosition,
      },
    });
  }, [dragState, isMobile, deviceType, handleElementUpdate, currentSlide]);
  
  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging) return;
    
    setDragState({
      isDragging: false,
      elementId: null,
      startPosition: { x: 0, y: 0 },
      startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
    });
  }, [dragState.isDragging]);
  
  // Touch event handlers for mobile
  const handleTouchStartElement = useCallback((e: React.TouchEvent, elementId: string) => {
    if (!isEditable || !isMobile) return;
    
    e.stopPropagation();
    
    const element = currentSlide?.elements?.find(el => el.id === elementId);
    if (!element) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentPosition = element.position?.[deviceType] || { x: 0, y: 0, width: 100, height: 100 };
    
    setTouchState({
      isTouching: true,
      isDragging: false,
      elementId,
      startPosition: { x: touch.clientX - rect.left, y: touch.clientY - rect.top },
      startElementPosition: currentPosition,
      startTimestamp: Date.now(),
    });
  }, [isEditable, isMobile, currentSlide, deviceType]);
  
  const handleTouchMoveElement = useCallback((e: React.TouchEvent) => {
    if (!touchState.isTouching || !touchState.elementId || !isMobile) return;
    
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentTouchPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    const deltaX = currentTouchPos.x - touchState.startPosition.x;
    const deltaY = currentTouchPos.y - touchState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Start dragging if moved beyond threshold
    if (!touchState.isDragging && distance > DRAG_THRESHOLD_PIXELS) {
      setTouchState(prev => ({ ...prev, isDragging: true }));
    }
    
    if (touchState.isDragging) {
      e.preventDefault(); // Prevent scrolling while dragging
      
      const newPosition = {
        ...touchState.startElementPosition,
        x: Math.max(0, touchState.startElementPosition.x + deltaX),
        y: Math.max(0, touchState.startElementPosition.y + deltaY),
      };
      
      handleElementUpdate(touchState.elementId, {
        position: {
          ...currentSlide?.elements?.find(el => el.id === touchState.elementId)?.position,
          [deviceType]: newPosition,
        },
      });
    }
  }, [touchState, isMobile, deviceType, handleElementUpdate, currentSlide]);
  
  const handleTouchEndElement = useCallback((e: React.TouchEvent) => {
    if (!touchState.isTouching) return;
    
    const touchDuration = Date.now() - touchState.startTimestamp;
    
    // If it was a quick tap without dragging, select the element
    if (!touchState.isDragging && touchDuration < TAP_MAX_DURATION && touchState.elementId) {
      handleElementSelect(touchState.elementId);
    }
    
    setTouchState({
      isTouching: false,
      isDragging: false,
      elementId: null,
      startPosition: { x: 0, y: 0 },
      startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
      startTimestamp: 0,
    });
  }, [touchState, handleElementSelect]);
  
  // Canvas click handler for deselecting elements
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      handleElementSelect(null);
      setShowMobilePropertiesPanel(false);
    }
  }, [handleElementSelect]);
  
  // Calculate canvas dimensions
  const canvasDimensions = useMemo(() => {
    if (!currentSlide) return { width: 800, height: 450 };
    
    const aspectRatio = currentSlide.layout?.aspectRatio || '16:9';
    return calculateCanvasDimensions(aspectRatio, isMobile);
  }, [currentSlide, isMobile]);
  
  // Render slide elements
  const renderElements = useCallback(() => {
    if (!currentSlide?.elements) return null;
    
    return currentSlide.elements.map((element) => {
      const position = element.position?.[deviceType] || { x: 0, y: 0, width: 100, height: 100 };
      const isSelected = element.id === selectedElementId;
      
      return (
        <div
          key={element.id}
          className={`absolute cursor-pointer transition-all duration-200 ${
            isSelected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''
          }`}
          style={{
            left: position.x,
            top: position.y,
            width: position.width,
            height: position.height,
            zIndex: isSelected ? 1000 : 1,
          }}
          onMouseDown={(e) => handleMouseDown(e, element.id)}
          onTouchStart={(e) => handleTouchStartElement(e, element.id)}
          onTouchMove={handleTouchMoveElement}
          onTouchEnd={handleTouchEndElement}
        >
          {element.type === 'hotspot' && (
            <div className={`${getHotspotSizeClasses(defaultHotspotSize, isMobile)} bg-blue-500 bg-opacity-20 border-2 border-blue-500 rounded-full flex items-center justify-center`}>
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
            </div>
          )}
          
          {element.type === 'text' && (
            <div 
              className="w-full h-full flex items-center justify-center bg-slate-200 bg-opacity-90 rounded border-2 border-slate-400 text-slate-800 text-sm font-medium"
              style={{ fontSize: element.style?.fontSize || 16 }}
            >
              {element.content?.text || 'Text Element'}
            </div>
          )}
          
          {element.type === 'shape' && (
            <div 
              className="w-full h-full border-2 border-slate-400"
              style={{
                backgroundColor: element.style?.backgroundColor || '#e2e8f0',
                borderRadius: element.style?.shape === 'circle' ? '50%' : '0',
              }}
            />
          )}
          
          {element.type === 'media' && (
            <div className="w-full h-full bg-slate-300 border-2 border-slate-400 rounded flex items-center justify-center">
              <span className="text-slate-600 text-xs">Media</span>
            </div>
          )}
        </div>
      );
    });
  }, [currentSlide, deviceType, selectedElementId, isMobile, handleMouseDown, handleTouchStartElement, handleTouchMoveElement, handleTouchEndElement]);
  
  if (!currentSlide) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <p className="text-slate-500">No slide selected</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-slate-100 ${className}`}
    >
      {/* Slide area container */}
      <div 
        ref={slideAreaRef}
        className="w-full h-full flex items-center justify-center p-4"
      >
        {/* Canvas container with transform for mobile pan/zoom */}
        <div
          ref={canvasContainerRef}
          className="relative"
          style={{
            transform: isMobile ? `scale(${canvasTransform.scale}) translate(${canvasTransform.translateX}px, ${canvasTransform.translateY}px)` : undefined,
            transformOrigin: 'center center',
            transition: isTransforming ? 'none' : 'transform 0.3s ease-out',
          }}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          {/* Main canvas */}
          <div
            ref={canvasRef}
            className="relative bg-white shadow-lg overflow-hidden"
            style={{
              width: canvasDimensions.width,
              height: canvasDimensions.height,
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Background */}
            {currentSlide.backgroundMedia && (
              <div className="absolute inset-0">
                {currentSlide.backgroundMedia.type === 'image' && currentSlide.backgroundMedia.url && (
                  <img
                    src={currentSlide.backgroundMedia.url}
                    alt="Slide background"
                    className="w-full h-full object-cover"
                  />
                )}
                {currentSlide.backgroundMedia.type === 'color' && (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: currentSlide.backgroundMedia.color || '#ffffff' }}
                  />
                )}
              </div>
            )}
            
            {/* Elements */}
            {renderElements()}
            
            {/* Timeline adapter for legacy support */}
            {currentSlide.timeline && (
              <SlideTimelineAdapter
                timeline={currentSlide.timeline}
                onTimelineUpdate={(timeline) => {
                  if (onSlideUpdate) {
                    onSlideUpdate({ timeline });
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile properties panel */}
      {isMobile && showMobilePropertiesPanel && selectedElement && (
        <MobilePropertiesPanel
          selectedElement={selectedElement}
          deviceType={deviceType}
          onElementUpdate={handleElementUpdate}
          onDelete={() => {
            // Remove element from slide
            const updatedSlideDeck = {
              ...slideDeck,
              slides: slideDeck.slides.map((slide, index) => {
                if (index !== currentSlideIndex) return slide;
                
                return {
                  ...slide,
                  elements: slide.elements?.filter(el => el.id !== selectedElement.id) || [],
                };
              }),
            };
            onSlideDeckChange(updatedSlideDeck);
            setShowMobilePropertiesPanel(false);
            handleElementSelect(null);
          }}
          onClose={() => {
            setShowMobilePropertiesPanel(false);
            handleElementSelect(null);
          }}
        />
      )}
      
      {/* Touch gesture feedback */}
      {isMobile && isTransforming && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Scale: {(canvasTransform.scale * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
};

export default ResponsiveCanvas;