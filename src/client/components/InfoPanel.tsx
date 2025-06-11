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
      className={`hotspot-info-panel absolute p-3 min-w-[200px] bg-slate-900/90 backdrop-blur-md text-white rounded-lg shadow-xl z-30 border border-slate-700 transition-opacity duration-200 ease-out ${
        isDragging ? 'cursor-grabbing shadow-2xl scale-105' : 'cursor-grab'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: position.opacity,
        width: `${maxDimensions.maxWidth}px`,
        maxHeight: `${maxDimensions.maxHeight}px`,
        display: position.opacity === 0 ? 'none' : 'flex',
        flexDirection: 'column',
        transition: isDragging ? 'transform 0.1s ease-out' : 'opacity 0.2s ease-out',
      }}
      role="dialog"
      aria-labelledby={`hotspot-title-${hotspot.id}`}
      aria-modal="false"
      onMouseDown={handleMouseDown}
    >
      <div className="flex justify-between items-start mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs" title="Drag to move">☰</span>
          <h4
            id={`hotspot-title-${hotspot.id}`}
            className="font-bold text-md text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
          >
            {hotspot.title}
          </h4>
        </div>
        {isEditing && (
          <div className="flex items-center ml-2 space-x-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEditRequest(hotspot.id); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1 bg-blue-600 hover:bg-blue-500 rounded-full text-white"
              aria-label={`Edit hotspot ${hotspot.title}`}
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(hotspot.id); }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1 bg-red-600 hover:bg-red-500 rounded-full text-white"
              aria-label={`Remove hotspot ${hotspot.title}`}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      <div className="text-sm text-slate-300 overflow-y-auto flex-grow">
        <p>{hotspot.description}</p>
      </div>
    </div>
  );
};

export default InfoPanel;
