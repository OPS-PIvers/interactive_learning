import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { TimelineEventData } from '../../shared/types';
import { throttle } from '../utils/asyncUtils';
import { Z_INDEX } from '../constants/interactionConstants';

interface SpotlightPreviewOverlayProps {
  event: TimelineEventData;
  onUpdate: (event: TimelineEventData) => void;
  containerBounds: { width: number; height: number; left: number; top: number } | null;
}

const SpotlightPreviewOverlay: React.FC<SpotlightPreviewOverlayProps> = ({
  event,
  onUpdate,
  containerBounds
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Get current spotlight properties with defaults
  const spotlight = {
    x: event.spotlightX ?? 50,
    y: event.spotlightY ?? 50,
    width: event.spotlightWidth || 120,
    height: event.spotlightHeight || 120,
    shape: event.shape || event.highlightShape || 'circle',
    opacity: event.opacity || (event.dimPercentage ? event.dimPercentage / 100 : 0.7)
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

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerBounds || (!isDragging && !isResizing)) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    if (isDragging) {
      // Convert pixel movement to percentage
      const percentX = (deltaX / containerBounds.width) * 100;
      const percentY = (deltaY / containerBounds.height) * 100;
      
      // Account for spotlight size to prevent going outside bounds
      const spotlightWidthPercent = (spotlight.width / containerBounds.width) * 100;
      const spotlightHeightPercent = (spotlight.height / containerBounds.height) * 100;
      const maxX = Math.max(spotlightWidthPercent / 2, 100 - spotlightWidthPercent / 2);
      const maxY = Math.max(spotlightHeightPercent / 2, 100 - spotlightHeightPercent / 2);
      
      const newX = Math.max(spotlightWidthPercent / 2, Math.min(maxX, spotlight.x + percentX));
      const newY = Math.max(spotlightHeightPercent / 2, Math.min(maxY, spotlight.y + percentY));

      // Update drag start position for incremental movement
      setDragStart({ x: e.clientX, y: e.clientY });

      onUpdate({
        ...event,
        spotlightX: newX,
        spotlightY: newY
      });
    } else if (isResizing) {
      // Resize the spotlight area with container-based constraints
      const minSize = Math.min(containerBounds.width, containerBounds.height) * 0.1; // 10% of smallest dimension
      const maxSize = Math.min(containerBounds.width, containerBounds.height) * 0.8; // 80% of smallest dimension
      
      let newWidth = Math.max(minSize, Math.min(maxSize, spotlight.width + deltaX));
      let newHeight = Math.max(minSize, Math.min(maxSize, spotlight.height + deltaY));
      
      // For circles, maintain aspect ratio
      if (spotlight.shape === 'circle') {
        const avgSize = (newWidth + newHeight) / 2;
        newWidth = Math.max(minSize, Math.min(maxSize, avgSize));
        newHeight = newWidth;
      }

      // Ensure spotlight stays within container bounds
      const spotlightWidthPercent = (newWidth / containerBounds.width) * 100;
      const spotlightHeightPercent = (newHeight / containerBounds.height) * 100;
      const adjustedX = Math.max(spotlightWidthPercent / 2, Math.min(100 - spotlightWidthPercent / 2, spotlight.x));
      const adjustedY = Math.max(spotlightHeightPercent / 2, Math.min(100 - spotlightHeightPercent / 2, spotlight.y));

      // Update drag start position for incremental resizing
      setDragStart({ x: e.clientX, y: e.clientY });

      onUpdate({
        ...event,
        spotlightX: adjustedX,
        spotlightY: adjustedY,
        spotlightWidth: newWidth,
        spotlightHeight: newHeight
      });
    }
  }, [isDragging, isResizing, dragStart, spotlight, containerBounds, event, onUpdate]);

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

  if (!containerBounds) return null;

  // Calculate position in pixels with bounds validation
  const centerX = (spotlight.x / 100) * containerBounds.width;
  const centerY = (spotlight.y / 100) * containerBounds.height;
  const leftPx = Math.max(0, Math.min(
    containerBounds.width - spotlight.width, 
    centerX - spotlight.width / 2
  ));
  const topPx = Math.max(0, Math.min(
    containerBounds.height - spotlight.height, 
    centerY - spotlight.height / 2
  ));

  return (
    <>
      {/* Dimming overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `rgba(0, 0, 0, ${spotlight.opacity})`,
          zIndex: Z_INDEX.PREVIEW_OVERLAY
        }}
      />
      
      {/* Spotlight area */}
      <div
        ref={overlayRef}
        className={`absolute border-2 border-purple-500 cursor-move ${
          spotlight.shape === 'circle' ? 'rounded-full' : ''
        }`}
        style={{
          left: leftPx,
          top: topPx,
          width: spotlight.width,
          height: spotlight.height,
          backgroundColor: 'transparent',
          boxShadow: `0 0 0 2000px rgba(0, 0, 0, ${spotlight.opacity})`,
          clipPath: spotlight.shape === 'circle' 
            ? `circle(${Math.min(spotlight.width, spotlight.height) / 2}px at center)`
            : 'none',
          zIndex: Z_INDEX.PREVIEW_MODAL
        }}
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
      >
        {/* Shape indicator */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
          {spotlight.shape} • {Math.round((1 - spotlight.opacity) * 100)}% visible
        </div>
        
        {/* Center handle for dragging */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 border-2 border-white rounded-full cursor-move hover:bg-purple-400 transition-colors" />
        
        {/* Resize handles */}
        <div
          className="absolute -bottom-2 -right-2 w-4 h-4 bg-purple-500 border-2 border-white rounded cursor-se-resize hover:bg-purple-400 transition-colors"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
          title="Drag to resize spotlight"
        />
        
        {/* Additional resize handles for rectangles */}
        {spotlight.shape === 'rectangle' && (
          <>
            <div
              className="absolute top-1/2 -right-2 w-3 h-4 bg-purple-500 border-2 border-white rounded cursor-e-resize hover:bg-purple-400 transition-colors transform -translate-y-1/2"
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
            />
            <div
              className="absolute -bottom-2 left-1/2 w-4 h-3 bg-purple-500 border-2 border-white rounded cursor-s-resize hover:bg-purple-400 transition-colors transform -translate-x-1/2"
              onMouseDown={(e) => handleMouseDown(e, 'resize')}
            />
          </>
        )}
        
        {/* Corner indicators */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-500 border border-white rounded-full"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 border border-white rounded-full"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-500 border border-white rounded-full"></div>
      </div>
    </>
  );
};

export default SpotlightPreviewOverlay;