// Placeholder for ImageTransformState until its final location is determined
// It's likely to be defined in a shared types file or within InteractiveModule.tsx
export interface ImageTransformState {
  scale: number;
  translateX: number;
  translateY: number;
  targetHotspotId?: string; // Optional: if the transform is targeting a specific hotspot
}

export const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
  return Math.hypot(
    touch1.clientX - touch2.clientX,
    touch1.clientY - touch2.clientY
  );
};

export const getTouchCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  };
};

export const getValidatedTransform = (
  transform: ImageTransformState,
  bounds: { minScale: number; maxScale: number }
): ImageTransformState => {
  // Validate and constrain transform values
  const newScale = Math.max(bounds.minScale, Math.min(bounds.maxScale, transform.scale));

  // Add constraints for translateX and translateY if necessary in the future
  // For now, just ensure they are numbers.
  const newTranslateX = typeof transform.translateX === 'number' && !isNaN(transform.translateX) ? transform.translateX : 0;
  const newTranslateY = typeof transform.translateY === 'number' && !isNaN(transform.translateY) ? transform.translateY : 0;


  return {
    ...transform,
    scale: newScale,
    translateX: newTranslateX,
    translateY: newTranslateY,
  };
};

export const shouldPreventDefault = (
  _e: TouchEvent, // underscore prefix to indicate it's not used yet
  _gestureType: 'pan' | 'zoom' | 'tap' // underscore prefix to indicate it's not used yet
): boolean => {
  // Determine when to prevent default touch behavior
  // Placeholder implementation: prevent default for zoom and pan, allow for tap
  // This will likely need more sophisticated logic based on context
  // For example, if a modal is open, or if the target element is interactive (e.g. a button inside the touch area)
  // if (gestureType === 'zoom' || gestureType === 'pan') {
  //   return true;
  // }
  // return false;

  // For now, let's start by preventing default for multi-touch gestures (potential zoom/pan)
  // and allowing default for single touch (potential tap/scroll).
  // The actual gesture detection logic in useTouchGestures will refine this.
  // if (e.touches.length > 1) {
  //   return true; // Likely a zoom or complex pan
  // }
  // This function might be more useful if it's called *after* a gesture is identified.
  // For now, returning false as the default behavior prevention will be handled more granularly
  // within the gesture handlers themselves.
  return false;
};
