import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HotspotData, HotspotSize } from '../../shared/types';
import { getHotspotSizeClasses, defaultHotspotSize } from '../../shared/hotspotStylePresets';
import useScreenReaderAnnouncements from '../hooks/useScreenReaderAnnouncements';
import { triggerHapticFeedback } from '../utils/hapticUtils';
import { getActualImageVisibleBoundsRelative, getCachedBoundingClientRect } from '../utils/imageBounds';

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
  isActive?: boolean; // New prop to indicate if the hotspot is active
  isVisible?: boolean; // Controls visibility without affecting hook execution
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
    dragContainerRef,
    isActive,
    isVisible = true
  } = props;

  const { announceDragStart, announceDragStop } = useScreenReaderAnnouncements();
  const [isDragging, setIsDragging] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const dragDataRef = useRef<{
    startX: number; // Viewport X of pointer down
    startY: number; // Viewport Y of pointer down
    initialHotspotLeft_inContainer: number; // Hotspot div's initial 'left' relative to container
    initialHotspotTop_inContainer: number;  // Hotspot div's initial 'top' relative to container
    startHotspotX_percentage: number; // Original hotspot.x percentage (fallback)
    startHotspotY_percentage: number; // Original hotspot.y percentage (fallback)
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

  // Size classes for the hotspot using shared utility
  const getSizeClasses = (size: HotspotSize = defaultHotspotSize) => {
    return getHotspotSizeClasses(size, !!isMobile);
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
    const currentPixelPos = props.pixelPosition; // This is the top-left of the hotspot div
    
    // Calculate fallback pixel position if pixelPosition is not available
    let initialHotspotLeft_inContainer = 0;
    let initialHotspotTop_inContainer = 0;
    
    if (currentPixelPos) {
      // Use provided pixel position
      initialHotspotLeft_inContainer = currentPixelPos.x;
      initialHotspotTop_inContainer = currentPixelPos.y;
    } else {
      // Calculate pixel position from percentage coordinates using container-relative bounds
      const visibleImageBounds = getActualImageVisibleBoundsRelative(props.imageElement || null, containerElement as HTMLElement);
      
      if (visibleImageBounds && visibleImageBounds.width > 0 && visibleImageBounds.height > 0) {
        // Calculate hotspot position relative to the visible image bounds (same as pan/zoom)
        const hotspotX_relativeToImage = (hotspot.x / 100) * visibleImageBounds.width;
        const hotspotY_relativeToImage = (hotspot.y / 100) * visibleImageBounds.height;
        
        // Add the image's offset within the container (container-relative coordinates)
        initialHotspotLeft_inContainer = visibleImageBounds.x + hotspotX_relativeToImage;
        initialHotspotTop_inContainer = visibleImageBounds.y + hotspotY_relativeToImage;
      } else {
        // Final fallback: use container bounds directly (less accurate but prevents jump to 0,0)
        const containerRect = containerElement.getBoundingClientRect();
        if (containerRect.width > 0 && containerRect.height > 0) {
          initialHotspotLeft_inContainer = (hotspot.x / 100) * containerRect.width;
          initialHotspotTop_inContainer = (hotspot.y / 100) * containerRect.height;
        }
      }
    }

    dragDataRef.current = {
      startX: e.clientX, // Viewport X of pointer down
      startY: e.clientY, // Viewport Y of pointer down
      initialHotspotLeft_inContainer,
      initialHotspotTop_inContainer,
      startHotspotX_percentage: hotspot.x, // Store original percentages as fallback/reference
      startHotspotY_percentage: hotspot.y,
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

    const {
      startX: pointerDownViewX,
      startY: pointerDownViewY,
      initialHotspotLeft_inContainer,
      initialHotspotTop_inContainer,
      containerElement
    } = dragDataRef.current;

    // Calculate overall delta in viewport coordinates
    const deltaX_viewport = e.clientX - pointerDownViewX;
    const deltaY_viewport = e.clientY - pointerDownViewY;

    // Start dragging if we've moved beyond threshold (only if not already dragging)
    if (!isDragging) {
      const threshold = isMobile ? 10 : 5; // Adjusted threshold
      if (Math.abs(deltaX_viewport) > threshold || Math.abs(deltaY_viewport) > threshold) {
        setIsDragging(true);
        setIsHolding(false); // No longer just holding
        announceDragStart();
        if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current);
          holdTimeoutRef.current = undefined;
        }
      } else {
        return; // Not enough movement to start a drag
      }
    }

    // If actively dragging and containerElement exists
    if (isDragging && containerElement) {
      // Get the actual visible image bounds relative to the drag container (zoomedImageContainerRef)
      const visibleImageBounds = getActualImageVisibleBoundsRelative(props.imageElement || null, containerElement as HTMLElement);

      if (!visibleImageBounds || visibleImageBounds.width === 0 || visibleImageBounds.height === 0) {
        // Fallback or error handling if bounds are not valid
        // console.warn("Cannot calculate new hotspot position: visibleImageBounds are invalid.");
        // As a fallback, use the old logic (though it has issues)
        const containerRect = getCachedBoundingClientRect(containerElement);
        if (containerRect.width === 0 || containerRect.height === 0) return; // Avoid division by zero

        const percentDeltaX = (deltaX_viewport / containerRect.width) * 100;
        const percentDeltaY = (deltaY_viewport / containerRect.height) * 100;

        const fallbackX = Math.max(0, Math.min(100, dragDataRef.current.startHotspotX_percentage + percentDeltaX));
        const fallbackY = Math.max(0, Math.min(100, dragDataRef.current.startHotspotY_percentage + percentDeltaY));
        onPositionChange(hotspot.id, fallbackX, fallbackY);
        return;
      }

      // New intended top-left position of the hotspot div, relative to the drag container
      const newHotspotDivLeft_inContainer = initialHotspotLeft_inContainer + deltaX_viewport;
      const newHotspotDivTop_inContainer = initialHotspotTop_inContainer + deltaY_viewport;

      // The hotspot's visual center is effectively its top-left (due to -translate-x/y-1/2)
      // Convert this new top-left position (which is the center) to be relative to the visible image's top-left
      const newHotspotCenterX_relativeToVisibleImage = newHotspotDivLeft_inContainer - visibleImageBounds.x;
      const newHotspotCenterY_relativeToVisibleImage = newHotspotDivTop_inContainer - visibleImageBounds.y;

      // Calculate the new percentage based on the visible image dimensions
      let newXPercent = (newHotspotCenterX_relativeToVisibleImage / visibleImageBounds.width) * 100;
      let newYPercent = (newHotspotCenterY_relativeToVisibleImage / visibleImageBounds.height) * 100;

      // Clamp the percentages to be within the visible image (0-100%)
      // The problem description mentioned "quarter from the bottom", so 0-100 is the target.
      newXPercent = Math.max(0, Math.min(100, newXPercent));
      newYPercent = Math.max(0, Math.min(100, newYPercent));
      
      onPositionChange(hotspot.id, newXPercent, newYPercent);
    }
  }, [isDragging, isEditing, hotspot.id, onPositionChange, isMobile, announceDragStart, props.imageElement, props.pixelPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = undefined;
    }

    // If it was just a tap (no drag), open editor in editing mode or show focus in viewing mode
    if (!isDragging && dragDataRef.current) {
      if (isEditing && onEditRequest) {
        onEditRequest(hotspot.id);
        e.stopPropagation();
      } else {
        // Handle non-editing taps (including double tap)
        const currentTime = Date.now();
        if (isMobile && !isEditing && props.onHotspotDoubleClick && (currentTime - lastTapTimeRef.current < DOUBLE_TAP_THRESHOLD_MS)) {
          props.onHotspotDoubleClick(hotspot.id, e);
          e.stopPropagation();
          lastTapTimeRef.current = 0;
          triggerHapticFeedback('heavy');
        } else {
          onFocusRequest(hotspot.id);
          lastTapTimeRef.current = currentTime;
          if (isMobile && !isEditing) {
            triggerHapticFeedback('hotspotDiscovery');
          }
        }
      }
    }

    // Clean up drag state
    if (isDragging) {
      announceDragStop(`hotspot ${hotspot.title}`);
    }
    if (onDragStateChange) {
      onDragStateChange(false);
    }
    setIsDragging(false);
    setIsHolding(false);
    dragDataRef.current = null;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (error) {
      // Ignore errors, pointer might not be captured.
    }
  }, [isDragging, hotspot.id, hotspot.title, onFocusRequest, onEditRequest, isEditing, onDragStateChange, announceDragStop, isMobile, props.onHotspotDoubleClick]);

  // Style classes - with enhanced color support for slide-based and legacy systems
  const getHotspotColor = () => {
    // Priority order: customProperties (from slide element) -> hotspot.backgroundColor -> hotspot.color -> default
    const customColor = (hotspot as any).customProperties?.backgroundColor || (hotspot as any).customProperties?.color;
    return customColor || hotspot.backgroundColor || hotspot.color || 'bg-sky-500';
  };
  
  const baseColor = getHotspotColor();
  const hoverColor = baseColor.replace('500', '400').replace('600', '500'); // Basic hover adjustment
  const ringColor = baseColor.replace('bg-', 'ring-').replace('-500', '-400'); // For focus ring

  // Get hotspot size from multiple sources (priority: customProperties -> hotspot.size -> default)
  const getHotspotSize = () => {
    const customSize = (hotspot as any).customProperties?.size;
    return customSize || hotspot.size || defaultHotspotSize;
  };
  
  const sizeClasses = getSizeClasses(getHotspotSize());
  
  const [isTimedPulseActive, setIsTimedPulseActive] = useState(false);

  useEffect(() => {
    if (hotspot.pulseAnimation && hotspot.pulseType === 'timed' && hotspot.pulseDuration) {
      setIsTimedPulseActive(true);
      const timer = setTimeout(() => {
        setIsTimedPulseActive(false);
      }, hotspot.pulseDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [hotspot.pulseAnimation, hotspot.pulseType, hotspot.pulseDuration]);

  const shouldPulse = isContinuouslyPulsing || (hotspot.pulseAnimation && hotspot.pulseType === 'loop') || isTimedPulseActive;

  // Get custom styling for hotspot
  const getCustomStyles = () => {
    const styles: React.CSSProperties = {};
    
    // Apply opacity from multiple sources (priority: customProperties -> hotspot.opacity)
    const customOpacity = (hotspot as any).customProperties?.opacity;
    const opacity = customOpacity !== undefined ? customOpacity : hotspot.opacity;
    
    if (opacity !== undefined) {
      styles.opacity = opacity;
    }
    
    return styles;
  };

  const dotClasses = `relative inline-flex items-center justify-center rounded-full ${sizeClasses} ${baseColor}
    transition-all duration-150 ease-in-out group-hover:brightness-110 group-focus:brightness-110
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${ringColor}
    shadow-md hover:shadow-lg
    ${shouldPulse ? 'animate-pulse-subtle' : ''}
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
        transform: `translate(-50%, -50%) scale(${isActive ? 1.2 : 1})`,
        touchAction: isEditing ? 'none' : 'auto', // Allow native scrolling/gestures if not editing
        display: isVisible ? 'block' : 'none', // Control visibility without affecting hook execution
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}  
      onPointerUp={handlePointerUp}
      onClick={isEditing ? (e) => {
        console.log('Debug [HotspotViewer]: onClick called, stopping propagation');
        e.stopPropagation();
      } : undefined}
      role="button"
      aria-label={`Hotspot: ${hotspot.title}${isEditing ? ' (draggable, press and hold to edit details)' : ' (activate to view details)'}`}
      title={!isEditing && !isMobile ? hotspot.title : (isEditing ? `Drag to move ${hotspot.title}`: undefined)}
      tabIndex={0} // Make it focusable
      aria-grabbed={isEditing ? isDragging : undefined}
      aria-dropeffect={isEditing ? "move" : "none"}
    >
      <span className={dotClasses} style={getCustomStyles()} aria-hidden="true">
        {isPulsing && <span className={timelinePulseClasses} aria-hidden="true"></span>}
        {/* Inner dot for improved visibility/style, conditional rendering based on size or if mobile */}
        <span className={innerDotClasses}></span>
      </span>
    </div>
  );
};

export default React.memo(HotspotViewer);