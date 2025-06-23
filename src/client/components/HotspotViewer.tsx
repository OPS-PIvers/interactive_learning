import React, { useState, useCallback, useRef, useMemo } from 'react'; // Added useMemo
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
  pixelPosition?: { x: number; y: number } | null;
  usePixelPositioning?: boolean;
  onEditRequest?: (id: string) => void; // Add edit callback
  isMobile?: boolean; // Prop to indicate if the viewer is in a mobile context
}

const HotspotViewer: React.FC<HotspotViewerProps> = ({
  hotspot, isPulsing, isEditing, onFocusRequest, onPositionChange, isDimmedInEditMode, isContinuouslyPulsing, imageElement, pixelPosition, usePixelPositioning, onEditRequest,
  isMobile = false // Default isMobile to false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const dragThresholdRef = useRef(false);

  // Mobile specific values
  const HOLD_TIME_DESKTOP = 600; // ms
  const HOLD_TIME_MOBILE = 400; // ms
  const DRAG_THRESHOLD_DESKTOP = 10; // px
  const DRAG_THRESHOLD_MOBILE = 15; // px

  const currentHoldTime = useMemo(() => isMobile ? HOLD_TIME_MOBILE : HOLD_TIME_DESKTOP, [isMobile]);
  const currentDragThreshold = useMemo(() => isMobile ? DRAG_THRESHOLD_MOBILE : DRAG_THRESHOLD_DESKTOP, [isMobile]);
  
  // Get size classes based on hotspot size, ensuring minimum 44px touch target on mobile for the container
  const getHotspotElementSizeClasses = (size: HotspotSize = 'medium') => {
    // These classes apply to the visual dot itself
    switch (size) {
      case 'small':
        return 'h-3 w-3 sm:h-3 sm:w-3'; // ~12px
      case 'medium':
        return 'h-4 w-4 sm:h-5 sm:w-5'; // ~16-20px
      case 'large':
        return 'h-5 w-5 sm:h-6 sm:w-6'; // ~20-24px
      default:
        return 'h-4 w-4 sm:h-5 sm:w-5';
    }
  };

  // The centeringWrapperClasses will handle the actual touch target size using padding or min-width/height
  const getTouchTargetClasses = () => {
    // Ensures the touchable area is at least 44x44px for accessibility
    // While keeping the visual dot size as defined by getHotspotElementSizeClasses
    // We can achieve this by adding padding to the centering wrapper or ensuring its min-size
    // For simplicity, let's ensure min-width and min-height on the interactive element (centering wrapper).
    // Tailwind classes like min-w-[44px] and min-h-[44px] could be used if Tailwind JIT supports arbitrary values,
    // or use inline styles. Let's use a class and define it in CSS if needed, or rely on padding.
    // A common way is to make the wrapper a square and center the dot inside.
    // e.g. `w-11 h-11` (for 44px) and then center the smaller dot.
    return isMobile ? 'min-w-[44px] min-h-[44px] flex items-center justify-center' : '';
  };

  const baseColor = hotspot.color || 'bg-sky-500';
  const hoverColor = hotspot.color ? hotspot.color.replace('500', '400').replace('600','500') : 'bg-sky-400'; // ensure hover works for darker colors too
  
  // Unified pointer handler for hold-to-edit and drag
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
    
    setIsHolding(true);
    dragThresholdRef.current = false;

    // Start hold timer for edit
    holdTimeoutRef.current = setTimeout(() => {
      if (isHolding && !dragThresholdRef.current && onEditRequest) {
        setIsHolding(false);
        onEditRequest(hotspot.id);
        return;
      }
    }, currentHoldTime); // Use dynamic hold time

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      // Use dynamic drag threshold
      if (deltaX > currentDragThreshold || deltaY > currentDragThreshold) {
        dragThresholdRef.current = true;
        if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current);
        }
        
        if (!isDragging && onPositionChange) {
          setIsDragging(true);
          setIsHolding(false);
          
          // Start drag logic
          const startHotspotX = hotspot.x;
          const startHotspotY = hotspot.y;
          
          const continueDrag = (dragEvent: PointerEvent) => {
            const totalDeltaX = dragEvent.clientX - startX;
            const totalDeltaY = dragEvent.clientY - startY;
            
            const referenceElement = imageElement || (e.currentTarget as HTMLElement).parentElement;
            if (!referenceElement) return;

            const referenceRect = referenceElement.getBoundingClientRect();
            
            const percentDeltaX = safePercentageDelta(totalDeltaX, referenceRect, 'x');
            const percentDeltaY = safePercentageDelta(totalDeltaY, referenceRect, 'y');
            const newX = clamp(startHotspotX + percentDeltaX, 0, 100);
            const newY = clamp(startHotspotY + percentDeltaY, 0, 100);
            
            onPositionChange(hotspot.id, newX, newY);
          };

          document.addEventListener('pointermove', continueDrag);
          document.addEventListener('pointerup', () => {
            setIsDragging(false);
            document.removeEventListener('pointermove', continueDrag);
          }, { once: true });
        }
      }
    };

    const handlePointerUp = () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      setIsHolding(false);
      
      // If it was a quick tap without drag, show info
      if (!dragThresholdRef.current && Date.now() - startTime < 300) {
        onFocusRequest(hotspot.id);
      }
      
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [isEditing, isDragging, isHolding, onFocusRequest, onEditRequest, onPositionChange, hotspot, imageElement, currentHoldTime, currentDragThreshold]); // Added dependencies
  
  const timelinePulseClasses = isPulsing ? `animate-ping absolute inline-flex h-full w-full rounded-full ${baseColor} opacity-75` : '';
  const continuousPulseDotClasses = isContinuouslyPulsing ? 'subtle-pulse-animation' : '';

  // Touch feedback: simple scale animation on hold/drag for now
  const touchFeedbackClasses = isHolding ? 'scale-110' : isDragging ? 'scale-125' : 'scale-100';
  const touchFeedbackAnimationStyle = isHolding || isDragging ? { transition: 'transform 0.1s ease-out' } : {};


  const hotspotElementClasses = getHotspotElementSizeClasses(hotspot.size);
  const dotClasses = `relative inline-flex rounded-full ${hotspotElementClasses} ${baseColor} group-hover:${hoverColor} transition-all duration-200 ${continuousPulseDotClasses} ${
    isEditing && onPositionChange ? 'cursor-move' : 'cursor-pointer'
  } ${isDragging ? 'hotspot-dragging shadow-lg' : ''} ${isHolding ? 'hotspot-holding animate-pulse' : ''}`; // Removed scale from here, handled by touchFeedbackClasses

  // Positioning container - uses absolute positioning only
  const positioningContainerClasses = `absolute group ${
    isDragging ? 'z-50' : 'z-20'
  }`;

  // Centering wrapper - handles the -50% translation for centering AND touch target sizing
  const centeringWrapperClasses = `transform -translate-x-1/2 -translate-y-1/2 ${getTouchTargetClasses()} ${
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
        className={`${centeringWrapperClasses} ${touchFeedbackClasses}`}
        style={touchFeedbackAnimationStyle}
        onPointerDown={handlePointerDown}
        onKeyPress={handleKeyPress}
        role="button"
        aria-label={`Hotspot: ${hotspot.title}${isEditing ? ' (hold to edit, drag to move)' : ''}`}
        tabIndex={0} // Make it focusable
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
