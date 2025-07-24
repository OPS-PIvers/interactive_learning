import React, { useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { PanZoomHandler } from './PanZoomHandler';
import { PanZoomEvent } from '../../shared/interactiveTypes';
import { ZOOM_LIMITS, PAN_ZOOM_ANIMATION } from '../constants/interactionConstants';

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

// Use constant from shared constants
// const DEFAULT_HOTSPOT_FOCUS_SCALE = 1.75; // Moved to PAN_ZOOM_ANIMATION.defaultHotspotScale

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
        zoom: focusHotspotTarget.targetScale || PAN_ZOOM_ANIMATION.defaultHotspotScale,
      });
      if (onFocusAnimationComplete) {
        setTimeout(() => {
          onFocusAnimationComplete();
        }, PAN_ZOOM_ANIMATION.duration); // Use shared animation duration constant
      }
    }
  }, [focusHotspotTarget, onFocusAnimationComplete]);

  return (
    <div ref={containerRef} className={`viewer-container relative overflow-hidden bg-slate-900 ${className}`}>
      <TransformWrapper
        initialScale={1}
        minScale={ZOOM_LIMITS.minScale}
        maxScale={ZOOM_LIMITS.maxScale}
        doubleClick={{ zoomIn: ZOOM_LIMITS.doubleTapZoomFactor, zoomOut: 1 }}
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