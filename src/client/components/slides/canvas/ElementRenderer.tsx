import React from 'react';
import { getResponsiveHotspotSizeClasses, defaultHotspotSize } from '../../../../shared/hotspotStylePresets';
import { SlideElement } from '../../../../shared/slideTypes';
import { useDeviceDetection } from '../../../hooks/useDeviceDetection';
import { Z_INDEX } from '../../../utils/zIndexLevels';

interface ElementRendererProps {
  element: SlideElement;
  isSelected: boolean;
  isEditable: boolean;
  onMouseDown: (e: React.MouseEvent, elementId: string) => void;
  onTouchStart: (e: React.TouchEvent, elementId: string) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isSelected,
  isEditable,
  onMouseDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) => {
  const { deviceType } = useDeviceDetection();
  const position = element.position?.[deviceType] || element.position?.desktop || { x: 0, y: 0, width: 100, height: 100 };

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
        zIndex: isSelected ? Z_INDEX.SELECTED_ELEMENTS : Z_INDEX.SLIDE_CONTENT,
      }}
      onMouseDown={(e) => onMouseDown(e, element.id)}
      onTouchStart={(e) => onTouchStart(e, element.id)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {element.type === 'hotspot' && (
        <div
          className={`${getResponsiveHotspotSizeClasses(
            defaultHotspotSize
          )} rounded-full flex items-center justify-center transition-all duration-200 ease-in-out hover:scale-105`}
          style={{
            backgroundColor: element.style?.backgroundColor || '#3b82f6',
            opacity: (element.style?.opacity || 1) * 0.2,
            borderWidth: element.style?.borderWidth || 2,
            borderColor: element.style?.borderColor || element.style?.backgroundColor || '#3b82f6',
            borderStyle: 'solid',
          }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: element.style?.backgroundColor || '#3b82f6',
              opacity: element.style?.opacity || 1,
            }}
          />
          {isEditable && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-black bg-opacity-75 text-white px-1 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
              Double-click to edit
            </div>
          )}
        </div>
      )}

      {element.type === 'text' && (
        <div
          className="w-full h-full flex items-center justify-center bg-slate-200 bg-opacity-90 rounded border-2 border-slate-400 text-slate-800 text-sm font-medium"
          style={{ fontSize: element.style?.fontSize || 16 }}
        >
          {element.content?.textContent || 'Text Element'}
        </div>
      )}

      {element.type === 'shape' && (
        <div
          className="w-full h-full border-2 border-slate-400"
          style={{
            backgroundColor: element.style?.backgroundColor || '#e2e8f0',
            borderRadius: element.style?.customShape === 'circle' ? '50%' : '0',
          }}
        />
      )}

      {element.type === 'media' && (
        <div className="w-full h-full bg-slate-300 border-2 border-slate-400 rounded flex items-center justify-center">
          <span className="text-slate-600 text-xs">Media</span>
        </div>
      )}
    </div>
  );
};

export default ElementRenderer;
