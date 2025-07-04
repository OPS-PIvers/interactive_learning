import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HotspotData, HotspotSize } from '../../shared/types';
import useScreenReaderAnnouncements from '../hooks/useScreenReaderAnnouncements';

interface HotspotViewerProps {
  hotspot: HotspotData;
  isPulsing: boolean;
  isEditing: boolean;
  onFocusRequest: (id: string) => void;
  onPositionChange?: (id: string, x: number, y: number) => void;
  isDimmedInEditMode?: boolean;
  isContinuouslyPulsing?: boolean;
  onEditRequest?: (id: string) => void;
  isMobile?: boolean;
  pixelPosition?: { x: number; y: number; baseX?: number; baseY?: number; } | null;
  usePixelPositioning?: boolean;
  imageElement?: HTMLImageElement | null;
  onDragStateChange?: (isDragging: boolean) => void; // Modified to accept boolean
  dragContainerRef?: React.RefObject<HTMLElement>; // Added new prop
}

const HotspotViewer: React.FC<HotspotViewerProps> = (props) => {
  const {
    hotspot,
    isPulsing,
    isEditing,
    onFocusRequest,
    onPositionChange,
    isDimmedInEditMode,
    isContinuouslyPulsing,
    onEditRequest,
    isMobile,
    // pixelPosition, // Not directly used in this component's logic after recent changes
    // usePixelPositioning, // Not directly used
    // imageElement, // Not directly used
    onDragStateChange,
    dragContainerRef
  } = props;

  const { announceDragStart, announceDragStop } = useScreenReaderAnnouncements();
  const [isDragging, setIsDragging] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const dragDataRef = useRef<{
    startX: number;
    startY: number;
    startHotspotX: number;
    startHotspotY: number;
    containerElement: Element | null;
  } | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Size classes for the hotspot
  const getSizeClasses = (size: HotspotSize = 'medium') => {
    if (isMobile) {
      switch (size) {
        case 'small': return 'h-11 w-11';
        case 'medium': return 'h-12 w-12';
        case 'large': return 'h-14 w-14';
        default: return 'h-12 w-12';
      }
    } else {
      switch (size) {
        case 'small': return 'h-3 w-3';
        case 'medium': return 'h-5 w-5';
        case 'large': return 'h-6 w-6';
        default: return 'h-5 w-5';
      }
    }
  };

  // Simple drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    console.log('Debug [HotspotViewer]: handlePointerDown called', {
      hotspotId: hotspot.id,
      isEditing,
      isDimmed: isDimmedInEditMode,
      timestamp: Date.now()
    });
    
    if (!isEditing) {
      onFocusRequest(hotspot.id);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Find the container element (the image container)
    // Prioritize passed ref, fallback to DOM traversal
    const containerElement = dragContainerRef?.current || (e.currentTarget as HTMLElement).closest('.relative');
    if (!containerElement) {
      console.error("HotspotViewer: Drag container element not found.");
      return;
    }

    // Store drag start data
    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startHotspotX: hotspot.x,
      startHotspotY: hotspot.y,
      containerElement
    };

    setIsHolding(true);

    // Set up hold-to-edit timer
    holdTimeoutRef.current = setTimeout(() => {
      if (!isDragging && onEditRequest) {
        setIsHolding(false);
        onEditRequest(hotspot.id);
        dragDataRef.current = null;
      }
    }, isMobile ? 600 : 800);

    // Capture pointer for reliable drag behavior
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isEditing, hotspot.id, hotspot.x, hotspot.y, isDragging, onFocusRequest, onEditRequest, isMobile, dragContainerRef]); // Added dragContainerRef

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragDataRef.current || !isEditing || !onPositionChange) return;

    const { startX, startY, startHotspotX, startHotspotY, containerElement } = dragDataRef.current;
    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);
    const threshold = isMobile ? 12 : 8;

    // Start dragging if we've moved beyond threshold
    if (!isDragging && (deltaX > threshold || deltaY > threshold)) {
      setIsDragging(true);
      setIsHolding(false);
      announceDragStart(); // Announce drag start
      if (onDragStateChange) onDragStateChange(true); // Notify parent about drag start
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
    }

    // Update position during drag
    if (isDragging && containerElement) {
      const containerRect = containerElement.getBoundingClientRect();
      const totalDeltaX = e.clientX - startX;
      const totalDeltaY = e.clientY - startY;
      
      // Convert pixel deltas to percentage
      const percentDeltaX = (totalDeltaX / containerRect.width) * 100;
      const percentDeltaY = (totalDeltaY / containerRect.height) * 100;
      
      // Calculate new position with bounds checking
      const newX = Math.max(2, Math.min(98, startHotspotX + percentDeltaX));
      const newY = Math.max(2, Math.min(98, startHotspotY + percentDeltaY));
      
      onPositionChange(hotspot.id, newX, newY);
    }
  }, [isDragging, isEditing, hotspot.id, onPositionChange, isMobile]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    console.log('Debug [HotspotViewer]: handlePointerUp called', {
      hotspotId: hotspot.id,
      isEditing,
      isDragging,
      isHolding,
      isDimmed: isDimmedInEditMode,
      timestamp: Date.now()
    });
    
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }

    // If it was just a tap (no drag), open editor in editing mode or show focus in viewing mode
    if (!isDragging && dragDataRef.current) {
      console.log('Debug [HotspotViewer]: Hotspot clicked', {
        hotspotId: hotspot.id,
        isEditing,
        hasOnEditRequest: !!onEditRequest,
        timestamp: Date.now()
      });
      
      if (isEditing && onEditRequest) {
        console.log('Debug [HotspotViewer]: Calling onEditRequest for hotspot', hotspot.id);
        onEditRequest(hotspot.id);
      } else {
        console.log('Debug [HotspotViewer]: Calling onFocusRequest for hotspot', hotspot.id);
        onFocusRequest(hotspot.id);
      }
    }

    // Clean up
    if (isDragging) {
      announceDragStop(`hotspot ${hotspot.title}`); // Announce drag stop
      if (onDragStateChange) onDragStateChange(false); // Notify parent about drag end
    }
    setIsDragging(false);
    setIsHolding(false);
    dragDataRef.current = null;

    // Release pointer capture
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, [isDragging, hotspot.id, hotspot.title, onFocusRequest, onEditRequest, isEditing, onDragStateChange, announceDragStart, announceDragStop]);

  // Style classes
  const baseColor = hotspot.color || 'bg-sky-500';
  const hoverColor = baseColor.replace('500', '400').replace('600', '500');
  const sizeClasses = getSizeClasses(hotspot.size);
  
  const dotClasses = `relative inline-flex rounded-full ${sizeClasses} ${baseColor} hover:${hoverColor} transition-all duration-200 ${
    isContinuouslyPulsing ? 'animate-pulse' : ''
  } ${
    isEditing && onPositionChange ? 'cursor-move' : 'cursor-pointer'
  } ${
    isDragging ? 'scale-110 shadow-lg z-50' : ''
  } ${
    isHolding ? 'scale-105 animate-pulse' : ''
  }`;

  const timelinePulseClasses = isPulsing 
    ? `animate-ping absolute inline-flex h-full w-full rounded-full ${baseColor} opacity-75` 
    : '';

  return (
    <div
      className={`absolute group transform -translate-x-1/2 -translate-y-1/2 ${
        isDragging ? 'z-50' : 'z-20'
      } ${
        isDimmedInEditMode ? 'opacity-40 hover:opacity-100 transition-opacity' : ''
      }`}
      style={{
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        touchAction: isEditing ? 'none' : 'auto'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}  
      onPointerUp={handlePointerUp}
      role="button"
      aria-label={`Hotspot: ${hotspot.title}${isEditing ? ' (drag to move, hold to edit)' : ''}`}
      tabIndex={0}
      aria-pressed={isHolding}
      aria-grabbed={isDragging}
      aria-dropeffect={isEditing ? "move" : "none"}
    >
      <span className={dotClasses} aria-hidden="true">
        {isPulsing && <span className={timelinePulseClasses} aria-hidden="true"></span>}
      </span>
    </div>
  );
};

export default React.memo(HotspotViewer);