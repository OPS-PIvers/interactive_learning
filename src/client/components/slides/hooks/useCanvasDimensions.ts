import { useState, useEffect, useMemo } from 'react';
import { calculateCanvasDimensions } from '../../../utils/aspectRatioUtils';

export const useCanvasDimensions = (
  slideAreaRef: React.RefObject<HTMLDivElement>,
  aspectRatio: string,
) => {
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const slideArea = slideAreaRef.current;
    if (!slideArea) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(slideArea);

    return () => {
      resizeObserver.disconnect();
    };
  }, [slideAreaRef]);

  const canvasDimensions = useMemo(() => {
    if (!aspectRatio || containerDimensions.width === 0 || containerDimensions.height === 0) {
      return { width: 1, height: 1, top: 0, left: 0 };
    }

    return calculateCanvasDimensions(
      aspectRatio,
      containerDimensions.width,
      containerDimensions.height,
      0,
      false
    );
  }, [aspectRatio, containerDimensions]);

  return canvasDimensions;
};
