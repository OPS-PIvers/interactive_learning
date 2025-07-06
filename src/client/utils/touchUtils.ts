import { ImageTransformState } from '../../shared/types';

export const getTouchDistance = (touch1: React.Touch, touch2: React.Touch): number => {
  return Math.hypot(
    touch1.clientX - touch2.clientX,
    touch1.clientY - touch2.clientY
  );
};

export const getTouchCenter = (touch1: React.Touch, touch2: React.Touch): { x: number; y: number } => ({
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
  // Check if the touch target is a hotspot or hotspot-related element
  const target = e.target as HTMLElement;
  const isHotspotElement = target?.closest('[data-hotspot-id]') || 
                          target?.hasAttribute('data-hotspot-id') ||
                          target?.closest('.hotspot-element') ||
                          target?.classList.contains('hotspot-element');

  // If touching a hotspot, don't prevent default to allow pointer events for dragging
  if (isHotspotElement) {
    return false;
  }

  // Prevent default for zoom and pan on non-hotspot areas to avoid page scroll/zoom
  if (gestureType === 'zoom' || gestureType === 'pan') {
    return true;
  }

  // For tap gestures, allow default for single taps on non-hotspot areas
  if (gestureType === 'tap' && e.touches.length === 1) {
    return false; // Allow default for simple taps
  }
  
  return false;
};
