import React, { useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { ZOOM_LIMITS, PAN_ZOOM_ANIMATION } from '../constants/interactionConstants';

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

interface ZoomControllerProps {
  focusHotspotTarget: ImageViewerProps['focusHotspotTarget'];
  onFocusAnimationComplete: ImageViewerProps['onFocusAnimationComplete'];
  imageRef: React.RefObject<HTMLImageElement>;
  containerRef: React.RefObject<HTMLDivElement>;
}

const ZoomController: React.FC<ZoomControllerProps> = ({ 
  focusHotspotTarget, 
  onFocusAnimationComplete, 
  imageRef, 
  containerRef 
}) => {
  const { setTransform } = useControls();
  const onFocusAnimationCompleteRef = useRef(onFocusAnimationComplete);
  
  // Keep the callback ref up to date without triggering effect re-runs
  onFocusAnimationCompleteRef.current = onFocusAnimationComplete;

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

      // As of react-zoom-pan-pinch v3.7.0, the library does not provide a promise or callback for animation completion.
      // The original setTimeout was buggy due to lack of cleanup, but removing it without a replacement
      // means the onFocusAnimationComplete will not be called.
      // A more robust solution would be to poll for the transform state, but that adds complexity
      // and potential performance overhead. Given the constraints, we use a cancellable timeout.
      const timeoutId = setTimeout(() => {
        onFocusAnimationCompleteRef.current?.();
      }, PAN_ZOOM_ANIMATION.duration);

      return () => clearTimeout(timeoutId);
    }
  }, [focusHotspotTarget, setTransform, imageRef, containerRef]);

  return null;
};


const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt,
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