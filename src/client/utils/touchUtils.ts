import { ImageTransformState } from '../../shared/types';

export const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
  return Math.hypot(
    touch1.clientX - touch2.clientX,
    touch1.clientY - touch2.clientY
  );
};

export const getTouchCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => ({
  x: (touch1.clientX + touch2.clientX) / 2,
  y: (touch1.clientY + touch2.clientY) / 2
});

export const getValidatedTransform = (
  transform: ImageTransformState,
  bounds: { minScale: number; maxScale: number }
): ImageTransformState => {
  const scale = Math.max(bounds.minScale, Math.min(bounds.maxScale, transform.scale));
  // Add constraints for translateX and translateY if necessary,
  // for example, to prevent panning outside of image boundaries.
  // For now, just validating scale.
  return {
    ...transform,
    scale,
  };
};

export const shouldPreventDefault = (
  e: TouchEvent,
  gestureType: 'pan' | 'zoom' | 'tap'
): boolean => {
  // Example logic:
  // Prevent default for zoom and pan to avoid page scroll/zoom.
  // Allow default for tap if it's not a double tap, to let normal click events proceed.
  if (gestureType === 'zoom' || gestureType === 'pan') {
    return true;
  }
  // For tap, you might have more complex logic, e.g., if it's part of a double tap sequence.
  // If it's a single tap that should behave like a click, you might not want to preventDefault.
  // This is a placeholder; specific logic will depend on how taps are handled.
  if (gestureType === 'tap' && e.touches.length === 1) {
    // Potentially allow default for single taps if they are not part of a specific gesture
    // being handled (like double-tap to zoom).
    return false; // Example: allow default for simple taps
  }
  return false;
};
