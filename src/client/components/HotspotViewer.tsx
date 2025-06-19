import React, { useState, useCallback, useRef } from 'react';
import { HotspotData, HotspotSize } from '../../shared/types';

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
}

const HotspotViewer: React.FC<HotspotViewerProps> = ({ 
  hotspot, isPulsing, isEditing, onFocusRequest, onPositionChange, isDimmedInEditMode, isContinuouslyPulsing, imageElement, pixelPosition, usePixelPositioning, onEditRequest
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const dragThresholdRef = useRef(false);
  
  // Get size classes based on hotspot size
  const getSizeClasses = (size: HotspotSize = 'medium') => {
    switch (size) {
      case 'small':
        return 'h-3 w-3 sm:h-3 sm:w-3';
      case 'medium':
        return 'h-4 w-4 sm:h-5 sm:w-5';
      case 'large':
        return 'h-5 w-5 sm:h-6 sm:w-6';
      default:
        return 'h-4 w-4 sm:h-5 sm:w-5';
    }
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
    }, 600); // 600ms hold time

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      // If moved more than 10px, it's a drag
      if (deltaX > 10 || deltaY > 10) {
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

            // Get the actual image bounds for accurate conversion
            const imageBounds = imageElement?.getBoundingClientRect();
            if (!imageBounds) return;

            const percentDeltaX = (totalDeltaX / imageBounds.width) * 100;
            const percentDeltaY = (totalDeltaY / imageBounds.height) * 100;
            
            const newX = Math.max(0, Math.min(100, startHotspotX + percentDeltaX));
            const newY = Math.max(0, Math.min(100, startHotspotY + percentDeltaY));
            
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
  }, [isEditing, isDragging, isHolding, onFocusRequest, onEditRequest, onPositionChange, hotspot, imageElement]);
  
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
        left: (isEditing || !usePixelPositioning || !pixelPosition) 
          ? `${hotspot.x}%` 
          : `${pixelPosition.x}px`,
        top: (isEditing || !usePixelPositioning || !pixelPosition) 
          ? `${hotspot.y}%` 
          : `${pixelPosition.y}px`
      }}
    >
      <div
        className={centeringWrapperClasses}
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