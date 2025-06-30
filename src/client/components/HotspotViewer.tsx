import React, { useState, useCallback, useRef, useEffect } from 'react';
import { HotspotData, HotspotSize } from '../../shared/types';
import { safePercentageDelta, clamp } from '../../lib/safeMathUtils';

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
  
  // Unified pointer handler for hold-to-edit and drag - Fixed version
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isEditing) {
      // In viewing mode, single tap for focus
      onFocusRequest(hotspot.id);
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startTime = Date.now();
    const startHotspotX = hotspot.x;
    const startHotspotY = hotspot.y;
    
    setIsHolding(true);
    dragThresholdRef.current = false;

    // Start hold timer for edit (only if we haven't started dragging)
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    holdTimeoutRef.current = setTimeout(() => {
      // Only open editor if we're still holding and haven't started dragging
      if (isHolding && !dragThresholdRef.current && !isDragging && onEditRequest) {
        setIsHolding(false);
        onEditRequest(hotspot.id);
        cleanupEventHandlers();
      }
    }, isMobile ? 600 : 800); // Increased hold time to give more time for drag detection

    // Single unified move handler that handles both drag detection and dragging
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      const dragThreshold = isMobile ? 12 : 8; // Reduced threshold for more responsive drag
      
      // If moved more than threshold, start dragging
      if ((deltaX > dragThreshold || deltaY > dragThreshold) && !dragThresholdRef.current) {
        dragThresholdRef.current = true;
        
        // Clear hold timer since we're now dragging
        if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current);
          holdTimeoutRef.current = undefined;
        }
        
        // Start dragging
        if (!isDragging && onPositionChange) {
          setIsDragging(true);
          setIsHolding(false);
          // Signal drag state to prevent touch gesture conflicts - only when actually dragging
          onDragStateChange?.(true);
        }
      }
      
      // If we're in drag mode, update position
      if (dragThresholdRef.current && onPositionChange) {
        const totalDeltaX = moveEvent.clientX - startX;
        const totalDeltaY = moveEvent.clientY - startY;
        
        const referenceElement = imageElement || (e.currentTarget as HTMLElement).parentElement;
        if (!referenceElement) return;

        const referenceRect = referenceElement.getBoundingClientRect();
        
        const percentDeltaX = safePercentageDelta(totalDeltaX, referenceRect, 'x');
        const percentDeltaY = safePercentageDelta(totalDeltaY, referenceRect, 'y');
        const newX = clamp(startHotspotX + percentDeltaX, 0, 100);
        const newY = clamp(startHotspotY + percentDeltaY, 0, 100);
        
        onPositionChange(hotspot.id, newX, newY);
      }
    };

    const handlePointerUp = () => {
      // Clean up hold timer
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = undefined;
      }
      
      setIsHolding(false);
      
      // Reset drag state
      if (isDragging) {
        setIsDragging(false);
      }
      
      // Signal end of drag interaction
      onDragStateChange?.(false);

      // If it was a quick tap without drag, show info
      if (!dragThresholdRef.current && Date.now() - startTime < 300) {
        onFocusRequest(hotspot.id);
      }
      
      // Clean up event handlers
      cleanupEventHandlers();
    };

    // Helper function to clean up event handlers
    const cleanupEventHandlers = () => {
      if (pointerMoveHandlerRef.current) {
        document.removeEventListener('pointermove', pointerMoveHandlerRef.current);
        pointerMoveHandlerRef.current = null;
      }
      if (pointerUpHandlerRef.current) {
        document.removeEventListener('pointerup', pointerUpHandlerRef.current);
        pointerUpHandlerRef.current = null;
      }
    };

    // Store handlers in refs for cleanup
    pointerMoveHandlerRef.current = handlePointerMove;
    pointerUpHandlerRef.current = handlePointerUp;

    // Add event listeners
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

  }, [isEditing, isDragging, isHolding, onFocusRequest, onEditRequest, onPositionChange, hotspot, imageElement, onDragStateChange, isMobile]);
  
  useEffect(() => {
    // Cleanup function for the component unmounting
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = undefined;
      }
      // Remove document event listeners if they are still active
      if (pointerMoveHandlerRef.current) {
        document.removeEventListener('pointermove', pointerMoveHandlerRef.current);
        pointerMoveHandlerRef.current = null;
      }
      if (pointerUpHandlerRef.current) {
        document.removeEventListener('pointerup', pointerUpHandlerRef.current);
        pointerUpHandlerRef.current = null;
      }
      // Ensure drag state is reset if component unmounts during drag
      if (isDragging) {
        onDragStateChange?.(false);
      }
    };
  }, [isDragging, onDragStateChange]); // Include dependencies for proper cleanup

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
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onKeyPress={handleKeyPress}
        role="button"
        aria-label={`Hotspot: ${hotspot.title}${isEditing ? ' (hold to edit, drag to move)' : ''}`}
        aria-pressed={isHolding} // Indicate if the hotspot is currently pressed
        tabIndex={0} // Make it focusable
        data-hotspot-id={hotspot.id} // Add data-hotspot-id attribute
      >
        <span className={dotClasses} aria-hidden="true">
          {isPulsing && <span className={timelinePulseClasses} aria-hidden="true"></span>}
        </span>
        {/* Info panel rendering is now handled by InteractiveModule using InfoPanel component */}
      </div>
    </div>
  );
};

export default HotspotViewer;

// Memoized version for performance optimization
export const MemoizedHotspotViewer = React.memo(HotspotViewer);
