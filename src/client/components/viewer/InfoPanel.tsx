import React, { useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react';
import { HotspotData } from '../../shared/types';
import { XMarkIcon } from './icons/XMarkIcon';
import { PencilIcon } from './icons/PencilIcon';

interface InfoPanelProps {
  hotspot: HotspotData;
  anchorX: number; // Viewport X of the hotspot dot's center
  anchorY: number; // Viewport Y of the hotspot dot's center
  imageContainerRect?: DOMRectReadOnly; // Bounding rect of the image container
  isEditing: boolean;
  onRemove: (id: string) => void;
  onEditRequest: (id: string) => void;
  imageTransform?: { scale: number; translateX: number; translateY: number }; // Image transform state
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  hotspot,
  anchorX,
  anchorY,
  imageContainerRect,
  isEditing,
  onRemove,
  onEditRequest,
  imageTransform = { scale: 1, translateX: 0, translateY: 0 },
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, opacity: 0 });
  const [maxDimensions, setMaxDimensions] = useState({maxWidth: 300, maxHeight: 200});
  const [isDragging, setIsDragging] = useState(false);
  const [hasBeenMoved, setHasBeenMoved] = useState(false);

  useEffect(() => {
    if (imageContainerRect) {
        const newMaxWidth = Math.min(350, imageContainerRect.width * 0.9);
        const newMaxHeight = imageContainerRect.height * 0.8;
        setMaxDimensions({maxWidth: newMaxWidth, maxHeight: newMaxHeight});
    }
  }, [imageContainerRect]);


  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = position.x;
    const startPosY = position.y;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      if (imageContainerRect && panelRef.current) {
        const panelRect = panelRef.current.getBoundingClientRect();
        const margin = 10;
        
        const newX = Math.max(margin, Math.min(
          imageContainerRect.width - panelRect.width - margin,
          startPosX + deltaX
        ));
        const newY = Math.max(margin, Math.min(
          imageContainerRect.height - panelRect.height - margin,
          startPosY + deltaY
        ));
        
        setPosition(prev => ({ ...prev, x: newX, y: newY }));
        setHasBeenMoved(true);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [position.x, position.y, imageContainerRect]);

  useLayoutEffect(() => {
    // Only auto-position if the panel hasn't been manually moved
    if (panelRef.current && imageContainerRect && !hasBeenMoved) {
      const panelRect = panelRef.current.getBoundingClientRect();
      const preferredMargin = 10;
      const hotspotDotVisualSize = 20;

      let newX = anchorX - panelRect.width / 2;
      let newY = anchorY - panelRect.height - preferredMargin;

      // Position above/below anchor logic
      if (newY < preferredMargin) {
        newY = anchorY + hotspotDotVisualSize + preferredMargin;
        if (newY + panelRect.height > imageContainerRect.height - preferredMargin) {
          newY = Math.max(preferredMargin, imageContainerRect.height - panelRect.height - preferredMargin);
        }
      } else if (newY + panelRect.height > imageContainerRect.height - preferredMargin) {
         newY = imageContainerRect.height - panelRect.height - preferredMargin;
         if (newY < preferredMargin) newY = preferredMargin;
      }

      // Adjust X position
      if (newX < preferredMargin) {
        newX = preferredMargin;
      }
      if (newX + panelRect.width > imageContainerRect.width - preferredMargin) {
        newX = imageContainerRect.width - panelRect.width - preferredMargin;
      }
      
      if (newX < preferredMargin && panelRect.width <= maxDimensions.maxWidth ) newX = preferredMargin;

      setPosition({ x: newX, y: newY, opacity: 1 });
    } else if (!imageContainerRect) {
      setPosition({ x: -10000, y: -10000, opacity: 0 });
    }
  }, [hotspot.id, anchorX, anchorY, imageContainerRect, maxDimensions, hasBeenMoved]);

  // Reset hasBeenMoved when hotspot changes
  useEffect(() => {
    setHasBeenMoved(false);
  }, [hotspot.id]);

  if (!hotspot) return null;

  return (
    <div
      ref={panelRef}
      className={`hotspot-info-panel absolute p-4 min-w-[240px] bg-slate-800/80 backdrop-blur-lg text-slate-100 rounded-xl shadow-2xl z-30 border border-slate-700/50 transition-all duration-200 ease-out flex flex-col ${
        isDragging ? 'cursor-grabbing scale-105 shadow-sky-500/30' : 'cursor-grab'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: position.opacity,
        width: `${maxDimensions.maxWidth}px`,
        maxHeight: `${maxDimensions.maxHeight}px`,
        display: position.opacity === 0 ? 'none' : 'flex',
        // Transition for opacity is handled by class, transform by dragging state
        transitionProperty: 'opacity, transform',
        transitionDuration: isDragging ? '50ms' :'200ms',
        transitionTimingFunction: 'ease-out',
      }}
      role="dialog"
      aria-labelledby={`hotspot-title-${hotspot.id}`}
      aria-describedby={`hotspot-desc-${hotspot.id}`}
      aria-modal="false" // It's not a modal dialog in the strict sense that traps focus
      onMouseDown={handleMouseDown}
      // Add tabIndex to make the panel focusable itself, if desired, though content inside should be focusable
      // tabIndex={-1}
    >
      {/* Header with Title and Edit/Remove Buttons */}
      <div className="flex justify-between items-center mb-3 flex-shrink-0 border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Enhanced Drag Handle */}
          <button
            className="text-slate-400 hover:text-sky-300 active:text-sky-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 rounded-sm p-0.5 -ml-1"
            title="Drag to move panel"
            aria-label="Drag to move panel"
            onMouseDown={handleMouseDown} // Allow dragging from icon too
            onClick={(e) => e.stopPropagation()} // Prevent panel click through
          >
            {/* Using a more standard drag handle icon (dots) */}
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <circle cx="6" cy="10" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="14" cy="10" r="1.5" />
            </svg>
          </button>
          <h4
            id={`hotspot-title-${hotspot.id}`}
            className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300 truncate"
            title={hotspot.title} // Show full title on hover if truncated
            // tabIndex={0} // Make title focusable if panel itself is not, could be useful for screen readers to jump to title
          >
            {hotspot.title}
          </h4>
        </div>
        {isEditing && (
          <div className="flex items-center ml-2 space-x-2 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEditRequest(hotspot.id); }}
              onMouseDown={(e) => e.stopPropagation()} // Prevent drag from starting on button click
              className="p-1.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-full text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors"
              aria-label={`Edit hotspot: ${hotspot.title}`}
              title="Edit hotspot"
            >
              <PencilIcon className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(hotspot.id); }}
              onMouseDown={(e) => e.stopPropagation()} // Prevent drag from starting on button click
              className="p-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-full text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 transition-colors"
              aria-label={`Remove hotspot: ${hotspot.title}`}
              title="Remove hotspot"
            >
              <XMarkIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div
        id={`hotspot-desc-${hotspot.id}`}
        className="text-sm text-slate-300 overflow-y-auto flex-grow custom-scrollbar pr-1 focus:outline-none" // Added focus:outline-none if panel itself is focusable
        tabIndex={0} // Make content area scrollable and focusable for keyboard users
      >
        {/* Safe text rendering - HTML content is escaped by React */}
        <p className="whitespace-pre-wrap break-words">{hotspot.description}</p>
      </div>
    </div>
  );
};

export default InfoPanel;
