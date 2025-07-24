import { useCallback, useMemo } from 'react';
import { HotspotData, ImageTransformState } from '../../shared/types';
import { getActualImageVisibleBoundsRelative } from '../utils/imageBounds';

export interface HotspotPositioningUtils {
  getPixelPosition: (
    hotspot: HotspotData,
    currentImageTransform: ImageTransformState,
    imageElement: HTMLImageElement | null,
    containerElement: HTMLElement | null
  ) => { x: number; y: number } | null;
  getStablePixelPosition: (
    hotspot: HotspotData,
    currentImageTransform: ImageTransformState,
    imageBounds: { width: number; height: number; left: number; top: number } | null,
    containerDimensions?: { width: number; height: number },
    isTransitioning?: boolean
  ) => { x: number; y: number } | null;
  validatePosition: (
    position: { x: number; y: number },
    containerBounds: { width: number; height: number }
  ) => { x: number; y: number };
}

export const useHotspotPositioning = (
  isMobile: boolean
) => {
  const getPixelPosition = useCallback(
    (
      hotspot: HotspotData,
      currentImageTransform: ImageTransformState,
      imageElement: HTMLImageElement | null,
      containerElement: HTMLElement | null
    ): { x: number; y: number } | null => {
      const visibleImageBounds = getActualImageVisibleBoundsRelative(imageElement, containerElement);

      if (!visibleImageBounds) {
        return null;
      }

      // Calculate pixel position using the same coordinate system as pan/zoom
      // This matches the calculation in panZoomUtils.ts
      const imageContentX = (hotspot.x / 100) * visibleImageBounds.width;
      const imageContentY = (hotspot.y / 100) * visibleImageBounds.height;

      // Add image offset within container to get final container-relative coordinates
      // This is the same calculation used in pan/zoom for coordinate alignment
      const positionX = visibleImageBounds.x + imageContentX;
      const positionY = visibleImageBounds.y + imageContentY;

      return {
        x: positionX,
        y: positionY,
      };
    },
    []
  );

  const getStablePixelPosition = useCallback(
    (
      hotspot: HotspotData,
      currentImageTransform: ImageTransformState,
      imageBounds: { width: number; height: number; left: number; top: number } | null,
      containerDimensions?: { width: number; height: number },
      isTransitioning?: boolean
    ): { x: number; y: number } | null => {
      if (!imageBounds) {
        return null;
      }

      // Normal calculation - delegate to the existing function
      return getPixelPosition(hotspot, currentImageTransform, imageBounds, containerDimensions);
    },
    [getPixelPosition]
  );

  // Position validation to ensure hotspots stay within reasonable bounds
  const validatePosition = useCallback(
    (
      position: { x: number; y: number },
      containerBounds: { width: number; height: number }
    ): { x: number; y: number } => {
      // Add padding to prevent hotspots from being completely off-screen
      const padding = 20;
      
      const validatedX = Math.max(
        -padding,
        Math.min(containerBounds.width + padding, position.x)
      );
      
      const validatedY = Math.max(
        -padding,
        Math.min(containerBounds.height + padding, position.y)
      );
      
      return { x: validatedX, y: validatedY };
    },
    []
  );

  return useMemo((): HotspotPositioningUtils => ({
    getPixelPosition,
    getStablePixelPosition,
    validatePosition,
  }), [getPixelPosition, getStablePixelPosition, validatePosition]);
};
