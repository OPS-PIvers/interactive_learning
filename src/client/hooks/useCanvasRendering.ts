/**
 * Canvas Rendering Hook
 * 
 * Optimized canvas rendering utilities extracted from ResponsiveCanvas.
 * Provides memoized calculations and efficient element rendering.
 */

import { useMemo, useCallback } from 'react';
import { InteractiveSlide, SlideElement, DeviceType } from '../../shared/slideTypes';
import { calculateCanvasDimensions } from '../utils/aspectRatioUtils';

interface CanvasDimensions {
  width: number;
  height: number;
}

interface ContainerDimensions {
  width: number;
  height: number;
}

interface UseCanvasRenderingProps {
  currentSlide: InteractiveSlide | undefined;
  containerDimensions: ContainerDimensions;
  deviceType: DeviceType;
}

export const useCanvasRendering = ({
  currentSlide,
  containerDimensions,
  deviceType
}: UseCanvasRenderingProps) => {

  // Memoized canvas dimensions calculation
  const canvasDimensions = useMemo((): CanvasDimensions => {
    if (!currentSlide) return { width: 800, height: 450 };

    const aspectRatio = currentSlide.layout?.aspectRatio || '16:9';

    // Use state-managed container dimensions with fallbacks
    const containerWidth = containerDimensions.width > 0 ? containerDimensions.width : 800;
    const containerHeight = containerDimensions.height > 0 ? containerDimensions.height : 600;

    // Use standard padding - responsive behavior handled by CSS classes
    const dimensions = calculateCanvasDimensions(
      aspectRatio,
      containerWidth,
      containerHeight,
      24, // Standard padding for all viewports
      false // Remove landscape-specific logic
    );

    return dimensions;
  }, [currentSlide, containerDimensions]);

  // Memoized element filtering and sorting
  const visibleElements = useMemo(() => {
    if (!currentSlide?.elements) return [];

    // Filter and sort elements for optimal rendering
    return currentSlide.elements
      .filter((element: SlideElement) => {
        // Filter out elements that are off-canvas or hidden
        const position = element.position?.[deviceType] || element.position?.desktop;
        if (!position) return false;

        // Basic visibility check
        return position.x >= -50 && position.y >= -50 && 
               position.x < canvasDimensions.width + 50 && 
               position.y < canvasDimensions.height + 50;
      })
      .sort((a: SlideElement, b: SlideElement) => {
        // Sort by z-index for proper layering
        const aZIndex = a.style?.zIndex || 0;
        const bZIndex = b.style?.zIndex || 0;
        return aZIndex - bZIndex;
      });
  }, [currentSlide?.elements, deviceType, canvasDimensions]);

  // Optimized element position calculator
  const getElementPosition = useCallback((element: SlideElement) => {
    const position = element.position?.[deviceType] || element.position?.desktop;
    if (!position) return { x: 0, y: 0, width: 100, height: 100 };

    return {
      x: Math.max(0, Math.min(position.x, canvasDimensions.width - (position.width || 100))),
      y: Math.max(0, Math.min(position.y, canvasDimensions.height - (position.height || 100))),
      width: position.width || 100,
      height: position.height || 100
    };
  }, [deviceType, canvasDimensions]);

  // Check if element is currently visible in viewport
  const isElementVisible = useCallback((element: SlideElement) => {
    const pos = getElementPosition(element);
    return pos.x + pos.width >= 0 && pos.y + pos.height >= 0 &&
           pos.x < canvasDimensions.width && pos.y < canvasDimensions.height;
  }, [getElementPosition, canvasDimensions]);

  return {
    canvasDimensions,
    visibleElements,
    getElementPosition,
    isElementVisible
  };
};