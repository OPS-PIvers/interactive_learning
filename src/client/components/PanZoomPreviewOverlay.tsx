import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TimelineEventData } from '../../shared/types';

interface PanZoomPreviewOverlayProps {
  event: TimelineEventData;
  onUpdate: (event: TimelineEventData) => void;
  containerBounds: { width: number; height: number; left: number; top: number } | null;
}

const PanZoomPreviewOverlay: React.FC<PanZoomPreviewOverlayProps> = ({
  event,
  onUpdate,
  containerBounds
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isZoomSliding, setIsZoomSliding] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  // Get current zoom area properties with defaults
  const zoom = event.zoomLevel || event.zoomFactor || event.zoom || 2;
  
  // Calculate the viewable area size based on zoom level
  // Higher zoom = smaller viewable area (more zoomed in)
  const calculateViewableSize = (containerSize: number, zoomLevel: number) => {
    return containerSize / zoomLevel;
  };
  
  const zoomArea = {
    x: event.targetX || 50,
    y: event.targetY || 50,
    // Size is calculated based on zoom level and container bounds
    width: containerBounds ? calculateViewableSize(containerBounds.width, zoom) : 200,
    height: containerBounds ? calculateViewableSize(containerBounds.height, zoom) : 150,
    zoom: zoom
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, action: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    onUpdate({
      ...event,
      zoomLevel: newZoom,
      zoomFactor: newZoom,
      zoom: newZoom
    });
  }, [event, onUpdate]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerBounds || (!isDragging && !isResizing)) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    if (isDragging) {
      // Convert pixel movement to percentage - use smaller movement for better control
      const percentX = (deltaX / containerBounds.width) * 100;
      const percentY = (deltaY / containerBounds.height) * 100;
      
      const maxX = Math.max(0, 100 - (zoomArea.width / containerBounds.width) * 100);
      const maxY = Math.max(0, 100 - (zoomArea.height / containerBounds.height) * 100);
      
      const newX = Math.max(0, Math.min(maxX, zoomArea.x + percentX));
      const newY = Math.max(0, Math.min(maxY, zoomArea.y + percentY));

      // Update drag start position for incremental movement
      setDragStart({ x: e.clientX, y: e.clientY });

      onUpdate({
        ...event,
        targetX: newX,
        targetY: newY
      });
    } else if (isResizing) {
      // For pan/zoom, resizing changes the zoom level dynamically
      // Calculate new zoom based on rectangle size change
      const currentWidth = zoomArea.width;
      const currentHeight = zoomArea.height;
      
      // Use the diagonal distance for more intuitive resizing
      const currentSize = Math.sqrt(currentWidth * currentWidth + currentHeight * currentHeight);
      const deltaSize = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Determine if we're making it bigger or smaller
      const isIncreasing = deltaX > 0 || deltaY > 0;
      const sizeChange = isIncreasing ? deltaSize : -deltaSize;
      
      // Calculate new zoom level based on size change
      // Smaller rectangle = higher zoom, larger rectangle = lower zoom
      const sizeFactor = 1 - (sizeChange / currentSize) * 0.5;
      const newZoom = Math.max(0.5, Math.min(10, zoomArea.zoom / sizeFactor));

      // Update drag start position for incremental resizing
      setDragStart({ x: e.clientX, y: e.clientY });

      handleZoomChange(newZoom);
    }
  }, [isDragging, isResizing, dragStart, zoomArea, containerBounds, event, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Add CSS for the slider styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .slider::-webkit-slider-thumb {
        appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 2px solid #1d4ed8;
      }
      .slider::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: 2px solid #1d4ed8;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (!containerBounds) return null;

  // Calculate position in pixels
  const leftPx = (zoomArea.x / 100) * containerBounds.width;
  const topPx = (zoomArea.y / 100) * containerBounds.height;

  return (
    <div
      ref={overlayRef}
      className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
      style={{
        left: leftPx,
        top: topPx,
        width: zoomArea.width,
        height: zoomArea.height,
        zIndex: 1000,
        transition: isZoomSliding ? 'width 0.1s ease, height 0.1s ease' : 'none'
      }}
      onMouseDown={(e) => {
        // Don't start dragging if we're interacting with the slider
        if (isZoomSliding || e.target.closest('.slider-container')) {
          return;
        }
        handleMouseDown(e, 'drag');
      }}
    >
      {/* Zoom level indicator and slider */}
      <div 
        className="absolute -top-12 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-2 min-w-32 slider-container"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <span className="text-xs whitespace-nowrap">{zoomArea.zoom.toFixed(1)}x</span>
        <input
          ref={sliderRef}
          type="range"
          min="0.5"
          max="10"
          step="0.1"
          value={zoomArea.zoom}
          onChange={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const newZoom = parseFloat(e.target.value);
            handleZoomChange(newZoom);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsZoomSliding(true);
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsZoomSliding(false);
          }}
          onMouseMove={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="w-16 h-1 bg-blue-600 rounded-lg appearance-none cursor-pointer slider"
          title="Drag to adjust zoom level"
          style={{
            background: `linear-gradient(to right, #1d4ed8 0%, #1d4ed8 ${((zoomArea.zoom - 0.5) / 9.5) * 100}%, #3b82f6 ${((zoomArea.zoom - 0.5) / 9.5) * 100}%, #3b82f6 100%)`
          }}
        />
      </div>
      
      {/* Center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-4 h-4">
          <div className="absolute w-full h-0.5 bg-blue-500 top-1/2 left-0 transform -translate-y-1/2"></div>
          <div className="absolute h-full w-0.5 bg-blue-500 left-1/2 top-0 transform -translate-x-1/2"></div>
        </div>
      </div>
      
      {/* Viewable area indicator */}
      <div className="absolute inset-0 border border-blue-300 border-dashed pointer-events-none">
        <div className="absolute inset-1 bg-blue-100/10 rounded"></div>
      </div>

      {/* Zoom level resize handle */}
      <div
        className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded cursor-nw-resize hover:bg-blue-400 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
        title="Drag to adjust zoom level"
      />
      
      {/* Corner handles for precise positioning */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
    </div>
  );
};

export default PanZoomPreviewOverlay;