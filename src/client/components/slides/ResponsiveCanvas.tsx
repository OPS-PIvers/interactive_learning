/**
 * Responsive Canvas Component
 * 
 * Unified slide editor canvas that merges SlideEditor and MobileSlideEditor functionality.
 * Uses mobile-first approach with progressive enhancement for desktop features.
 * Supports both touch and mouse interactions seamlessly.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { getResponsiveHotspotSizeClasses, defaultHotspotSize } from '../../../shared/hotspotStylePresets';
import { SlideDeck, SlideElement, DeviceType, FixedPosition, ResponsivePosition } from '../../../shared/slideTypes';
import { ImageTransformState } from '../../../shared/types';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { calculateCanvasDimensions } from '../../utils/aspectRatioUtils';
import { ViewportBounds } from '../../utils/touchUtils';
import { Z_INDEX, Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';

export interface ResponsiveCanvasProps {
  slideDeck: SlideDeck;
  currentSlideIndex: number;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
  selectedElementId?: string | null;
  onElementSelect?: (elementId: string | null) => void;
  onElementUpdate?: (elementId: string, updates: Partial<SlideElement>) => void;
  onHotspotDoubleClick?: (elementId: string) => void;
  deviceTypeOverride?: DeviceType;
  className?: string;
  isEditable?: boolean;
}

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startPosition: {x: number;y: number;};
  startElementPosition: FixedPosition;
  hasMovedBeyondThreshold: boolean; // Track if user has actually dragged beyond threshold
}

interface TouchState {
  isTouching: boolean;
  isDragging: boolean;
  elementId: string | null;
  startPosition: {x: number;y: number;};
  startElementPosition: FixedPosition;
  startTimestamp: number;
}

// Constants for interaction detection
const DRAG_THRESHOLD_PIXELS = 60;
const TAP_MAX_DURATION = 300;
const DOUBLE_CLICK_DELAY = 300;

// Default viewport bounds for initialization
const DEFAULT_VIEWPORT_BOUNDS: ViewportBounds = {
  width: 800,
  height: 600,
  contentWidth: 800,
  contentHeight: 600
};

// Helper function to create responsive position object
const createResponsivePosition = (
existingPosition: ResponsivePosition | undefined,
deviceType: DeviceType,
newPosition: FixedPosition)
: ResponsivePosition => {
  const defaultPosition = { x: 0, y: 0, width: 100, height: 100 };
  return {
    desktop: existingPosition?.desktop || defaultPosition,
    tablet: existingPosition?.tablet || defaultPosition,
    mobile: existingPosition?.mobile || defaultPosition,
    [deviceType]: newPosition
  };
};

/**
 * ResponsiveCanvas - Unified canvas supporting both touch and mouse interactions
 */
const ResponsiveCanvasComponent: React.FC<ResponsiveCanvasProps> = ({
  slideDeck,
  currentSlideIndex,
  onSlideDeckChange,
  selectedElementId: propSelectedElementId,
  onElementSelect,
  onElementUpdate,
  onHotspotDoubleClick,
  deviceTypeOverride,
  className = '',
  isEditable = true
}) => {
  // Viewport info for calculations - Memoized to prevent unnecessary recalculations
  const { viewportInfo } = useDeviceDetection();
  const deviceType = useMemo(() => {
    if (deviceTypeOverride) return deviceTypeOverride;
    // Determine device type from viewport width for calculations
    if (viewportInfo.width < 768) return 'mobile';
    if (viewportInfo.width < 1024) return 'tablet';
    return 'desktop';
  }, [deviceTypeOverride, viewportInfo.width]);

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
    translateY: 0
  });

  // Interaction state
  const [isTransforming, setIsTransforming] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: null,
    startPosition: { x: 0, y: 0 },
    startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
    hasMovedBeyondThreshold: false
  });

  const [touchState, setTouchState] = useState<TouchState>({
    isTouching: false,
    isDragging: false,
    elementId: null,
    startPosition: { x: 0, y: 0 },
    startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
    startTimestamp: 0
  });

  // Double-click detection state
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedElementId, setLastClickedElementId] = useState<string | null>(null);

  const [viewportBounds, setViewportBounds] = useState<ViewportBounds>(DEFAULT_VIEWPORT_BOUNDS);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Current slide and elements
  // Memoize current slide to prevent object recreation
  const currentSlide = useMemo(() => 
    slideDeck?.slides?.[currentSlideIndex], 
    [slideDeck?.slides, currentSlideIndex]
  );

  // Enhanced debug logging for canvas rendering
  useEffect(() => {






















    if (!currentSlide) {
      console.error('❌ ResponsiveCanvas: currentSlide is null/undefined!');
    } else if (currentSlide.backgroundMedia) {








    } else {

    }
  }, [currentSlide, currentSlideIndex, slideDeck, deviceType]);

  // Update container dimensions when layout changes
  useEffect(() => {
    const updateContainerDimensions = () => {
      if (slideAreaRef.current) {
        const rect = slideAreaRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width || document.documentElement.clientWidth - 32, // More reasonable fallback
          height: rect.height || document.documentElement.clientHeight - 160 // Header(60) + Toolbar(80) + padding
        });
      } else {
        // Fallback to document dimensions
        setContainerDimensions({
          width: document.documentElement.clientWidth - 32,
          height: document.documentElement.clientHeight - 160
        });
      }
    };

    // Initial update
    updateContainerDimensions();

    // Update on window resize
    const handleResize = () => {
      // Small delay to allow layout to settle
      setTimeout(updateContainerDimensions, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);


  // Calculate viewport bounds for touch constraints
  const calculateViewportBounds = useCallback((): ViewportBounds => {
    const slideArea = slideAreaRef.current;
    const canvasContainer = canvasContainerRef.current;

    if (!slideArea || !canvasContainer) {
      return { width: 0, height: 0, contentWidth: 0, contentHeight: 0 };
    }

    const slideAreaRect = slideArea.getBoundingClientRect();
    const canvasRect = canvasContainer.getBoundingClientRect();

    return {
      width: slideAreaRect.width,
      height: slideAreaRect.height,
      contentWidth: canvasRect.width,
      contentHeight: canvasRect.height
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
    handleTouchEnd
  } = useTouchGestures(
    canvasContainerRef,
    canvasTransform,
    setCanvasTransform,
    setIsTransforming,
    { viewportBounds }
  );
  // Element selection handlers
  const handleElementSelect = useCallback((elementId: string | null) => {
    if (onElementSelect) {
      onElementSelect(elementId);
    } else {
      setInternalSelectedElementId(elementId);
    }

    // Element selection handled - properties panel managed by parent component
  }, [onElementSelect]);

  // Handle double-click detection for hotspots
  const handleHotspotClick = useCallback((elementId: string, element: SlideElement) => {
    if (!isEditable || element.type !== 'hotspot') return;

    const now = Date.now();
    const timeDiff = now - lastClickTime;

    if (timeDiff < DOUBLE_CLICK_DELAY && lastClickedElementId === elementId) {
      // Double-click detected

      if (onHotspotDoubleClick) {
        onHotspotDoubleClick(elementId);
      }
      setLastClickTime(0);
      setLastClickedElementId(null);
    } else {
      // Single click - select element
      handleElementSelect(elementId);
      setLastClickTime(now);
      setLastClickedElementId(elementId);
    }
  }, [isEditable, lastClickTime, lastClickedElementId, onHotspotDoubleClick, handleElementSelect]);
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
          elements: slide.elements?.map((element) =>
          element.id === elementId ? { ...element, ...updates } : element
          ) || []
        };
      })
    };

    onSlideDeckChange(updatedSlideDeck);
  }, [onElementUpdate, slideDeck, currentSlideIndex, onSlideDeckChange]);

  // Mouse event handlers (progressive enhancement - available on all devices)
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    if (!isEditable) return;

    e.preventDefault();
    e.stopPropagation();

    const element = currentSlide?.elements?.find((el) => el.id === elementId);
    if (!element) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentPosition = element.position?.[deviceType as keyof typeof element.position] || { x: 0, y: 0, width: 100, height: 100 };

    setDragState({
      isDragging: true,
      elementId,
      startPosition: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      startElementPosition: currentPosition,
      hasMovedBeyondThreshold: false
    });

    // Note: Click handling moved to mouse up to allow dragging
    // Selection will be handled after determining if this is a click or drag
  }, [isEditable, currentSlide, deviceType]);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.elementId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentMousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const deltaX = currentMousePos.x - dragState.startPosition.x;
    const deltaY = currentMousePos.y - dragState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check if we've moved beyond the drag threshold (similar to touch events)
    if (!dragState.hasMovedBeyondThreshold && distance > DRAG_THRESHOLD_PIXELS) {
      setDragState((prev) => ({ ...prev, hasMovedBeyondThreshold: true }));
    }

    // Only update position if we're actively dragging (beyond threshold)
    if (dragState.hasMovedBeyondThreshold) {
      const newPosition = {
        ...dragState.startElementPosition,
        x: Math.max(0, dragState.startElementPosition.x + deltaX),
        y: Math.max(0, dragState.startElementPosition.y + deltaY)
      };

      const existingPosition = currentSlide?.elements?.find((el) => el.id === dragState.elementId)?.position;
      const newResponsivePosition = createResponsivePosition(existingPosition, deviceType, newPosition);
      handleElementUpdate(dragState.elementId, {
        position: newResponsivePosition
      });
    }
  }, [dragState, deviceType, handleElementUpdate, currentSlide]);

  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging) return;

    // If no significant dragging occurred, treat as click
    if (!dragState.hasMovedBeyondThreshold && dragState.elementId) {
      const element = currentSlide?.elements?.find((el) => el.id === dragState.elementId);
      if (element && element.type === 'hotspot') {
        handleHotspotClick(dragState.elementId, element);
      } else if (element) {
        handleElementSelect(dragState.elementId);
      }
    }

    setDragState({
      isDragging: false,
      elementId: null,
      startPosition: { x: 0, y: 0 },
      startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
      hasMovedBeyondThreshold: false
    });
  }, [dragState.isDragging, dragState.hasMovedBeyondThreshold, dragState.elementId, currentSlide, handleHotspotClick, handleElementSelect]);

  // Touch event handlers (mobile-first - available on all devices)
  const handleTouchStartElement = useCallback((e: React.TouchEvent, elementId: string) => {
    if (!isEditable) return;

    e.stopPropagation();

    const element = currentSlide?.elements?.find((el) => el.id === elementId);
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
      startTimestamp: Date.now()
    });
  }, [isEditable, currentSlide, deviceType]);

  const handleTouchMoveElement = useCallback((e: React.TouchEvent) => {
    if (!touchState.isTouching || !touchState.elementId) return;

    const touch = e.touches?.[0];
    if (!touch) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentTouchPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    const deltaX = currentTouchPos.x - touchState.startPosition.x;
    const deltaY = currentTouchPos.y - touchState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Start dragging if moved beyond threshold
    if (!touchState.isDragging && distance > DRAG_THRESHOLD_PIXELS) {
      setTouchState((prev) => ({ ...prev, isDragging: true }));
    }

    if (touchState.isDragging) {
      e.preventDefault(); // Prevent scrolling while dragging

      const newPosition = {
        ...touchState.startElementPosition,
        x: Math.max(0, touchState.startElementPosition.x + deltaX),
        y: Math.max(0, touchState.startElementPosition.y + deltaY)
      };

      const existingPosition = currentSlide?.elements?.find((el) => el.id === touchState.elementId)?.position;
      const newResponsivePosition = createResponsivePosition(existingPosition, deviceType, newPosition);
      handleElementUpdate(touchState.elementId, {
        position: newResponsivePosition
      });
    }
  }, [touchState, deviceType, handleElementUpdate, currentSlide]);

  const handleTouchEndElement = useCallback((_e: React.TouchEvent) => {
    if (!touchState.isTouching) return;

    const touchDuration = Date.now() - touchState.startTimestamp;

    // If it was a quick tap without dragging, handle as click
    if (!touchState.isDragging && touchDuration < TAP_MAX_DURATION && touchState.elementId) {
      const element = currentSlide?.elements?.find((el) => el.id === touchState.elementId);
      if (element && element.type === 'hotspot') {
        handleHotspotClick(touchState.elementId, element);
      } else {
        handleElementSelect(touchState.elementId);
      }
    }

    setTouchState({
      isTouching: false,
      isDragging: false,
      elementId: null,
      startPosition: { x: 0, y: 0 },
      startElementPosition: { x: 0, y: 0, width: 100, height: 100 },
      startTimestamp: 0
    });
  }, [touchState, handleHotspotClick, handleElementSelect, currentSlide]);

  // Canvas click handler for deselecting elements
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      handleElementSelect(null);
    }
  }, [handleElementSelect]);

  // Calculate canvas dimensions
  const canvasDimensions = useMemo(() => {
    if (!currentSlide) return { width: 800, height: 450 };

    const aspectRatio = currentSlide.layout?.aspectRatio || '16:9';

    // Use state-managed container dimensions with fallbacks
    const containerWidth = containerDimensions.width > 0 ? containerDimensions.width : 800;
    const containerHeight = containerDimensions.height > 0 ? containerDimensions.height : 600;

    if (process.env['NODE_ENV'] === 'development') {








    }

    // Use standard padding - responsive behavior handled by CSS classes
    const dimensions = calculateCanvasDimensions(
      aspectRatio,
      containerWidth,
      containerHeight,
      24, // Standard padding for all viewports - CSS handles responsiveness
      false // Remove landscape-specific logic
    );

    if (process.env['NODE_ENV'] === 'development') {

    }

    return dimensions;
  }, [currentSlide, containerDimensions]);
  // Render slide elements
  const renderElements = useCallback(() => {
    if (!currentSlide?.elements) return null;

    return currentSlide.elements.map((element) => {
      const position = element.position?.[deviceType as keyof typeof element.position] || { x: 0, y: 0, width: 100, height: 100 };
      const isSelected = element.id === selectedElementId;

      return (
        <div
          key={element.id}
          className={`absolute cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''}`
          }
          style={{
            left: position.x,
            top: position.y,
            width: position.width,
            height: position.height,
            zIndex: isSelected ? Z_INDEX.SELECTED_ELEMENTS : Z_INDEX.SLIDE_CONTENT // Ensure elements are above background (z-0)
          }}
          onMouseDown={(e) => handleMouseDown(e, element.id)}
          onTouchStart={(e) => handleTouchStartElement(e, element.id)}
          onTouchMove={handleTouchMoveElement}
          onTouchEnd={handleTouchEndElement}>

          {element.type === 'hotspot' &&
          <div
            className={`${getResponsiveHotspotSizeClasses(defaultHotspotSize)} rounded-full flex items-center justify-center transition-all duration-200 ease-in-out hover:scale-105`}
            style={{
              backgroundColor: element.style?.backgroundColor || '#3b82f6',
              opacity: (element.style?.opacity || 1) * 0.2, // Background opacity
              borderWidth: element.style?.borderWidth || 2,
              borderColor: element.style?.borderColor || element.style?.backgroundColor || '#3b82f6',
              borderStyle: 'solid'
            }}>

              <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: element.style?.backgroundColor || '#3b82f6',
                opacity: element.style?.opacity || 1 // Full opacity for center dot
              }} />

              {isEditable &&
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-black bg-opacity-75 text-white px-1 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                  Double-click to edit
                </div>
            }
            </div>
          }
          
          {element.type === 'text' &&
          <div
            className="w-full h-full flex items-center justify-center bg-slate-200 bg-opacity-90 rounded border-2 border-slate-400 text-slate-800 text-sm font-medium"
            style={{ fontSize: element.style?.fontSize || 16 }}>

              {element.content?.textContent || 'Text Element'}
            </div>
          }
          
          {element.type === 'shape' &&
          <div
            className="w-full h-full border-2 border-slate-400"
            style={{
              backgroundColor: element.style?.backgroundColor || '#e2e8f0',
              borderRadius: element.style?.customShape === 'circle' ? '50%' : '0'
            }} />

          }
          
          {element.type === 'media' &&
          <div className="w-full h-full bg-slate-300 border-2 border-slate-400 rounded flex items-center justify-center">
              <span className="text-slate-600 text-xs">Media</span>
            </div>
          }
        </div>);

    });
  }, [currentSlide, deviceType, selectedElementId, handleMouseDown, handleTouchStartElement, handleTouchMoveElement, handleTouchEndElement, isEditable]);

  if (!currentSlide) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <p className="text-slate-500">No slide selected</p>
      </div>);

  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-slate-100 ${className} ${
        deviceType === 'mobile' ? 'mobile-canvas-container' : ''
      }`}>

      {/* Slide area container with mobile optimization */}
      <div
        ref={slideAreaRef}
        className={`w-full h-full flex items-center justify-center ${
          deviceType === 'mobile' ? 'p-2' : 'p-4'
        }`}>

        {/* Canvas container with mobile-specific sizing */}
        <div
          ref={canvasContainerRef}
          className="relative mobile-responsive-canvas"
          style={{
            transform: `scale(${canvasTransform.scale}) translate(${canvasTransform.translateX}px, ${canvasTransform.translateY}px)`,
            transformOrigin: 'center center',
            transition: isTransforming ? 'none' : 'transform 0.3s ease-out',
            minHeight: deviceType === 'mobile' ? '300px' : 'auto',
            width: '100%',
            height: '100%'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>

          {/* Main canvas */}
          <div
            ref={canvasRef}
            className="relative bg-white shadow-lg overflow-hidden"
            style={{
              width: canvasDimensions.width,
              height: canvasDimensions.height
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}>

            {/* Background */}
            {currentSlide?.backgroundMedia &&
            <div
              className={`absolute inset-0 ${Z_INDEX_TAILWIND.BASE}`}
              style={{
                backgroundColor: '#f3f4f6', // Light gray fallback to show div exists
                border: process.env['NODE_ENV'] === 'development' ? '2px solid red' : 'none' // Debug border
              }}>

                {process.env['NODE_ENV'] === 'development' &&
              <div className={`absolute top-2 left-2 bg-black/75 text-white text-xs p-1 rounded ${Z_INDEX_TAILWIND.DEBUG_OVERLAY}`}>
                    BG: {currentSlide.backgroundMedia.type} | {currentSlide.backgroundMedia.url ? 'has URL' : 'no URL'}
                  </div>
              }
                
                {currentSlide.backgroundMedia.type === 'image' && currentSlide.backgroundMedia.url &&
              <img
                src={currentSlide.backgroundMedia.url}
                alt="Slide background"
                className="w-full h-full object-cover"
                onLoad={() => {






                }}
                onError={(e) => {
                  console.error('❌ Background image failed to load:', {
                    url: currentSlide.backgroundMedia?.url,
                    error: e,
                    slideId: currentSlide.id
                  });
                }}
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block' // Ensure image displays
                }} />

              }
                {currentSlide.backgroundMedia.type === 'color' &&
              <div
                className="w-full h-full"
                style={{ backgroundColor: currentSlide.backgroundMedia.color || '#ffffff' }} />

              }
              </div>
            }
            
            {/* Debug info when no background media */}
            {process.env['NODE_ENV'] === 'development' && !currentSlide?.backgroundMedia &&
            <div className={`absolute top-2 left-2 bg-yellow-500/75 text-black text-xs p-1 rounded ${Z_INDEX_TAILWIND.DEBUG_OVERLAY}`}>
                No background media
              </div>
            }
            
            {/* Show empty state if no slide exists */}
            {!currentSlide &&
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-50">
                <div className="text-center">
                  <div className="text-4xl mb-2">📄</div>
                  <div className="text-lg font-medium mb-1">No slide available</div>
                  <div className="text-sm">Create your first slide to get started</div>
                </div>
              </div>
            }
            
            {/* Elements */}
            {renderElements()}
          </div>
        </div>
      </div>
      
      
      {/* Transform feedback (shows during pan/zoom on any device) */}
      {isTransforming &&
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Scale: {(canvasTransform.scale * 100).toFixed(0)}%
        </div>
      }
    </div>);

};

// Memoize ResponsiveCanvas to prevent unnecessary re-renders
export const ResponsiveCanvas = memo(ResponsiveCanvasComponent, (prevProps, nextProps) => {
  // Custom comparison for complex objects
  return (
    prevProps.currentSlideIndex === nextProps.currentSlideIndex &&
    prevProps.selectedElementId === nextProps.selectedElementId &&
    prevProps.deviceTypeOverride === nextProps.deviceTypeOverride &&
    prevProps.isEditable === nextProps.isEditable &&
    prevProps.className === nextProps.className &&
    prevProps.slideDeck === nextProps.slideDeck
  );
});

ResponsiveCanvas.displayName = 'ResponsiveCanvas';

export default ResponsiveCanvas;