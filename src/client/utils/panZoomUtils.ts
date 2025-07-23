// Unified pan and zoom calculation utilities
import { TimelineEventData, ImageTransformState } from '../../shared/types';
import { PREVIEW_DEFAULTS, INTERACTION_DEFAULTS } from '../constants/interactionConstants';
import { getActualImageVisibleBounds } from './imageBounds';

/**
 * Calculate pan and zoom transform to center a target point in the viewport
 * This works for both mobile and desktop by using image-content-aware positioning
 * for centering a scaled image with transform-origin: center center
 */
export const calculatePanZoomTransform = (
  event: TimelineEventData,
  containerRect: DOMRect,
  imageElement: HTMLImageElement | null = null,
  containerElement: HTMLElement | null = null
): ImageTransformState => {
  const targetX = event.targetX ?? event.spotlightX ?? PREVIEW_DEFAULTS.TARGET_X;
  const targetY = event.targetY ?? event.spotlightY ?? PREVIEW_DEFAULTS.TARGET_Y;
  const zoomLevel = event.zoomLevel ?? event.zoomFactor ?? event.zoom ?? INTERACTION_DEFAULTS.zoomFactor;

  let targetPixelX: number;
  let targetPixelY: number;

  // Use image-content-aware positioning when image elements are available
  // This ensures perfect alignment with hotspot positions (same as spotlight effect)
  if (imageElement && containerElement) {
    const imageBounds = getActualImageVisibleBounds(imageElement, containerElement);
    if (imageBounds) {
      // Convert percentage to pixel position within image content area
      const imageContentX = (targetX / 100) * imageBounds.width;
      const imageContentY = (targetY / 100) * imageBounds.height;
      
      // Add image offset within container to get container-relative coordinates
      targetPixelX = imageBounds.x + imageContentX;
      targetPixelY = imageBounds.y + imageContentY;
    } else {
      // Fallback to container-relative positioning
      targetPixelX = (targetX / 100) * containerRect.width;
      targetPixelY = (targetY / 100) * containerRect.height;
    }
  } else {
    // Fallback to container-relative positioning when image elements not available
    targetPixelX = (targetX / 100) * containerRect.width;
    targetPixelY = (targetY / 100) * containerRect.height;
  }

  // Calculate the translation needed to center the target point in the viewport.
  // When an image is scaled by zoomLevel around its center (transform-origin: center center),
  // we need to translate it so that the scaled target coordinates align with the viewport center.
  // The formula is: viewportCenter - (targetPixel * zoomLevel)
  // This accounts for how the target coordinates scale when the image is zoomed.
  const translateX = containerRect.width / 2 - targetPixelX * zoomLevel;
  const translateY = containerRect.height / 2 - targetPixelY * zoomLevel;

  return {
    scale: zoomLevel,
    translateX,
    translateY,
    targetHotspotId: event.targetId,
  };
};

/**
 * Create CSS transform string from ImageTransformState
 */
export const transformToCSSString = (transform: ImageTransformState): string => {
  const { scale, translateX, translateY } = transform;
  return `translate(${translateX}px, ${translateY}px) scale(${scale})`;
};

/**
 * Check if two transforms are significantly different (for performance optimization)
 */
export const transformsAreDifferent = (
  a: ImageTransformState | undefined,
  b: ImageTransformState | undefined,
  threshold = 1
): boolean => {
  if (!a || !b) return true;
  
  return (
    Math.abs(a.scale - b.scale) > threshold * 0.01 ||
    Math.abs(a.translateX - b.translateX) > threshold ||
    Math.abs(a.translateY - b.translateY) > threshold
  );
};

/**
 * Reset transform to initial state
 */
export const createResetTransform = (): ImageTransformState => ({
  scale: 1,
  translateX: 0,
  translateY: 0,
  targetHotspotId: undefined,
});