import React from 'react';
import { ImageTransformState } from '../../../../shared/types';
import { useTouchGestures } from '../../../hooks/useTouchGestures';
import { ViewportBounds } from '../../../utils/touchUtils';

interface CanvasContainerProps {
  children: React.ReactNode;
  canvasTransform: ImageTransformState;
  setCanvasTransform: (transform: ImageTransformState | ((prevTransform: ImageTransformState) => ImageTransformState)) => void;
  isTransforming: boolean;
  setIsTransforming: (isTransforming: boolean) => void;
  viewportBounds: ViewportBounds;
  canvasDimensions: { width: number; height: number };
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({
  children,
  canvasTransform,
  setCanvasTransform,
  isTransforming,
  setIsTransforming,
  viewportBounds,
  canvasDimensions,
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
        minWidth: '320px',
        minHeight: '240px',
        width: `${canvasDimensions.width}px`,
        height: `${canvasDimensions.height}px`,
        touchAction: 'pan-x pan-y',
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

export default CanvasContainer;
