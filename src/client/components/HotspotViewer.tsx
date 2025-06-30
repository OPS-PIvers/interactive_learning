import React, { useState, useCallback, useRef, useEffect } from 'react';
import { HotspotData, HotspotSize } from '../../shared/types';
import { safePercentageDelta, clamp } from '../../lib/safeMathUtils';
import { useGestureCoordination } from '../hooks/useGestureCoordination';
import { useScreenReaderAnnouncements } from '../hooks/useScreenReaderAnnouncements';

interface HotspotViewerProps {
  hotspot: HotspotData;
  isPulsing: boolean; // Timeline event driven pulse
  isEditing: boolean;
  onFocusRequest: (id: string) => void; // Callback to request focus/info display for this hotspot
  onPositionChange?: (id: string, x: number, y: number) => void; // Callback for drag updates
  isDimmedInEditMode?: boolean;
  isContinuouslyPulsing?: boolean; // For idle mode gentle pulse
  imageElement?: HTMLImageElement | null; // NEW PROP for editing mode
  // NEW PROPS:
  pixelPosition?: { x: number; y: number } | null;
  usePixelPositioning?: boolean;
  onEditRequest?: (id: string) => void; // Add edit callback
  isMobile?: boolean;
  onDragStateChange?: (isDragging: boolean) => void; // Callback for drag state changes
}

const HotspotViewer: React.FC<HotspotViewerProps> = ({
  hotspot, isPulsing, isEditing, onFocusRequest, onPositionChange, isDimmedInEditMode, isContinuouslyPulsing, imageElement, pixelPosition, usePixelPositioning, onEditRequest, isMobile, onDragStateChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  const dragThresholdRef = useRef(false);
  const pointerMoveHandlerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const pointerUpHandlerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const dragStartDataRef = useRef<{
    startX: number;
    startY: number;
    startHotspotX: number;
    startHotspotY: number;
    startTime: number;
  } | null>(null);
  
  // Use refs for state values to prevent callback recreation
  const isDraggingRef = useRef(isDragging);
  const isHoldingRef = useRef(isHolding);
  
  // Update refs when state changes
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);
  
  useEffect(() => {
    isHoldingRef.current = isHolding;
  }, [isHolding]);
  
  // Add gesture coordination
  const gestureCoordination = useGestureCoordination();
  
  // Add screen reader announcements
  const { announceDragState, announceDragPosition, announceFocus, announceEditMode } = useScreenReaderAnnouncements();
  
  // Get size classes based on hotspot size
  const getSizeClasses = (size: HotspotSize = 'medium') => {
    if (isMobile) {
      switch (size) {
        case 'small':
          return 'h-11 w-11'; // 44px
        case 'medium':
          return 'h-12 w-12'; // 48px
        case 'large':
          return 'h-14 w-14'; // 56px
        default:
          return 'h-12 w-12'; // Default mobile size
      }
    } else {
      // Desktop sizes
      switch (size) {
        case 'small':
          return 'h-3 w-3'; // 12px
        case 'medium':
          return 'h-5 w-5'; // 20px
        case 'large':
          return 'h-6 w-6'; // 24px
        default:
          return 'h-5 w-5'; // Default desktop size
      }
    }
  };
  
  const baseColor = hotspot.color || 'bg-sky-500';
  const hoverColor = hotspot.color ? hotspot.color.replace('500', '400').replace('600','500') : 'bg-sky-400'; // ensure hover works for darker colors too
  
  // Helper function to clean up event handlers
  const cleanupEventHandlers = useCallback(() => {
    console.log('🧹 [HotspotViewer] CLEANING UP event listeners', {
      hotspotId: hotspot.id,
      hadMoveHandler: !!pointerMoveHandlerRef.current,
      hadUpHandler: !!pointerUpHandlerRef.current,
      timestamp: Date.now()
    });
    
    if (pointerMoveHandlerRef.current) {
      document.removeEventListener('pointermove', pointerMoveHandlerRef.current);
      pointerMoveHandlerRef.current = null;
    }
    if (pointerUpHandlerRef.current) {
      document.removeEventListener('pointerup', pointerUpHandlerRef.current);
      pointerUpHandlerRef.current = null;
    }
  }, [hotspot.id]);
  
  // Optimized pointer handler with proper cleanup and debug logging
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    console.log('🎯 [HotspotViewer] Pointer down STARTED', {
      hotspotId: hotspot.id,
      isEditing,
      currentPosition: { x: hotspot.x, y: hotspot.y },
      pointerType: e.pointerType,
      isPrimary: e.isPrimary,
      timestamp: Date.now()
    });

    if (!isEditing) {
      // In viewing mode, single tap for focus
      onFocusRequest(hotspot.id);
      // Announce focus to screen readers
      announceFocus(hotspot.title);
      return;
    }

    // Try to claim drag gesture before proceeding
    console.log('🤝 [HotspotViewer] Attempting to claim drag gesture...');
    if (!gestureCoordination.claimGesture('drag')) {
      console.log('❌ [HotspotViewer]: Drag gesture BLOCKED by coordination system');
      return;
    }
    console.log('✅ [HotspotViewer] Drag gesture CLAIMED successfully');

    e.preventDefault();
    e.stopPropagation();
    
    // Capture drag start data
    const startData = {
      startX: e.clientX,
      startY: e.clientY,
      startHotspotX: hotspot.x,
      startHotspotY: hotspot.y,
      startTime: Date.now()
    };
    dragStartDataRef.current = startData;
    
    setIsHolding(true);
    dragThresholdRef.current = false;

    // Clean up any existing event handlers first
    cleanupEventHandlers();

    // Start hold timer for edit (only if we haven't started dragging)
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    holdTimeoutRef.current = setTimeout(() => {
      console.log('Debug [HotspotViewer]: Hold timer fired', {
        hotspotId: hotspot.id,
        isHolding,
        dragThreshold: dragThresholdRef.current,
        isDragging
      });
      
      // Only open editor if we're still holding and haven't started dragging
      if (isHoldingRef.current && !dragThresholdRef.current && !isDraggingRef.current && onEditRequest) {
        setIsHolding(false);
        onEditRequest(hotspot.id);
        cleanupEventHandlers();
      }
    }, isMobile ? 600 : 800);

    // Create move handler that captures startData values
    const handlePointerMove = (moveEvent: PointerEvent) => {
      console.log('👆 [HotspotViewer] Pointer MOVE detected', {
        hotspotId: hotspot.id,
        clientX: moveEvent.clientX,
        clientY: moveEvent.clientY,
        hasStartData: !!dragStartDataRef.current
      });
      
      if (!dragStartDataRef.current) return;
      
      const { startX, startY, startHotspotX, startHotspotY } = dragStartDataRef.current;
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      const dragThreshold = isMobile ? 12 : 8;
      
      console.log('📏 [HotspotViewer] Movement measurement', {
        hotspotId: hotspot.id,
        deltaX,
        deltaY,
        threshold: dragThreshold,
        willTriggerDrag: (deltaX > dragThreshold || deltaY > dragThreshold) && !dragThresholdRef.current
      });
      
      // If moved more than threshold, start dragging
      if ((deltaX > dragThreshold || deltaY > dragThreshold) && !dragThresholdRef.current) {
        console.log('🏃 [HotspotViewer]: Drag threshold REACHED - Starting drag', {
          hotspotId: hotspot.id,
          deltaX,
          deltaY,
          threshold: dragThreshold,
          exceeded: { x: deltaX > dragThreshold, y: deltaY > dragThreshold }
        });
        
        dragThresholdRef.current = true;
        
        // Clear hold timer since we're now dragging
        if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current);
          holdTimeoutRef.current = undefined;
        }
        
        // Start dragging
        if (!isDraggingRef.current && onPositionChange) {
          setIsDragging(true);
          setIsHolding(false);
          // Signal drag state to prevent touch gesture conflicts
          onDragStateChange?.(true);
          // Announce drag start to screen readers
          announceDragState(hotspot.title, true);
        }
      }
      
      // If we're in drag mode, update position
      if (dragThresholdRef.current && onPositionChange) {
        const totalDeltaX = moveEvent.clientX - startX;
        const totalDeltaY = moveEvent.clientY - startY;
        
        // Get reference element for coordinate calculation
        const referenceElement = imageElement || (e.currentTarget as HTMLElement).closest('.relative');
        if (!referenceElement) {
          console.error('Debug [HotspotViewer]: No reference element found for drag calculation');
          return;
        }

        const referenceRect = referenceElement.getBoundingClientRect();
        
        // Calculate percentage deltas
        const percentDeltaX = safePercentageDelta(totalDeltaX, referenceRect, 'x');
        const percentDeltaY = safePercentageDelta(totalDeltaY, referenceRect, 'y');
        const newX = clamp(startHotspotX + percentDeltaX, 0, 100);
        const newY = clamp(startHotspotY + percentDeltaY, 0, 100);
        
        console.log('📍 [HotspotViewer]: Position UPDATE', {
          hotspotId: hotspot.id,
          oldPosition: { x: startHotspotX, y: startHotspotY },
          newPosition: { x: newX, y: newY },
          deltas: { x: percentDeltaX, y: percentDeltaY },
          pixelDeltas: { x: totalDeltaX, y: totalDeltaY },
          containerSize: { width: referenceRect.width, height: referenceRect.height }
        });
        
        onPositionChange(hotspot.id, newX, newY);
        
        // Announce position change to screen readers (throttled)
        if (Date.now() - (dragStartDataRef.current?.startTime || 0) > 500) {
          announceDragPosition(hotspot.title, newX, newY);
        }
      }
    };

    const handlePointerUp = () => {
      console.log('Debug [HotspotViewer]: Pointer up', {
        hotspotId: hotspot.id,
        wasDragging: isDragging,
        dragThreshold: dragThresholdRef.current
      });
      
      // Clean up hold timer
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = undefined;
      }
      
      setIsHolding(false);
      
      // Reset drag state
      if (isDragging) {
        setIsDragging(false);
        // Announce drag end to screen readers
        announceDragState(hotspot.title, false);
      }
      
      // Signal end of drag interaction
      onDragStateChange?.(false);
      
      // Release drag gesture
      gestureCoordination.releaseGesture('drag');

      // If it was a quick tap without drag, show info
      if (!dragThresholdRef.current && dragStartDataRef.current && 
          Date.now() - dragStartDataRef.current.startTime < 300) {
        onFocusRequest(hotspot.id);
        // Announce focus to screen readers
        announceFocus(hotspot.title);
      }
      
      // Clean up
      dragStartDataRef.current = null;
      cleanupEventHandlers();
    };


    // Store handlers in refs for cleanup
    pointerMoveHandlerRef.current = handlePointerMove;
    pointerUpHandlerRef.current = handlePointerUp;

    // Add event listeners
    console.log('🎧 [HotspotViewer] Adding document event listeners', {
      hotspotId: hotspot.id,
      timestamp: Date.now()
    });
    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp, { passive: false });

  }, [isEditing, onPositionChange, hotspot.id, imageElement, onDragStateChange, isMobile]);
  

  useEffect(() => {
    // Cleanup function for the component unmounting
    return () => {
      console.log('Debug [HotspotViewer]: Component unmounting, cleaning up', {
        hotspotId: hotspot.id,
        isDragging
      });
      
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = undefined;
      }
      
      // Clean up event handlers
      cleanupEventHandlers();
      
      // Reset drag start data
      dragStartDataRef.current = null;
      
      // Ensure drag state is reset if component unmounts during drag
      if (isDragging) {
        onDragStateChange?.(false);
        gestureCoordination.releaseGesture('drag');
      }
    };
  }, [isDragging, onDragStateChange, hotspot.id, cleanupEventHandlers, gestureCoordination, announceDragState]);

  const timelinePulseClasses = isPulsing ? `animate-ping absolute inline-flex h-full w-full rounded-full ${baseColor} opacity-75` : '';
  const continuousPulseDotClasses = isContinuouslyPulsing ? 'subtle-pulse-animation' : '';

  const sizeClasses = getSizeClasses(hotspot.size);
  const dotClasses = `relative inline-flex rounded-full ${sizeClasses} ${baseColor} group-hover:${hoverColor} transition-all duration-200 ${continuousPulseDotClasses} ${
    isEditing && onPositionChange ? 'cursor-move' : 'cursor-pointer'
  } ${isDragging ? 'hotspot-dragging scale-115 shadow-lg' : ''} ${isHolding ? 'hotspot-holding scale-110 animate-pulse' : ''}`;

  // Positioning container - uses absolute positioning only
  const positioningContainerClasses = `absolute group ${
    isDragging ? 'z-50' : 'z-20'
  }`;

  // Centering wrapper - handles the -50% translation for centering
  const centeringWrapperClasses = `transform -translate-x-1/2 -translate-y-1/2 ${
    isDimmedInEditMode ? 'opacity-40 hover:opacity-100 focus-within:opacity-100 transition-opacity' : ''
  }`;
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onFocusRequest(hotspot.id);
    }
  };

  return (
    <div
      className={positioningContainerClasses}
      style={{
        left: usePixelPositioning && pixelPosition
          ? `${pixelPosition.x}px`
          : `${hotspot.x}%`,
        top: usePixelPositioning && pixelPosition
          ? `${pixelPosition.y}px`
          : `${hotspot.y}%`,
      }}
    >
      <div
        className={centeringWrapperClasses}
        onPointerDown={handlePointerDown}
        onKeyPress={handleKeyPress}
        role="button"
        aria-label={`Hotspot: ${hotspot.title}${isEditing ? ' (hold to edit, drag to move)' : ''}`}
        aria-pressed={isHolding} // Indicate if the hotspot is currently pressed
        aria-grabbed={isDragging} // Indicate if the hotspot is being dragged
        aria-dropeffect={isEditing && onPositionChange ? "move" : "none"} // Indicate drop effect when draggable
        tabIndex={0} // Make it focusable
        data-hotspot-id={hotspot.id} // Add data-hotspot-id attribute
        style={{
          // Add CSS touch-action to prevent browser gesture handling
          touchAction: isEditing && onPositionChange ? 'none' : 'auto',
        }}
      >
        <span className={dotClasses} aria-hidden="true">
          {isPulsing && <span className={timelinePulseClasses} aria-hidden="true"></span>}
        </span>
        {/* Info panel rendering is now handled by InteractiveModule using InfoPanel component */}
      </div>
    </div>
  );
};

// Memoized version for performance optimization with custom comparison
const MemoizedHotspotViewer = React.memo(HotspotViewer, (prevProps, nextProps) => {
  // During drag operations, only re-render if the specific hotspot being dragged has changed position
  // or if critical props like isEditing have changed
  
  // Always re-render if these critical props change
  if (
    prevProps.isEditing !== nextProps.isEditing ||
    prevProps.isPulsing !== nextProps.isPulsing ||
    prevProps.isContinuouslyPulsing !== nextProps.isContinuouslyPulsing ||
    prevProps.isDimmedInEditMode !== nextProps.isDimmedInEditMode ||
    prevProps.hotspot.id !== nextProps.hotspot.id ||
    prevProps.hotspot.title !== nextProps.hotspot.title ||
    prevProps.hotspot.color !== nextProps.hotspot.color ||
    prevProps.hotspot.size !== nextProps.hotspot.size
  ) {
    return false; // Re-render
  }
  
  // For position changes, only re-render if position actually changed significantly
  const positionThreshold = 0.1; // 0.1%
  const xChanged = Math.abs(prevProps.hotspot.x - nextProps.hotspot.x) > positionThreshold;
  const yChanged = Math.abs(prevProps.hotspot.y - nextProps.hotspot.y) > positionThreshold;
  
  if (xChanged || yChanged) {
    return false; // Re-render
  }
  
  // Props are effectively the same, skip re-render
  return true;
});

export default MemoizedHotspotViewer;
export { MemoizedHotspotViewer };
