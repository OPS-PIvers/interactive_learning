import React, { useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { ZOOM_LIMITS, PAN_ZOOM_ANIMATION } from '../constants/interactionConstants';

interface ImageViewerProps {
  src: string;
  alt?: string;
  className?: string;
  focusHotspotTarget?: {
    xPercent: number;
    yPercent: number;
    targetScale?: number;
  } | null;
  onFocusAnimationComplete?: () => void;
}

const ZoomController: React.FC<{
  focusHotspotTarget: ImageViewerProps['focusHotspotTarget'];
  onFocusAnimationComplete: ImageViewerProps['onFocusAnimationComplete'];
  imageRef: React.RefObject<HTMLImageElement>;
  containerRef: React.RefObject<HTMLDivElement>;
}> = ({ focusHotspotTarget, onFocusAnimationComplete, imageRef, containerRef }) => {
  const { setTransform } = useControls();

  useEffect(() => {
    if (focusHotspotTarget && imageRef.current && containerRef.current) {
      const { xPercent, yPercent, targetScale } = focusHotspotTarget;
      const scale = targetScale || PAN_ZOOM_ANIMATION.defaultHotspotScale;

      const image = imageRef.current;
      const container = containerRef.current;

      const imageWidth = image.naturalWidth;
      const imageHeight = image.naturalHeight;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      // Calculate the target coordinates in pixels on the image
      const targetX = (imageWidth * xPercent) / 100;
      const targetY = (imageHeight * yPercent) / 100;

      // Calculate the pan required to center the target point in the container
      const panX = containerWidth / 2 - targetX * scale;
      const panY = containerHeight / 2 - targetY * scale;

      setTransform(panX, panY, scale, PAN_ZOOM_ANIMATION.duration, 'easeOut');

      // The library does not seem to provide a promise or callback for animation completion.
      // The original setTimeout was buggy, but removing it without a replacement
      // means the onFocusAnimationComplete will not be called.
      // A more robust solution would be to poll for the state, but that is complex.
      // Given the constraints, we will use a timeout but ensure it can be cancelled.
      const timeoutId = setTimeout(() => {
        if (onFocusAnimationComplete) {
          onFocusAnimationComplete();
        }
      }, PAN_ZOOM_ANIMATION.duration);

      return () => clearTimeout(timeoutId);
    }
  }, [focusHotspotTarget, onFocusAnimationComplete, setTransform, imageRef, containerRef]);

  return null;
};


const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt = '',
  className = '',
  focusHotspotTarget,
  onFocusAnimationComplete,
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
        <ZoomController
          focusHotspotTarget={focusHotspotTarget}
          onFocusAnimationComplete={onFocusAnimationComplete}
          imageRef={imageRef}
          containerRef={containerRef}
        />
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
      </TransformWrapper>
    </div>
  );
};

export default ImageViewer;