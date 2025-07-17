import { useCallback, useMemo } from 'react';
import { HotspotData, ImageTransformState } from '../../shared/types';
import { getActualImageVisibleBounds } from '../utils/imageBounds';

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
      const visibleImageBounds = getActualImageVisibleBounds(imageElement, containerElement);

      if (!visibleImageBounds) {
        return null;
      }

      // 1. Calculate base pixel position on the visible image content area
      const basePixelX = (hotspot.x / 100) * visibleImageBounds.width;
      const basePixelY = (hotspot.y / 100) * visibleImageBounds.height;

      // 2. Position relative to the visible image bounds origin (which is relative to the viewport)
      let positionX = visibleImageBounds.x + basePixelX;
      let positionY = visibleImageBounds.y + basePixelY;

      // 3. Apply dynamic transform if scale > 1 (zoomed) or translate is active
      if (containerElement && (currentImageTransform.scale !== 1 || currentImageTransform.translateX !== 0 || currentImageTransform.translateY !== 0)) {
        const containerRect = containerElement.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        const centerY = containerRect.top + containerRect.height / 2;

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

  // Enhanced position calculation with transition stability
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

      // During transitions, use more stable calculations to prevent position jumping
      if (isTransitioning) {
        // Use percentage-based positioning with minimal transform interference
        const basePixelX = (hotspot.x / 100) * imageBounds.width;
        const basePixelY = (hotspot.y / 100) * imageBounds.height;
        
        // Apply only the translation component during transitions, not scaling
        const positionX = imageBounds.left + basePixelX + (currentImageTransform.translateX || 0);
        const positionY = imageBounds.top + basePixelY + (currentImageTransform.translateY || 0);
        
        return { x: positionX, y: positionY };
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
