import React, { useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { PanZoomHandler } from './PanZoomHandler';
import { PanZoomEvent } from '../../shared/interactiveTypes';

interface ImageViewerProps {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
  className?: string;
  focusHotspotTarget?: {
    xPercent: number;
    yPercent: number;
    targetScale?: number;
  } | null;
  onFocusAnimationComplete?: () => void;
}

const DEFAULT_HOTSPOT_FOCUS_SCALE = 1.75;

const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt = '',
  title,
  caption,
  className = '',
  focusHotspotTarget,
  onFocusAnimationComplete,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [panZoomToEvent, setPanZoomToEvent] = React.useState<PanZoomEvent | null>(null);

  useEffect(() => {
    if (focusHotspotTarget) {
      setPanZoomToEvent({
        x: focusHotspotTarget.xPercent / 100,
        y: focusHotspotTarget.yPercent / 100,
        zoom: focusHotspotTarget.targetScale || DEFAULT_HOTSPOT_FOCUS_SCALE,
      });
      if (onFocusAnimationComplete) {
        setTimeout(() => {
          onFocusAnimationComplete();
        }, 300); // Corresponds to the animation duration in PanZoomHandler
      }
    }
  }, [focusHotspotTarget, onFocusAnimationComplete]);

  return (
    <div ref={containerRef} className={`viewer-container relative overflow-hidden bg-slate-900 ${className}`}>
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={5}
        doubleClick={{ zoomIn: 2, zoomOut: 1 }}
        wheel={{ step: 0.2 }}
      >
        <>
          <TransformComponent wrapperClass="transform-wrapper w-full h-full" contentClass="transform-content">
            <img
              ref={imageRef}
              src={src}
              alt={alt}
              className="max-w-none select-none"
              draggable={false}
              loading="lazy"
            />
          </TransformComponent>
          
          <PanZoomHandler
            panZoomToEvent={panZoomToEvent}
            imageRef={imageRef}
            containerRef={containerRef}
          />
        </>
      </TransformWrapper>
    </div>
  );
};

export default ImageViewer;