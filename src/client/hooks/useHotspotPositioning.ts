import { useCallback, useMemo } from 'react';
import { HotspotData, ImageTransformState } from '../../shared/types'; // Assuming HotspotData and ImageTransformState are in shared/types

// Interface for the hook's return utilities, as per problem description
export interface HotspotPositioningUtils {
  getPixelPosition: (
    hotspot: HotspotData,
    currentImageTransform: ImageTransformState, // Pass current transform for accuracy
    imageNaturalDimensions: { width: number; height: number } | null, // Natural dimensions of the image
    renderedImageRect: DOMRect | null // Actual rendered dimensions and position of the image element/div
  ) => { x: number; y: number } | null;
  // updateHotspotPosition might be handled directly in the component state,
  // but a utility could be provided if complex validation/conversion is needed.
  // For now, focusing on getPixelPosition as per primary need.
  // validatePosition: (pos: { x: number; y: number }) => { x: number; y: number }; // This might also be component-specific
}

export const useHotspotPositioning = (
  isMobile: boolean
) => {
  const getPixelPosition = useCallback(
    (
      hotspot: HotspotData,
      currentImageTransform: ImageTransformState,
      imageBounds: { width: number; height: number; left: number; top: number } | null,
      containerDimensions?: { width: number; height: number } // For transform calculations
    ): { x: number; y: number } | null => {
      if (!imageBounds) {
        return null;
      }

      // 1. Calculate base pixel position on the rendered image content area
      // Hotspot percentages are relative to the image content, not the container
      const basePixelX = (hotspot.x / 100) * imageBounds.width;
      const basePixelY = (hotspot.y / 100) * imageBounds.height;

      // 2. Position relative to the image bounds origin
      let positionX = imageBounds.left + basePixelX;
      let positionY = imageBounds.top + basePixelY;

      // 3. Apply dynamic transform if scale > 1 (zoomed) or translate is active
      if (currentImageTransform.scale !== 1 || currentImageTransform.translateX !== 0 || currentImageTransform.translateY !== 0) {
        // Use container dimensions for transform origin calculations
        // If not provided, use image bounds as fallback
        const transformContainerWidth = containerDimensions?.width || imageBounds.width;
        const transformContainerHeight = containerDimensions?.height || imageBounds.height;
        
        const centerX = transformContainerWidth / 2;
        const centerY = transformContainerHeight / 2;

        // Apply center-origin scale transform
        positionX = (positionX - centerX) * currentImageTransform.scale + centerX + currentImageTransform.translateX;
        positionY = (positionY - centerY) * currentImageTransform.scale + centerY + currentImageTransform.translateY;
      }

      return {
        x: positionX,
        y: positionY,
      };
    },
    []
  );

  // Placeholder for other utilities if they become complex enough
  // const updateHotspotPosition = useCallback(...)
  // const validatePosition = useCallback(...)

  return useMemo((): HotspotPositioningUtils => ({
    getPixelPosition,
    // updateHotspotPosition,
    // validatePosition,
  }), [getPixelPosition]);
};
