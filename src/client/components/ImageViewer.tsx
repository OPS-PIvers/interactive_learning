import React, { useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZOOM_LIMITS } from '../constants/interactionConstants';

interface ImageViewerProps {
  src: string;
  alt: string;
  className?: string;
  focusHotspotTarget?: {
    xPercent: number;
    yPercent: number;
    targetScale?: number;
  } | null;
  onFocusAnimationComplete?: () => void;
}


const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt,
  className = '',
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className={`viewer-container relative overflow-hidden bg-slate-900 ${className}`}>
      <TransformWrapper
        initialScale={1}
        minScale={ZOOM_LIMITS.minScale}
        maxScale={ZOOM_LIMITS.maxScale}
        doubleClick={{ step: ZOOM_LIMITS.doubleTapZoomFactor, mode: "zoomIn" }}
        wheel={{ step: 0.2 }}
      >
        <TransformComponent>
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className="max-w-none select-none w-full h-full object-contain"
            draggable={false}
            loading="lazy"
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default ImageViewer;