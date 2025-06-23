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
  isMobile: boolean, // May influence logic in the future, currently not directly used in getPixelPosition
  // imageElement and containerElement from the spec might be better passed directly to functions if they change
  // or use refs if they are stable. For getPixelPosition, we need specific data like natural/rendered dimensions.
) => {
  const getPixelPosition = useCallback(
    (
      hotspot: HotspotData,
      currentImageTransform: ImageTransformState,
      imageNaturalDimensions: { width: number; height: number } | null,
      renderedImageRect: DOMRect | null // The getBoundingClientRect() of the actual image display area
    ): { x: number; y: number } | null => {
      if (!imageNaturalDimensions || !renderedImageRect) {
        // Not enough information to calculate pixel position accurately
        // Return null or a default? Null seems safer to indicate unavailability.
        return null;
      }

      // 1. Calculate base pixel position on the *natural* (unscaled, untransformed) image
      // Hotspot x, y are percentages of the natural image dimensions.
      const basePixelX = (hotspot.x / 100) * imageNaturalDimensions.width;
      const basePixelY = (hotspot.y / 100) * imageNaturalDimensions.height;

      // 2. Account for how the natural image is fitted into the rendered image area
      // This depends on the equivalent of 'background-size' (e.g., contain, cover)
      // and the aspect ratios.
      // For simplicity, assuming the renderedImageRect *is* the scaled natural image content area.
      // If using `object-fit` or `background-size`, this part would be more complex.
      // Let's assume renderedImageRect.width and renderedImageRect.height are the
      // dimensions of the image content itself, after aspect ratio adjustments.

      const naturalAspect = imageNaturalDimensions.width / imageNaturalDimensions.height;
      const renderedAspect = renderedImageRect.width / renderedImageRect.height;

      let contentRenderedWidth = renderedImageRect.width;
      let contentRenderedHeight = renderedImageRect.height;
      let contentOffsetX = 0; // Offset of the image content within the renderedImageRect (e.g., if letterboxed)
      let contentOffsetY = 0;

      // This logic assumes 'contain' like behavior.
      // If image is displayed with object-fit: contain or background-size: contain
      if (naturalAspect > renderedAspect) { // Image is wider than container, so it's constrained by width
        contentRenderedHeight = renderedImageRect.width / naturalAspect;
        contentOffsetY = (renderedImageRect.height - contentRenderedHeight) / 2;
      } else { // Image is taller or same aspect, constrained by height
        contentRenderedWidth = renderedImageRect.height * naturalAspect;
        contentOffsetX = (renderedImageRect.width - contentRenderedWidth) / 2;
      }

      // Scale factor of the natural image to its rendered size (within the container)
      const renderScaleX = contentRenderedWidth / imageNaturalDimensions.width;
      const renderScaleY = contentRenderedHeight / imageNaturalDimensions.height;

      // Position of the hotspot on the visibly rendered (but not yet transformed by ImageTransformState) image
      let visiblePixelX = basePixelX * renderScaleX + contentOffsetX;
      let visiblePixelY = basePixelY * renderScaleY + contentOffsetY;

      // 3. Apply the dynamic imageTransform (pan/zoom)
      // The `currentImageTransform.translateX/Y` are usually applied to the container
      // that holds the image, and `scale` is applied with `transform-origin: center` (typically).

      // If transform-origin is top-left of the renderedImageRect for the scale:
      // let transformedX = visiblePixelX * currentImageTransform.scale + currentImageTransform.translateX;
      // let transformedY = visiblePixelY * currentImageTransform.scale + currentImageTransform.translateY;

      // If transform-origin is center of the renderedImageRect for the scale:
      const centerX = renderedImageRect.width / 2;
      const centerY = renderedImageRect.height / 2;

      let transformedX =
        (visiblePixelX - centerX) * currentImageTransform.scale +
        centerX +
        currentImageTransform.translateX;
      let transformedY =
        (visiblePixelY - centerY) * currentImageTransform.scale +
        centerY +
        currentImageTransform.translateY;

      // The result should be pixel coordinates relative to the top-left of the `renderedImageRect`'s parent
      // or whatever element the hotspots are absolutely positioned within.
      // If hotspots are children of the element whose rect is `renderedImageRect`, then this is correct.

      return {
        x: transformedX,
        y: transformedY,
      };
    },
    [] // isMobile could be a dependency if it changes logic, but currently it doesn't.
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
