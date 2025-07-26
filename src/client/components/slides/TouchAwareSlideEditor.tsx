import React, { useState, useCallback, useRef, useMemo } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement, DeviceType } from '../../../shared/slideTypes';
import { SlideEditor } from './SlideEditor';
import { TouchContainer, MobileViewportManager } from '../touch';
import { usePinchZoom } from '../../hooks/usePinchZoom';
import { useIsMobile } from '../../hooks/useIsMobile';

interface TouchAwareSlideEditorProps {
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
 * TouchAwareSlideEditor - Enhanced SlideEditor with mobile touch capabilities
 * 
 * Integrates TouchContainer and MobileViewportManager for optimal mobile editing
 */
export const TouchAwareSlideEditor: React.FC<TouchAwareSlideEditorProps> = (props) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  // Initialize pinch-zoom functionality
  const {
    zoomState,
    transformStyle,
    handlePinchZoom,
    handlePanGesture,
    handleGestureStart,
    handleGestureEnd,
    resetZoom,
    zoomIn,
    zoomOut,
    isZoomed
  } = usePinchZoom({
    minScale: 0.3,
    maxScale: 3.0,
    initialScale: 1.0,
    containerWidth: canvasDimensions.width,
    containerHeight: canvasDimensions.height
  });

  // Handle viewport changes
  const handleViewportChange = useCallback((viewport: any) => {
    setIsLandscape(viewport.isLandscape);
  }, []);

  // Handle scale changes from viewport manager
  const handleScaleChange = useCallback((scale: number) => {
    // Update canvas dimensions based on viewport scale
    const baseWidth = 800;
    const baseHeight = 600;
    setCanvasDimensions({
      width: baseWidth * scale,
      height: baseHeight * scale
    });
  }, []);

  // Handle touch tap for element selection
  const handleTouchTap = useCallback((x: number, y: number) => {
    // Find element at touch coordinates
    if (props.onElementSelect) {
      // TODO: Implement element hit detection
      console.log(`Touch tap at ${x}, ${y}`);
    }
  }, [props.onElementSelect]);

  // Handle gesture start for UI feedback
  const handleTouchGestureStart = useCallback((gestureType: string) => {
    handleGestureStart(gestureType);
    
    // Hide floating elements during gestures for better UX
    if (gestureType === 'pinch' || gestureType === 'pan') {
      // Could trigger UI element hiding here
    }
  }, [handleGestureStart]);

  // Handle gesture end
  const handleTouchGestureEnd = useCallback(() => {
    handleGestureEnd();
    
    // Show floating elements again
  }, [handleGestureEnd]);

  // Zoom control buttons
  const ZoomControls = useMemo(() => {
    if (!isMobile) return null;
    
    return (
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700/90 text-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700/90 text-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors"
        >
          −
        </button>
        {isZoomed && (
          <button
            onClick={resetZoom}
            className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700/90 text-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors text-xs"
            title="Reset zoom"
          >
            1:1
          </button>
        )}
      </div>
    );
  }, [isMobile, zoomIn, zoomOut, resetZoom, isZoomed]);

  // Container styles for fixed layout
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    touchAction: 'none'
  };

  if (!isMobile) {
    // Desktop: use original SlideEditor without touch enhancements
    return <SlideEditor {...props} />;
  }

  return (
    <div style={containerStyle} className="touch-aware-slide-editor">
      <MobileViewportManager
        config={{
          minScale: 0.5,
          maxScale: 1.0,
          portraitPadding: 8,
          landscapePadding: 4,
          aspectRatio: '16:9',
          enableAutoScale: true
        }}
        onViewportChange={handleViewportChange}
        onScaleChange={handleScaleChange}
        className="h-full"
      >
        <TouchContainer
          className="h-full w-full"
          onPinchZoom={handlePinchZoom}
          onPanGesture={handlePanGesture}
          onTap={handleTouchTap}
          onGestureStart={handleTouchGestureStart}
          onGestureEnd={handleTouchGestureEnd}
          isolateTouch={true}
          minScale={0.3}
          maxScale={3.0}
          enablePan={true}
          enableZoom={true}
          style={{ position: 'relative' }}
        >
          {/* Apply zoom transform to the slide editor */}
          <div style={transformStyle} className="w-full h-full">
            <SlideEditor
              {...props}
              className={`${props.className || ''} touch-enabled`}
            />
          </div>
          
          {/* Zoom Controls */}
          {ZoomControls}
          
          {/* Touch gesture feedback */}
          {zoomState.isZooming && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/75 text-white px-3 py-1 rounded-full text-sm z-50">
              {Math.round(zoomState.scale * 100)}%
            </div>
          )}
          
          {/* Pan indicator */}
          {zoomState.isPanning && isZoomed && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-3 py-1 rounded-full text-xs z-50">
              Drag to pan
            </div>
          )}
        </TouchContainer>
      </MobileViewportManager>
      
      {/* Development debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded font-mono z-50">
          <div>Zoom: {Math.round(zoomState.scale * 100)}%</div>
          <div>Pan: {Math.round(zoomState.translateX)}, {Math.round(zoomState.translateY)}</div>
          <div>Gesture: {zoomState.isZooming ? 'Zoom' : zoomState.isPanning ? 'Pan' : 'None'}</div>
          <div>Canvas: {canvasDimensions.width}×{canvasDimensions.height}</div>
        </div>
      )}
    </div>
  );
};

export default TouchAwareSlideEditor;