import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HotspotData, HotspotSize } from '../../shared/types';
import useScreenReaderAnnouncements from '../hooks/useScreenReaderAnnouncements';
import { triggerHapticFeedback } from '../utils/hapticUtils';

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
  /**
   * Callback triggered when a hotspot is double-tapped on a mobile device (and not in editing mode).
   * Used to initiate auto-focusing on the hotspot.
   * The parent component is responsible for implementing the focusing logic (e.g., by updating `ImageViewer`'s transform).
   * @param hotspotId - The ID of the double-tapped hotspot.
   * @param event - The pointer event associated with the double tap.
   */
  onHotspotDoubleClick?: (hotspotId: string, event: React.PointerEvent) => void;
}

/**
 * HotspotViewer Component
 *
 * Displays an individual hotspot. Handles interactions like:
 * - Dragging (in edit mode).
 * - Single tap for focus/selection (calls `onFocusRequest`).
 * - Hold-to-edit (in edit mode on mobile).
 * - Double-tap to auto-focus (on mobile, non-editing, via `onHotspotDoubleClick` prop).
 * - Haptic feedback for tap and double-tap on mobile.
 */
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
    pixelPosition, // Used for transformed container positioning
    usePixelPositioning, // Used to enable pixel-based positioning
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
  const lastTapTimeRef = useRef(0);
  const DOUBLE_TAP_THRESHOLD_MS = 300; // Standard double tap threshold
  
  // Cleanup effect for timeout
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = undefined;
      }
    };
  }, []);

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
    // console.log('Debug [HotspotViewer]: handlePointerDown called', {
    //   hotspotId: hotspot.id,
    //   isEditing,
    //   isDimmed: isDimmedInEditMode,
    //   timestamp: Date.now()
    // });

    // If not editing, pointer down just prepares for a potential tap/double-tap in pointerUp.
    // If editing, it prepares for potential drag or hold-to-edit.
    if (isEditing) {
      e.preventDefault(); // Prevent text selection, etc., only when editing.
      e.stopPropagation(); // Stop propagation only when editing to allow drag.
    } else {
      // For non-editing mode, allow event to bubble for ImageViewer gestures,
      // unless this specific interaction (double tap) is handled by this component later.
      // We will call stopPropagation in handlePointerUp if we handle the double tap.
    }

    // Find the container element (the image container)
    // Prioritize passed ref, fallback to DOM traversal
    // Only do drag setup if in editing mode
    if (!isEditing) {
       // For non-editing, pointerDown doesn't do much here.
       // The tap/double-tap logic is in pointerUp.
       // We don't want to stopPropagation here generally, as it might interfere with
       // the main ImageViewer's gestures if the tap isn't on a hotspot.
       // However, since this handler is ON the hotspot div itself, a pointerdown
       // here IS on the hotspot. We will stop propagation in pointerUp if we handle the double tap.
      return;
    }

    // Following is for isEditing = true
    const containerElement = dragContainerRef?.current || (e.currentTarget as HTMLElement).closest('.relative');
    if (!containerElement) {
      console.error("HotspotViewer: Drag container element not found. This is an unexpected state and should be investigated.");
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
    
    // Immediately notify parent that we're starting a potential drag
    if (onDragStateChange) onDragStateChange(true);

    // Set up hold-to-edit timer
    holdTimeoutRef.current = setTimeout(() => {
      if (!isDragging && onEditRequest) {
        setIsHolding(false);
        onEditRequest(hotspot.id);
        dragDataRef.current = null;
        // Reset drag state if we're going to edit instead of drag
        if (onDragStateChange) onDragStateChange(false);
      }
    }, isMobile ? 600 : 800);

    // Capture pointer for reliable drag behavior
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (error) {
      console.warn('Failed to capture pointer:', error);
    }
  }, [isEditing, hotspot.id, hotspot.x, hotspot.y, isDragging, onFocusRequest, onEditRequest, isMobile, dragContainerRef, onDragStateChange]); // Added onDragStateChange

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
      // onDragStateChange was already called in handlePointerDown
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = undefined;
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
  }, [isDragging, isEditing, hotspot.id, onPositionChange, isMobile, announceDragStart]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // console.log('Debug [HotspotViewer]: handlePointerUp called', {
    //   hotspotId: hotspot.id,
    //   isEditing,
    //   isDragging,
    //   isHolding,
    //   isDimmed: isDimmedInEditMode,
    //   timestamp: Date.now()
    // });
    
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = undefined;
    }

    // If it was just a tap (no drag), open editor in editing mode or show focus in viewing mode
    if (!isDragging && dragDataRef.current) {
      // console.log('Debug [HotspotViewer]: Hotspot clicked', {
      //   hotspotId: hotspot.id,
      //   isEditing,
      //   hasOnEditRequest: !!onEditRequest,
      //   timestamp: Date.now()
      // });
      
      const currentTime = Date.now();
      if (isMobile && !isEditing && props.onHotspotDoubleClick) {
        if (currentTime - lastTapTimeRef.current < DOUBLE_TAP_THRESHOLD_MS) {
          // This is a double tap
          props.onHotspotDoubleClick(hotspot.id, e);
          e.stopPropagation(); // Prevent image viewer's double tap
          lastTapTimeRef.current = 0; // Reset to prevent triple tap issues
          triggerHapticFeedback('heavy'); // Heavier feedback for focus
          // onFocusRequest is likely also desired here, or handled by the parent managing the focus
        } else {
          // This is a single tap
          lastTapTimeRef.current = currentTime;
          onFocusRequest(hotspot.id);
          triggerHapticFeedback('hotspotDiscovery');
        }
      } else if (isEditing && onEditRequest) {
        // Editing mode: tap calls onEditRequest
        onEditRequest(hotspot.id);
        lastTapTimeRef.current = 0; // Reset tap tracking when entering edit
      } else {
        // Non-mobile, or no double tap handler, or isEditing without onEditRequest: standard focus
        onFocusRequest(hotspot.id);
        lastTapTimeRef.current = 0; // Reset tap tracking
        if (isMobile && !isEditing) {
            triggerHapticFeedback('hotspotDiscovery');
        }
      }
    }

    // Clean up
    const wasDragging = isDragging;
    if (wasDragging) {
      announceDragStop(`hotspot ${hotspot.title}`); // Announce drag stop
    }
    
    // Always reset drag state to parent regardless of whether we were dragging
    // This ensures the parent touch handlers are re-enabled
    if (onDragStateChange) onDragStateChange(false);
    
    setIsDragging(false);
    setIsHolding(false);
    dragDataRef.current = null;

    // Release pointer capture
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (error) {
      console.warn('Failed to release pointer capture:', error);
    }
  }, [isDragging, hotspot.id, hotspot.title, onFocusRequest, onEditRequest, isEditing, onDragStateChange, announceDragStop]);

  // Style classes
  const baseColor = hotspot.color || 'bg-sky-500'; // Default to sky blue
  const hoverColor = baseColor.replace('500', '400').replace('600', '500'); // Basic hover adjustment
  const ringColor = baseColor.replace('bg-', 'ring-').replace('-500', '-400'); // For focus ring

  const sizeClasses = getSizeClasses(hotspot.size);
  
  const dotClasses = `relative inline-flex items-center justify-center rounded-full ${sizeClasses} ${baseColor}
    transition-all duration-150 ease-in-out group-hover:brightness-110 group-focus:brightness-110
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${ringColor}
    shadow-md hover:shadow-lg
    ${isContinuouslyPulsing ? 'animate-pulse-subtle' : ''}
    ${isEditing && onPositionChange ? 'cursor-move' : 'cursor-pointer'}
    ${isDragging ? 'scale-110 shadow-xl z-50 brightness-125' : ''}
    ${isHolding ? 'scale-105 animate-pulse ring-2 ring-white/50' : ''}`;

  // More pronounced pulse for timeline-driven events
  const timelinePulseClasses = isPulsing 
    ? `animate-ping absolute inline-flex h-full w-full rounded-full ${baseColor} opacity-80`
    : '';

  // Inner dot for visual flair, especially on larger hotspots or mobile
  const innerDotClasses = `absolute w-1/3 h-1/3 rounded-full bg-white/70 group-hover:bg-white/90 transition-opacity duration-150
    ${(hotspot.size === 'large' || (isMobile && hotspot.size !== 'small')) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`;


  return (
    <div
      data-hotspot-id={hotspot.id}
      className={`absolute group transform -translate-x-1/2 -translate-y-1/2 outline-none
        ${isDragging ? 'z-50' : 'z-20'}
        ${isDimmedInEditMode ? 'opacity-30 hover:opacity-90 focus-within:opacity-90 transition-opacity' : 'opacity-100'}`}
      style={{
        left: usePixelPositioning && pixelPosition ? `${pixelPosition.x}px` : `${hotspot.x}%`,
        top: usePixelPositioning && pixelPosition ? `${pixelPosition.y}px` : `${hotspot.y}%`,
        touchAction: isEditing ? 'none' : 'auto', // Allow native scrolling/gestures if not editing
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}  
      onPointerUp={handlePointerUp}
      role="button"
      aria-label={`Hotspot: ${hotspot.title}${isEditing ? ' (draggable, press and hold to edit details)' : ' (activate to view details)'}`}
      title={!isEditing && !isMobile ? hotspot.title : (isEditing ? `Drag to move ${hotspot.title}`: undefined)}
      tabIndex={0} // Make it focusable
      aria-grabbed={isEditing ? isDragging : undefined}
      aria-dropeffect={isEditing ? "move" : "none"}
    >
      <span className={dotClasses} aria-hidden="true">
        {isPulsing && <span className={timelinePulseClasses} aria-hidden="true"></span>}
        {/* Inner dot for improved visibility/style, conditional rendering based on size or if mobile */}
        <span className={innerDotClasses}></span>
      </span>
    </div>
  );
};

export default React.memo(HotspotViewer);