import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement, DeviceType } from '../../../shared/slideTypes';
import { SlideEditor } from './SlideEditor';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { ImageTransformState } from '../../../shared/types';
import { ViewportBounds } from '../../utils/touchUtils';

interface MobileSlideEditorProps {
  slideDeck: SlideDeck;
  currentSlideIndex?: number;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
  onClose: () => void;
  className?: string;
  deviceTypeOverride?: DeviceType;
  onAspectRatioChange?: (slideIndex: number, aspectRatio: string) => void;
  selectedElementId?: string | null;
  onElementSelect?: (elementId: string | null) => void;
  onElementUpdate?: (elementId: string, updates: Partial<SlideElement>) => void;
  onSlideUpdate?: (slideUpdates: Partial<InteractiveSlide>) => void;
}

/**
 * MobileSlideEditor - Clean mobile-first slide editor with proper containment
 * 
 * Replaces TouchAwareSlideEditor with simplified approach:
 * - Fixed layout structure with proper containment
 * - Simple touch handling for element selection
 * - No complex zoom transforms that break layout
 * - Modal-based controls instead of side panels
 */
export const MobileSlideEditor: React.FC<MobileSlideEditorProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideAreaRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isLandscape] = useState(window.innerWidth > window.innerHeight);

  // Pan/zoom transform state
  const [canvasTransform, setCanvasTransform] = useState<ImageTransformState>({
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  const [isTransforming, setIsTransforming] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | undefined>(undefined);

  // Calculate viewport bounds for touch gesture constraints
  const calculateViewportBounds = useCallback((): ViewportBounds | undefined => {
    const slideArea = slideAreaRef.current;
    const canvasContainer = canvasContainerRef.current;
    
    if (!slideArea || !canvasContainer) {
      return undefined;
    }
    
    const slideAreaRect = slideArea.getBoundingClientRect();
    const canvasRect = canvasContainer.getBoundingClientRect();
    
    return {
      width: slideAreaRect.width,
      height: slideAreaRect.height,
      contentWidth: canvasRect.width / canvasTransform.scale, // Original content size
      contentHeight: canvasRect.height / canvasTransform.scale
    };
  }, [canvasTransform.scale]);

  // Update viewport bounds when layout changes
  useEffect(() => {
    const updateBounds = () => {
      const bounds = calculateViewportBounds();
      setViewportBounds(bounds);
    };

    // Initial calculation
    updateBounds();

    // Update on resize and orientation change
    const handleResize = () => {
      // Delay to allow layout to settle
      setTimeout(updateBounds, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [calculateViewportBounds]);

  // Touch gesture handling for pan/zoom scroll
  const touchHandlers = useTouchGestures(
    slideAreaRef,
    canvasTransform,
    setCanvasTransform,
    setIsTransforming,
    {
      minScale: 0.5,
      maxScale: 3,
      doubleTapZoomFactor: 2,
      isDragging,
      isEditing,
      isDragActive: isDragging,
      viewportBounds
    }
  );

  // Handle element interactions
  const handleElementSelect = useCallback((elementId: string | null) => {
    setIsEditing(!!elementId);
    if (props.onElementSelect) {
      props.onElementSelect(elementId);
    }
  }, [props]);

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (props.onElementUpdate) {
      props.onElementUpdate(elementId, updates);
    }
  }, [props]);

  // Detect when element dragging starts/stops to coordinate with pan/zoom
  useEffect(() => {
    const detectDragStart = (e: CustomEvent) => {
      setIsDragging(true);
      touchHandlers.setEventActive(true);
    };

    const detectDragEnd = (e: CustomEvent) => {
      setIsDragging(false);
      touchHandlers.setEventActive(false);
    };

    // Listen for custom events from slide elements
    document.addEventListener('slideElementDragStart', detectDragStart);
    document.addEventListener('slideElementDragEnd', detectDragEnd);

    return () => {
      document.removeEventListener('slideElementDragStart', detectDragStart);
      document.removeEventListener('slideElementDragEnd', detectDragEnd);
    };
  }, [touchHandlers]);

  // Prevent page scrolling within editor bounds, but allow hotspot interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      // Only prevent scroll if the touch isn't on an interactive element
      const target = e.target as HTMLElement;
      const isInteractiveElement = target?.closest('[data-hotspot-id]') || 
                                  target?.hasAttribute('data-hotspot-id') ||
                                  target?.closest('.hotspot-element') ||
                                  target?.classList.contains('hotspot-element') ||
                                  target?.closest('button') ||
                                  target?.closest('input') ||
                                  target?.closest('textarea');
      
      if (!isInteractiveElement) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      container.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`mobile-slide-editor mobile-viewport-manager ${props.className || ''}`}
      style={{
        /* Use full available space within parent layout */
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Slide viewport container - pan/zoom enabled */}
      <div 
        ref={slideAreaRef}
        className="mobile-slide-viewport"
        style={{
          /* Take full container space */
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: '#1e293b',
          /* Touch handling for pan/zoom gestures */
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        // Touch gesture event handlers
        onTouchStart={touchHandlers.handleTouchStart}
        onTouchMove={touchHandlers.handleTouchMove}
        onTouchEnd={touchHandlers.handleTouchEnd}
      >
        {/* Pan/zoom canvas container */}
        <div 
          ref={canvasContainerRef}
          className="mobile-slide-canvas-container"
          style={{
            /* Full viewport */
            width: '100%',
            height: '100%',
            position: 'relative',
            /* Apply pan/zoom transforms */
            transform: `translate(${canvasTransform.translateX}px, ${canvasTransform.translateY}px) scale(${canvasTransform.scale})`,
            transformOrigin: '0 0',
            /* Optimize for transform performance */
            willChange: isTransforming ? 'transform' : 'auto',
            /* Enable GPU acceleration */
            backfaceVisibility: 'hidden',
            /* Smooth transforms when not actively gesturing */
            transition: isTransforming ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          {/* Actual slide canvas - this will contain the slide content */}
          <div 
            className="mobile-slide-canvas touch-container"
            style={{
              /* Canvas sizing - maintain aspect ratio during zoom */
              width: '100%',
              height: '100%',
              minWidth: '100%',
              minHeight: '100%',
              position: 'relative',
              /* Enable content overflow for zoom */
              overflow: 'visible'
            }}
          >
            <SlideEditor
              {...props}
              className="h-full w-full mobile-editor-canvas"
              selectedElementId={props.selectedElementId}
              onElementSelect={handleElementSelect}
              onElementUpdate={handleElementUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileSlideEditor;