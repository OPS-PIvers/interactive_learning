import React, { useState, useCallback, useRef, useMemo, memo, useEffect } from 'react';
import { SlideDeck, SlideElement, DeviceType, ImageTransformState } from '../../../../shared/slideTypes';
import { useDeviceDetection } from '../../../hooks/useDeviceDetection';
import { useCanvasDimensions } from '../hooks/useCanvasDimensions';
import { useElementInteractions } from '../hooks/useElementInteractions';
import { useCanvasGestures } from '../hooks/useCanvasGestures';
import CanvasContainer from './CanvasContainer';
import SlideRenderer from './SlideRenderer';
import { ViewportBounds } from '../../../utils/touchUtils';

export interface ResponsiveCanvasProps {
  slideDeck: SlideDeck;
  currentSlideIndex: number;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
  selectedElementId?: string | null;
  onElementSelect?: (elementId: string | null) => void;
  onElementUpdate?: (elementId: string, updates: Partial<SlideElement>) => void;
  onHotspotDoubleClick?: (elementId: string) => void;
  deviceTypeOverride?: DeviceType;
  className?: string;
  isEditable?: boolean;
}

const ResponsiveCanvasComponent: React.FC<ResponsiveCanvasProps> = ({
  slideDeck,
  currentSlideIndex,
  onSlideDeckChange,
  selectedElementId: propSelectedElementId,
  onElementSelect,
  onElementUpdate,
  onHotspotDoubleClick,
  deviceTypeOverride,
  className = '',
  isEditable = true,
}) => {
  const { viewportInfo } = useDeviceDetection();
  const deviceType = useMemo(() => {
    if (deviceTypeOverride) return deviceTypeOverride;
    if (viewportInfo.width < 768) return 'mobile';
    if (viewportInfo.width < 1024) return 'tablet';
    return 'desktop';
  }, [deviceTypeOverride, viewportInfo.width]);

  const slideAreaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [canvasTransform, setCanvasTransform] = useState<ImageTransformState>({ scale: 1, translateX: 0, translateY: 0 });
  const [isTransforming, setIsTransforming] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds>({ width: 0, height: 0, contentWidth: 0, contentHeight: 0 });

  const currentSlide = useMemo(() => slideDeck?.slides?.[currentSlideIndex], [slideDeck?.slides, currentSlideIndex]);

  const canvasDimensions = useCanvasDimensions(slideAreaRef, currentSlide?.layout?.aspectRatio || '16:9', deviceType);

  const {
    selectedElementId,
    handleElementSelect,
    handleHotspotClick,
    handleElementUpdate,
  } = useElementInteractions(
    slideDeck,
    currentSlideIndex,
    onSlideDeckChange,
    propSelectedElementId,
    onElementSelect,
    onElementUpdate,
    onHotspotDoubleClick,
    isEditable
  );

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStartElement,
    handleTouchMoveElement,
    handleTouchEndElement,
  } = useCanvasGestures(
    isEditable,
    currentSlide?.elements,
    deviceType,
    canvasRef,
    handleElementUpdate,
    handleElementSelect,
    handleHotspotClick
  );

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      handleElementSelect(null);
    }
  };

  const calculateViewportBounds = useCallback((): ViewportBounds => {
    const slideArea = slideAreaRef.current;
    const canvasContainer = canvasRef.current?.parentElement;

    if (!slideArea || !canvasContainer) {
      return { width: 0, height: 0, contentWidth: 0, contentHeight: 0 };
    }

    const slideAreaRect = slideArea.getBoundingClientRect();
    const canvasRect = canvasContainer.getBoundingClientRect();

    return {
      width: slideAreaRect.width,
      height: slideAreaRect.height,
      contentWidth: canvasRect.width,
      contentHeight: canvasRect.height,
    };
  }, []);

  useEffect(() => {
    const bounds = calculateViewportBounds();
    setViewportBounds(bounds);
  }, [calculateViewportBounds, canvasTransform]);

  if (!currentSlide) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <p className="text-slate-500">No slide selected</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-slate-100 ${className} responsive-canvas-root`}
    >
      <div
        ref={slideAreaRef}
        className="w-full h-full flex items-center justify-center p-2 md:p-4"
      >
        <CanvasContainer
          canvasTransform={canvasTransform}
          setCanvasTransform={setCanvasTransform}
          isTransforming={isTransforming}
          setIsTransforming={setIsTransforming}
          viewportBounds={viewportBounds}
          canvasDimensions={canvasDimensions}
          deviceType={deviceType}
        >
          <SlideRenderer
            canvasRef={canvasRef}
            currentSlide={currentSlide}
            canvasDimensions={canvasDimensions}
            selectedElementId={selectedElementId}
            deviceType={deviceType}
            isEditable={isEditable}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStartElement}
            onTouchMove={handleTouchMoveElement}
            onTouchEnd={handleTouchEndElement}
            onCanvasClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </CanvasContainer>
      </div>
    </div>
  );
};

export const ResponsiveCanvas = memo(ResponsiveCanvasComponent);
ResponsiveCanvas.displayName = 'ResponsiveCanvas';

export default ResponsiveCanvas;
