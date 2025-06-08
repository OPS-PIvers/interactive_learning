import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { HotspotData } from '../types';
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
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  hotspot,
  anchorX,
  anchorY,
  imageContainerRect,
  isEditing,
  onRemove,
  onEditRequest,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, opacity: 0 });
  const [maxDimensions, setMaxDimensions] = useState({maxWidth: 300, maxHeight: 200});

  useEffect(() => {
    if (imageContainerRect) {
        const newMaxWidth = Math.min(350, imageContainerRect.width * 0.9);
        const newMaxHeight = imageContainerRect.height * 0.8;
        setMaxDimensions({maxWidth: newMaxWidth, maxHeight: newMaxHeight});
    }
  }, [imageContainerRect]);


  useLayoutEffect(() => {
    if (panelRef.current && imageContainerRect) {
      const panelRect = panelRef.current.getBoundingClientRect();
      const preferredMargin = 10; // Preferred margin from anchor and container edges
      const hotspotDotVisualSize = 20; // Approximate visual size of the hotspot dot

      let newX = anchorX - panelRect.width / 2;
      let newY = anchorY - panelRect.height - preferredMargin; // Default: above anchor

      // Attempt to keep panel within container bounds
      // Prioritize Y positioning (above/below anchor)
      if (newY < preferredMargin) { // Not enough space above
        newY = anchorY + hotspotDotVisualSize + preferredMargin; // Try below anchor
        if (newY + panelRect.height > imageContainerRect.height - preferredMargin) {
          // Still not fitting below, try to fit vertically centered if possible, or clamp
          newY = Math.max(preferredMargin, imageContainerRect.height - panelRect.height - preferredMargin);
        }
      } else if (newY + panelRect.height > imageContainerRect.height - preferredMargin) { // Too low
         newY = imageContainerRect.height - panelRect.height - preferredMargin; // Clamp to bottom
         if (newY < preferredMargin) newY = preferredMargin; // further clamp if panel very tall
      }


      // Adjust X position
      if (newX < preferredMargin) {
        newX = preferredMargin;
      }
      if (newX + panelRect.width > imageContainerRect.width - preferredMargin) {
        newX = imageContainerRect.width - panelRect.width - preferredMargin;
      }
      
      // Final check if newX became negative after width adjustment
      if (newX < preferredMargin && panelRect.width <= maxDimensions.maxWidth ) newX = preferredMargin;


      setPosition({ x: newX, y: newY, opacity: 1 });
    } else {
      // Position it off-screen initially if no container rect
      setPosition({ x: -10000, y: -10000, opacity: 0 });
    }
  }, [hotspot.id, anchorX, anchorY, imageContainerRect, maxDimensions]); // Rerun if hotspot changes, or anchor/container changes

  if (!hotspot) return null;

  return (
    <div
      ref={panelRef}
      className="hotspot-info-panel absolute p-3 min-w-[200px] bg-slate-900/90 backdrop-blur-md text-white rounded-lg shadow-xl z-30 border border-slate-700 transition-opacity duration-200 ease-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: position.opacity,
        width: `${maxDimensions.maxWidth}px`, // Use state for maxWidth
        maxHeight: `${maxDimensions.maxHeight}px`, // Use state for maxHeight
        display: position.opacity === 0 ? 'none' : 'flex', // Use flex for inner content control
        flexDirection: 'column',
      }}
      role="dialog"
      aria-labelledby={`hotspot-title-${hotspot.id}`}
      aria-modal="false" // It's not a blocking modal
    >
      <div className="flex justify-between items-start mb-2 flex-shrink-0">
        <h4
          id={`hotspot-title-${hotspot.id}`}
          className="font-bold text-md text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
        >
          {hotspot.title}
        </h4>
        {isEditing && (
          <div className="flex items-center ml-2 space-x-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEditRequest(hotspot.id); }}
              className="p-1 bg-blue-600 hover:bg-blue-500 rounded-full text-white"
              aria-label={`Edit hotspot ${hotspot.title}`}
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(hotspot.id); }}
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
