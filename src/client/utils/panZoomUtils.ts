// Unified pan and zoom calculation utilities
import { TimelineEventData, ImageTransformState, HotspotData } from '../../shared/types';
import { PREVIEW_DEFAULTS, INTERACTION_DEFAULTS } from '../constants/interactionConstants';
import { getActualImageVisibleBoundsRelative } from './imageBounds';

/**
 * Calculate pan and zoom transform to center a target point in the viewport
 * This works for both mobile and desktop by using image-content-aware positioning
 * for centering a scaled image with transform-origin: center center
 */
export const calculatePanZoomTransform = (
  event: TimelineEventData,
  containerRect: DOMRect,
  imageElement: HTMLImageElement | null = null,
  containerElement: HTMLElement | null = null,
  hotspots: HotspotData[] = []
): ImageTransformState => {
  // Step 1: Try to inherit coordinates from target hotspot first
  let targetX = event.targetX;
  let targetY = event.targetY;
  
  // If no explicit coordinates and we have a target hotspot, inherit from it
  if ((targetX === undefined || targetY === undefined) && event.targetId && hotspots.length > 0) {
    const targetHotspot = hotspots.find(h => h.id === event.targetId);
    
    console.log('[calculatePanZoomTransform] Hotspot lookup:', {
      targetId: event.targetId,
      hotspotFound: !!targetHotspot,
      availableHotspots: hotspots.map(h => ({ id: h.id, x: h.x, y: h.y })),
      currentCoords: { targetX, targetY }
    });
    
    if (targetHotspot) {
      // Only inherit if coordinates are actually missing
      targetX = targetX ?? targetHotspot.x;
      targetY = targetY ?? targetHotspot.y;
      console.log('[calculatePanZoomTransform] Inherited coordinates from hotspot:', {
        hotspotId: targetHotspot.id,
        hotspotCoords: { x: targetHotspot.x, y: targetHotspot.y },
        finalCoords: { targetX, targetY }
      });
    } else {
      console.warn('[calculatePanZoomTransform] Target hotspot not found:', {
        targetId: event.targetId,
        availableIds: hotspots.map(h => h.id)
      });
    }
  }
  
  // Step 2: Fall back to spotlight coordinates or defaults
  targetX = targetX ?? event.spotlightX ?? PREVIEW_DEFAULTS.TARGET_X;
  targetY = targetY ?? event.spotlightY ?? PREVIEW_DEFAULTS.TARGET_Y;
  const zoomLevel = event.zoomLevel ?? event.zoomFactor ?? event.zoom ?? INTERACTION_DEFAULTS.zoomFactor;
  
  // Step 3: Validate coordinates are within reasonable bounds
  if (targetX < 0 || targetX > 100 || targetY < 0 || targetY > 100) {
    console.warn('[calculatePanZoomTransform] Coordinates out of bounds, clamping:', {
      originalX: targetX,
      originalY: targetY,
      clampedX: Math.max(0, Math.min(100, targetX)),
      clampedY: Math.max(0, Math.min(100, targetY))
    });
    targetX = Math.max(0, Math.min(100, targetX));
    targetY = Math.max(0, Math.min(100, targetY));
  }
  
  // Reduced logging to prevent console spam
  if (process.env.NODE_ENV === 'development') {
    console.log('[calculatePanZoomTransform] Processing event:', {
      eventId: event.id,
      coords: { targetX, targetY },
      zoomLevel
    });
  }

  let targetPixelX: number;
  let targetPixelY: number;

  // Step 4: Calculate target pixel coordinates using container-relative coordinates
  // Use container-relative image bounds to match hotspot positioning system
  if (imageElement && containerElement) {
    const imageBounds = getActualImageVisibleBoundsRelative(imageElement, containerElement);
    
    // Reduced logging to prevent console spam
    
    if (imageBounds && imageBounds.width > 0 && imageBounds.height > 0) {
      // Convert percentage to pixel position within image content area (same as hotspots)
      const imageContentX = (targetX / 100) * imageBounds.width;
      const imageContentY = (targetY / 100) * imageBounds.height;
      
      // Add image offset within container to get final container-relative coordinates
      targetPixelX = imageBounds.x + imageContentX;
      targetPixelY = imageBounds.y + imageContentY;
      
      // Reduced logging to prevent console spam
    } else {
      // Fallback to container-relative positioning
      targetPixelX = (targetX / 100) * containerRect.width;
      targetPixelY = (targetY / 100) * containerRect.height;
      
      // Reduced logging to prevent console spam
    }
  } else {
    // Fallback to container-relative positioning when image elements not available
    targetPixelX = (targetX / 100) * containerRect.width;
    targetPixelY = (targetY / 100) * containerRect.height;
    
    // Reduced logging to prevent console spam
  }

  // Calculate the translation needed to center the target point in the viewport.
  // When an image is scaled by zoomLevel around its center (transform-origin: center center),
  // we need to translate it so that the scaled target coordinates align with the viewport center.
  // The formula is: viewportCenter - (targetPixel * zoomLevel)
  // This accounts for how the target coordinates scale when the image is zoomed.
  const translateX = containerRect.width / 2 - targetPixelX * zoomLevel;
  const translateY = containerRect.height / 2 - targetPixelY * zoomLevel;
  
  const result = {
    scale: zoomLevel,
    translateX,
    translateY,
    targetHotspotId: event.targetId,
  };
  
  // Reduced logging to prevent console spam

  return result;
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

/**
 * Calculates the transform (pan) coordinates needed to center a specific point of the image
 * in the container, given a target scale.
 *
 * @param hotspot - The target point on the image, with coordinates as percentages (0-1).
 * @param targetScale - The target zoom level.
 * @param imageNaturalDims - The original, unscaled dimensions of the image.
 * @param containerDims - The dimensions of the viewport/container.
 * @returns The {x, y} translation values for the CSS transform.
 */
export const calculateCenteringTransform = (
  hotspot: { x: number; y: number },
  targetScale: number,
  imageNaturalDims: { width: number; height: number },
  containerDims: { width: number; height: number }
): { x: number; y: number } => {
  if (!imageNaturalDims.width || !imageNaturalDims.height || !containerDims.width || !containerDims.height) {
    return { x: 0, y: 0 };
  }

  // 1. Calculate the hotspot's position in pixels on the original, unscaled image.
  const hotspotPixelX = hotspot.x * imageNaturalDims.width;
  const hotspotPixelY = hotspot.y * imageNaturalDims.height;

  // 2. Calculate the required translation (tx, ty) to center the hotspot.
  // The formula is: tx = (container_center) - (hotspot_position_at_target_scale)
  const tx = (containerDims.width / 2) - (hotspotPixelX * targetScale);
  const ty = (containerDims.height / 2) - (hotspotPixelY * targetScale);

  return { x: tx, y: ty };
};