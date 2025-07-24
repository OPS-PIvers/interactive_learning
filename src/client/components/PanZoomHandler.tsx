import React, { useEffect } from 'react';
import { useTransformContext } from 'react-zoom-pan-pinch';
import { PanZoomEvent } from '../../shared/interactiveTypes';
import { calculateCenteringTransform } from '../utils/panZoomUtils';
import { PAN_ZOOM_ANIMATION } from '../constants/interactionConstants';

interface PanZoomHandlerProps {
  panZoomToEvent: PanZoomEvent | null;
  imageRef: React.RefObject<HTMLImageElement>;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const PanZoomHandler: React.FC<PanZoomHandlerProps> = ({
  panZoomToEvent,
  imageRef,
  containerRef,
}) => {
  const { setTransform } = useTransformContext();

  useEffect(() => {
    if (!panZoomToEvent || !imageRef.current || !containerRef.current) {
      return;
    }

    const imageEl = imageRef.current;
    const containerEl = containerRef.current;

    const imageNaturalDims = {
      width: imageEl.naturalWidth,
      height: imageEl.naturalHeight,
    };
    const containerDims = containerEl.getBoundingClientRect();

    const hotspotPosition = { x: panZoomToEvent.x, y: panZoomToEvent.y };
    const targetScale = panZoomToEvent.zoom;

    const { x, y } = calculateCenteringTransform(
      hotspotPosition,
      targetScale,
      imageNaturalDims,
      containerDims
    );

    // Use the library's method to animate the transformation
    setTransform(x, y, targetScale, PAN_ZOOM_ANIMATION.duration, PAN_ZOOM_ANIMATION.easing);

  }, [panZoomToEvent, imageRef, containerRef, setTransform]);

  // This component does not render anything itself, it just handles effects.
  return null;
};
