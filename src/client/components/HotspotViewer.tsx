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
  
  // Get size in pixels based on hotspot size
  const getHotspotDimensions = (size: HotspotSize = 'medium'): { width: string; height: string; afterSize: string } => {
    switch (size) {
      case 'small':
        return { width: '18px', height: '18px', afterSize: '6px' }; // After size approx 1/3 of main
      case 'medium':
        return { width: '24px', height: '24px', afterSize: '8px' };
      case 'large':
        return { width: '30px', height: '30px', afterSize: '10px' };
      default:
        return { width: '24px', height: '24px', afterSize: '8px' };
    }
  };
  
  const baseColor = hotspot.color || '#3b82f6'; // Default to the blue from new CSS if not provided
  // hoverColor is now handled by CSS :hover pseudo-class
  
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
  
  // timelinePulseClasses and continuousPulseDotClasses are removed as animation is handled by the 'hotspot' class CSS.

  const hotspotDimensions = getHotspotDimensions(hotspot.size);

  // Apply the new 'hotspot' class. Dynamic classes for cursor and dragging state are appended.
  // Tailwind classes for size, color, rounded-full, group-hover, transition-all, duration-200 are removed.
  // const dotClasses = `hotspot ${
  //   isEditing && onPositionChange ? 'cursor-move' : '' // cursor-pointer is in .hotspot
  // } ${isDragging ? 'scale-110 shadow-lg' : ''}`; // isDragging can temporarily override transform

  const dynamicClasses = ['hotspot'];
  if (isEditing && onPositionChange) {
    dynamicClasses.push('cursor-move'); // cursor-pointer is default in .hotspot
  }
  if (isDragging) {
    dynamicClasses.push('hotspot-dragging'); // Replaces 'scale-110 shadow-lg'
  }
  const dotClasses = dynamicClasses.join(' ');

  const containerClasses = `absolute group ${ // transform -translate-x-1/2 -translate-y-1/2 is in .hotspot
    isDimmedInEditMode ? 'opacity-40 hover:opacity-100 focus-within:opacity-100 transition-opacity' : ''
} ${isDragging ? 'z-50' : 'z-20'}`;

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
      className={containerClasses}
      style={{
        position: 'absolute',
        left: usePixelPositioning && pixelPosition
          ? `${pixelPosition.x}px`
          : `${hotspot.x}%`,
        top: usePixelPositioning && pixelPosition
          ? `${pixelPosition.y}px`
          : `${hotspot.y}%`,
        transform: 'translate(-50%, -50%)', // Restored for correct positioning of the container
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onKeyPress={handleKeyPress}
      role="button"
      aria-label={`Hotspot: ${hotspot.title}${isEditing && onPositionChange ? ' (draggable)' : ''}`}
      tabIndex={0} // Make it focusable
    >
      <span
        className={dotClasses}
        aria-hidden="true"
        style={{
          backgroundColor: baseColor, // Directly use baseColor
          width: hotspotDimensions.width,
          height: hotspotDimensions.height,
          // For scaling ::after element. CSS variables are a clean way.
          // @ts-ignore CSS custom properties
          '--hotspot-after-size': hotspotDimensions.afterSize,
        }}
      >
        {/* The ping animation span (previously using timelinePulseClasses) is removed. */}
      </span>
      {/* Info panel rendering is now handled by InteractiveModule using InfoPanel component */}
    </div>
  );
};

export default HotspotViewer;
