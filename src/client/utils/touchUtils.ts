import { ImageTransformState } from '../../shared/types';

// Viewport bounds interface for transform validation
export interface ViewportBounds {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
}

// Constants for elastic boundary behavior
export const ELASTIC_MARGIN = 50; // pixels of allowed overflow
export const ELASTIC_RESISTANCE = 0.3; // reduce overflow movement by 70%
export const SPRING_BACK_DURATION = 300; // milliseconds for spring-back animation

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
  bounds: { minScale: number; maxScale: number },
  viewportBounds?: ViewportBounds
): ImageTransformState => {
  const scale = Math.max(bounds.minScale, Math.min(bounds.maxScale, transform.scale));
  
  let translateX = transform.translateX;
  let translateY = transform.translateY;
  
  // Apply viewport bounds constraints if provided
  if (viewportBounds) {
    const scaledContentWidth = viewportBounds.contentWidth * scale;
    const scaledContentHeight = viewportBounds.contentHeight * scale;
    
    // Calculate bounds for translation
    // If content is smaller than viewport, center it
    if (scaledContentWidth <= viewportBounds.width) {
      translateX = (viewportBounds.width - scaledContentWidth) / 2;
    } else {
      // Content is larger than viewport, allow panning with elastic margins
      const maxTranslateX = ELASTIC_MARGIN;
      const minTranslateX = viewportBounds.width - scaledContentWidth - ELASTIC_MARGIN;
      translateX = Math.max(minTranslateX, Math.min(maxTranslateX, translateX));
    }
    
    if (scaledContentHeight <= viewportBounds.height) {
      translateY = (viewportBounds.height - scaledContentHeight) / 2;
    } else {
      // Content is larger than viewport, allow panning with elastic margins
      const maxTranslateY = ELASTIC_MARGIN;
      const minTranslateY = viewportBounds.height - scaledContentHeight - ELASTIC_MARGIN;
      translateY = Math.max(minTranslateY, Math.min(maxTranslateY, translateY));
    }
  }
  
  return {
    scale,
    translateX,
    translateY,
  };
};

export const getSpringBackTransform = (
  transform: ImageTransformState,
  bounds: { minScale: number; maxScale: number },
  viewportBounds?: ViewportBounds
): ImageTransformState => {
  if (!viewportBounds) {
    return getValidatedTransform(transform, bounds);
  }
  
  const scale = Math.max(bounds.minScale, Math.min(bounds.maxScale, transform.scale));
  const scaledContentWidth = viewportBounds.contentWidth * scale;
  const scaledContentHeight = viewportBounds.contentHeight * scale;
  
  let translateX = transform.translateX;
  let translateY = transform.translateY;
  
  // Calculate hard bounds for spring-back (no elastic margin)
  if (scaledContentWidth <= viewportBounds.width) {
    translateX = (viewportBounds.width - scaledContentWidth) / 2;
  } else {
    const maxTranslateX = 0;
    const minTranslateX = viewportBounds.width - scaledContentWidth;
    translateX = Math.max(minTranslateX, Math.min(maxTranslateX, translateX));
  }
  
  if (scaledContentHeight <= viewportBounds.height) {
    translateY = (viewportBounds.height - scaledContentHeight) / 2;
  } else {
    const maxTranslateY = 0;
    const minTranslateY = viewportBounds.height - scaledContentHeight;
    translateY = Math.max(minTranslateY, Math.min(maxTranslateY, translateY));
  }
  
  return {
    scale,
    translateX,
    translateY,
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
