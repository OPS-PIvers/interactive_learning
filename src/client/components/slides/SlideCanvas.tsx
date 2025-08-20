import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SlideElement, BackgroundMedia, FixedPosition } from '../../../shared/slideTypes';
import { Z_INDEX } from '../../utils/zIndexLevels';

interface RelativePosition {
  x: number; // 0-1 (percentage of canvas width)
  y: number; // 0-1 (percentage of canvas height)
  width: number; // 0-1 (percentage of canvas width)
  height: number; // 0-1 (percentage of canvas height)
}

interface Hotspot {
  id: string;
  relativePosition: RelativePosition;
  element: SlideElement;
}

interface SlideCanvasProps {
  background: BackgroundMedia | undefined;
  hotspots: Hotspot[];
  aspectRatio: string; // '16:9', '4:3', etc.
  developmentMode: 'desktop' | 'mobile';
  onHotspotClick: (hotspot: Hotspot) => void;
  onHotspotDrag: (hotspotId: string, newPosition: RelativePosition) => void;
  onCanvasClick: (relativePosition: RelativePosition) => void;
  className?: string;
}

/**
 * SlideCanvas - The main editing canvas for slides
 * 
 * Handles:
 * - Background display (image/video/YouTube)
 * - Draggable hotspots with relative positioning
 * - Drag vs click detection
 * - Cross-device positioning consistency
 */
export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  background,
  hotspots,
  aspectRatio,
  developmentMode,
  onHotspotClick,
  onHotspotDrag,
  onCanvasClick,
  className = ''
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    hotspotId: string;
    startX: number;
    startY: number;
    isDragging: boolean;
  } | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  // Calculate canvas dimensions based on aspect ratio
  useEffect(() => {
    const updateDimensions = () => {
      if (!canvasRef.current) return;

      const container = canvasRef.current.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const maxWidth = containerRect.width - 32; // Account for padding
      const maxHeight = containerRect.height - 100; // Account for toolbar space

      const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
      if (!ratioW || !ratioH) return;
      const aspectValue = ratioW / ratioH;

      let width = maxWidth;
      let height = width / aspectValue;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectValue;
      }

      setCanvasDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [aspectRatio]);

  // Convert relative position to pixel position
  const relativeToPixel = useCallback((relativePos: RelativePosition): FixedPosition => {
    return {
      x: relativePos.x * canvasDimensions.width,
      y: relativePos.y * canvasDimensions.height,
      width: relativePos.width * canvasDimensions.width,
      height: relativePos.height * canvasDimensions.height,
    };
  }, [canvasDimensions]);

  // Convert pixel position to relative position
  const pixelToRelative = useCallback((pixelPos: { x: number; y: number }): RelativePosition => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, width: 0.05, height: 0.05 };

    const x = (pixelPos.x - rect.left) / canvasDimensions.width;
    const y = (pixelPos.y - rect.top) / canvasDimensions.height;

    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      width: 0.05, // Default hotspot size
      height: 0.05
    };
  }, [canvasDimensions]);

  // Handle mouse/touch start on hotspot
  const handleHotspotMouseDown = useCallback((hotspot: Hotspot, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const clientX = 'touches' in event ? (event.touches[0]?.clientX || 0) : event.clientX;
    const clientY = 'touches' in event ? (event.touches[0]?.clientY || 0) : event.clientY;

    setDragState({
      hotspotId: hotspot.id,
      startX: clientX,
      startY: clientY,
      isDragging: false
    });
  }, []);

  // Handle mouse/touch move
  const handleMouseMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!dragState) return;

    const clientX = 'touches' in event ? (event.touches[0]?.clientX || 0) : event.clientX;
    const clientY = 'touches' in event ? (event.touches[0]?.clientY || 0) : event.clientY;

    const deltaX = Math.abs(clientX - dragState.startX);
    const deltaY = Math.abs(clientY - dragState.startY);

    // Start dragging if moved more than 5 pixels
    if (!dragState.isDragging && (deltaX > 5 || deltaY > 5)) {
      setDragState(prev => prev ? { ...prev, isDragging: true } : null);
    }

    // Update hotspot position if dragging
    if (dragState.isDragging) {
      const newPosition = pixelToRelative({ x: clientX, y: clientY });
      const hotspot = hotspots.find(h => h.id === dragState.hotspotId);
      if (hotspot) {
        onHotspotDrag(dragState.hotspotId, {
          ...newPosition,
          width: hotspot.relativePosition.width,
          height: hotspot.relativePosition.height
        });
      }
    }
  }, [dragState, hotspots, onHotspotDrag, pixelToRelative]);

  // Handle mouse/touch end
  const handleMouseUp = useCallback(() => {
    if (!dragState) return;

    // If not dragging, treat as click
    if (!dragState.isDragging) {
      const hotspot = hotspots.find(h => h.id === dragState.hotspotId);
      if (hotspot) {
        onHotspotClick(hotspot);
      }
    }

    setDragState(null);
  }, [dragState, hotspots, onHotspotClick]);

  // Set up global mouse/touch events
  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: MouseEvent | TouchEvent) => handleMouseMove(e);
    const handleEnd = () => handleMouseUp();

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [dragState, handleMouseMove, handleMouseUp]);

  // Handle canvas click (for adding new hotspots)
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (dragState?.isDragging) return; // Don't add hotspot if we were dragging

    const relativePos = pixelToRelative({
      x: event.clientX,
      y: event.clientY
    });

    onCanvasClick(relativePos);
  }, [dragState, onCanvasClick, pixelToRelative]);

  // Render background
  const renderBackground = () => {
    if (!background || background.type === 'none') {
      return (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500">
          No background selected
        </div>
      );
    }

    switch (background.type) {
      case 'image':
        return (
          <img
            src={background.url}
            alt="Slide background"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        );

      case 'video':
        return (
          <video
            src={background.url}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay={background.autoplay}
            loop={background.loop}
            muted={background.muted}
            controls={false}
          />
        );

      case 'youtube':
        return (
          <iframe
            src={`https://www.youtube.com/embed/${background.youtubeId}?autoplay=${background.autoplay ? 1 : 0}&mute=1&controls=0&loop=${background.loop ? 1 : 0}`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            title="Background Video"
          />
        );

      case 'color':
        return (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: background.color || '#f0f0f0' }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`slide-canvas-container ${className}`}>
      <div
        ref={canvasRef}
        className="slide-canvas relative overflow-hidden border-2 border-gray-300 rounded-lg cursor-crosshair"
        style={{
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          margin: '0 auto'
        }}
        onClick={handleCanvasClick}
      >
        {/* Background */}
        {renderBackground()}

        {/* Overlay for development mode indicator */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {developmentMode} • {aspectRatio}
        </div>

        {/* Hotspots */}
        {hotspots.map((hotspot) => {
          const pixelPos = relativeToPixel(hotspot.relativePosition);
          const isDragging = dragState?.hotspotId === hotspot.id && dragState.isDragging;

          return (
            <div
              key={hotspot.id}
              className={`absolute cursor-pointer transition-all duration-200 ${
                isDragging ? 'z-50 scale-110' : 'hover:scale-105'
              }`}
              style={{
                left: pixelPos.x - pixelPos.width / 2,
                top: pixelPos.y - pixelPos.height / 2,
                width: pixelPos.width,
                height: pixelPos.height,
                zIndex: isDragging ? Z_INDEX.DRAG_PREVIEW : Z_INDEX.SLIDE_ELEMENTS,
              }}
              onMouseDown={(e) => handleHotspotMouseDown(hotspot, e)}
              onTouchStart={(e) => handleHotspotMouseDown(hotspot, e)}
            >
              {/* Hotspot visual */}
              <div
                className={`w-full h-full rounded-full border-2 transition-all duration-200 ${
                  isDragging
                    ? 'bg-blue-500 border-blue-600 shadow-lg'
                    : 'bg-blue-400 border-blue-500 hover:bg-blue-500'
                }`}
                style={{
                  backgroundColor: hotspot.element.style?.backgroundColor || '#3b82f6',
                  borderColor: hotspot.element.style?.borderColor || '#1e40af',
                  opacity: isDragging ? 0.8 : 1,
                }}
              >
                {/* Pulse animation if enabled */}
                {hotspot.element.style?.pulseAnimation && (
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping" />
                )}
              </div>

              {/* Hotspot label */}
              {hotspot.element.content?.title && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  {hotspot.element.content.title}
                </div>
              )}
            </div>
          );
        })}

        {/* Drag preview indicator */}
        {dragState?.isDragging && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
            Dragging hotspot...
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideCanvas;