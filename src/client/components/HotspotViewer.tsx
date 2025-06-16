import React, { useState, useCallback } from 'react';
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
}

const HotspotViewer: React.FC<HotspotViewerProps> = ({ 
  hotspot, isPulsing, isEditing, onFocusRequest, onPositionChange, isDimmedInEditMode, isContinuouslyPulsing, imageElement, pixelPosition, usePixelPositioning
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
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
  
  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditing || !onPositionChange) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true); // Assuming setIsDragging is a state setter

    const startX = e.clientX;
    const startY = e.clientY;

    // Store initial position
    const startHotspotX = hotspot.x;
    const startHotspotY = hotspot.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Get current image bounds.
      // In editor mode, actualImageRef is passed as imageElement.
      // This element's BoundingClientRect directly gives the rendered image dimensions.
      const referenceElement = imageElement || (e.currentTarget as HTMLElement).parentElement;
      if (!referenceElement) return;

      const referenceRect = referenceElement.getBoundingClientRect();

      // Calculate new percentage position based on the reference element's dimensions
      // This referenceRect should be the dimensions of the actual rendered image.
      let percentDeltaX = 0;
      if (referenceRect.width > 0) { // Avoid division by zero
          percentDeltaX = (deltaX / referenceRect.width) * 100;
      }

      let percentDeltaY = 0;
      if (referenceRect.height > 0) { // Avoid division by zero
          percentDeltaY = (deltaY / referenceRect.height) * 100;
      }
      
      const newX = Math.max(0, Math.min(100, startHotspotX + percentDeltaX));
      const newY = Math.max(0, Math.min(100, startHotspotY + percentDeltaY));

      onPositionChange(hotspot.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false); // Assuming setIsDragging is a state setter
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isEditing, onPositionChange, hotspot.id, hotspot.x, hotspot.y, imageElement, setIsDragging]); // Added setIsDragging to dependencies
  
  const timelinePulseClasses = isPulsing ? `animate-ping absolute inline-flex h-full w-full rounded-full ${baseColor} opacity-75` : '';
  const continuousPulseDotClasses = isContinuouslyPulsing ? 'subtle-pulse-animation' : '';

  const sizeClasses = getSizeClasses(hotspot.size);
  const dotClasses = `relative inline-flex rounded-full ${sizeClasses} ${baseColor} group-hover:${hoverColor} transition-all duration-200 ${continuousPulseDotClasses} ${
    isEditing && onPositionChange ? 'cursor-move' : 'cursor-pointer'
  } ${isDragging ? 'scale-110 shadow-lg' : ''}`;

  // Positioning container - uses absolute positioning only
  const positioningContainerClasses = `absolute group ${
    isDragging ? 'z-50' : 'z-20'
  }`;

  // Centering wrapper - handles the -50% translation for centering
  const centeringWrapperClasses = `transform -translate-x-1/2 -translate-y-1/2 ${
    isDimmedInEditMode ? 'opacity-40 hover:opacity-100 focus-within:opacity-100 transition-opacity' : ''
  }`;

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return; // Don't trigger click during drag
    e.stopPropagation(); 
    onFocusRequest(hotspot.id);
  };
  
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
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onKeyPress={handleKeyPress}
        role="button"
        aria-label={`Hotspot: ${hotspot.title}${isEditing && onPositionChange ? ' (draggable)' : ''}`}
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
