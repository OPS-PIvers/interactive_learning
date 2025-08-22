import React from 'react';
import { ImageTransformState } from '../../../../shared/types';
import { useTouchGestures } from '../../../hooks/useTouchGestures';
import { ViewportBounds } from '../../../utils/touchUtils';

interface CanvasContainerProps {
  children: React.ReactNode;
  canvasTransform: ImageTransformState;
  setCanvasTransform: React.Dispatch<React.SetStateAction<ImageTransformState>>;
  isTransforming: boolean;
  setIsTransforming: (isTransforming: boolean) => void;
  viewportBounds: ViewportBounds;
  canvasDimensions: { width: number; height: number };
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({
  children,
  canvasTransform,
  setCanvasTransform,
  isTransforming,
  setIsTransforming,
  viewportBounds,
  canvasDimensions,
  deviceType,
}) => {
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchGestures(
    canvasContainerRef,
    canvasTransform,
    setCanvasTransform,
    setIsTransforming,
    { viewportBounds }
  );

  return (
    <div
      ref={canvasContainerRef}
      className="relative mobile-responsive-canvas canvas-transform-container"
      style={{
        transform: `scale(${canvasTransform.scale}) translate(${canvasTransform.translateX}px, ${canvasTransform.translateY}px)`,
        transformOrigin: 'center center',
        transition: isTransforming ? 'none' : 'transform 0.3s ease-out',
        minWidth: deviceType === 'mobile' ? '320px' : canvasDimensions.width,
        minHeight: deviceType === 'mobile' ? '240px' : canvasDimensions.height,
        maxWidth: '100%',
        maxHeight: '100%',
        width: '100%',
        height: '100%',
        touchAction: deviceType === 'mobile' ? 'pan-x pan-y' : 'auto',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        isolation: 'isolate',
        contain: 'layout style paint size',
        WebkitTransformStyle: 'preserve-3d',
        transformStyle: 'preserve-3d',
        willChange: isTransforming ? 'transform' : 'auto',
        position: 'relative',
        zIndex: 1,
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        if (deviceType === 'mobile') {
          e.preventDefault();
        }
        handleTouchStart(e);
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        if (deviceType === 'mobile' && isTransforming) {
          e.preventDefault();
        }
        handleTouchMove(e);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        handleTouchEnd(e);
      }}
    >
      {children}
    </div>
  );
};

export default CanvasContainer;
