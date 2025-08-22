import React from 'react';
import { InteractiveSlide } from '../../../../shared/slideTypes';
import { Z_INDEX_TAILWIND } from '../../../utils/zIndexLevels';
import ElementRenderer from './ElementRenderer';

interface SlideRendererProps {
  currentSlide: InteractiveSlide;
  canvasDimensions: { width: number; height: number };
  selectedElementId: string | null;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isEditable: boolean;
  onMouseDown: (e: React.MouseEvent, elementId: string) => void;
  onTouchStart: (e: React.TouchEvent, elementId: string) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onCanvasClick: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({
  currentSlide,
  canvasDimensions,
  selectedElementId,
  deviceType,
  isEditable,
  onMouseDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onCanvasClick,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  canvasRef,
}) => {
  return (
    <div
      ref={canvasRef}
      className="relative bg-white shadow-lg overflow-hidden"
      style={{
        width: canvasDimensions.width,
        height: canvasDimensions.height,
      }}
      onClick={onCanvasClick}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* Background */}
      {currentSlide?.backgroundMedia && (
        <div
          className={`absolute inset-0 ${Z_INDEX_TAILWIND.BASE}`}
        >
          {currentSlide.backgroundMedia.type === 'image' && currentSlide.backgroundMedia.url && (
            <img
              src={currentSlide.backgroundMedia.url}
              alt="Slide background"
              className="w-full h-full object-cover"
            />
          )}
          {currentSlide.backgroundMedia.type === 'color' && (
            <div
              className="w-full h-full"
              style={{ backgroundColor: currentSlide.backgroundMedia.color || '#ffffff' }}
            />
          )}
        </div>
      )}

      {/* Elements */}
      {currentSlide?.elements?.map((element) => (
        <ElementRenderer
          key={element.id}
          element={element}
          isSelected={element.id === selectedElementId}
          deviceType={deviceType}
          isEditable={isEditable}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      ))}
    </div>
  );
};

export default SlideRenderer;
