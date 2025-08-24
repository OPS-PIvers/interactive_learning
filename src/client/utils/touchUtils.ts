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

/**
 * Haptic vibration patterns for touch feedback
 */
export const provideTouchFeedback = {
  /**
   * Light haptic feedback for subtle interactions (button taps, selection)
   */
  light: () => {
    // Only provide haptic feedback on mobile viewports
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch (error) {
        // Ignore vibration errors (user might have disabled it)
      }
    }
  },

  /**
   * Medium haptic feedback for moderate interactions (slide changes, confirmations)
   */
  medium: () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch (error) {
        // Ignore vibration errors
      }
    }
  },

  /**
   * Heavy haptic feedback for significant interactions (success, error, important actions)
   */
  heavy: () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([30, 10, 30]);
      } catch (error) {
        // Ignore vibration errors
      }
    }
  },

  /**
   * Double tap feedback pattern for confirmation actions
   */
  doubleTap: () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([15, 50, 15]);
      } catch (error) {
        // Ignore vibration errors
      }
    }
  }
};

/**
 * Visual touch feedback utilities for CSS class manipulation
 */
export const visualTouchFeedback = {
  /**
   * Add active touch state to element
   */
  addActiveState: (element: HTMLElement) => {
    element.classList.add('touch-active');
    // Auto-remove after animation duration
    setTimeout(() => {
      element.classList.remove('touch-active');
    }, 150);
  },

  /**
   * Add scale feedback to element
   */
  addScaleFeedback: (element: HTMLElement, scale: number = 0.95) => {
    const originalTransform = element.style.transform;
    element.style.transform = `scale(${scale})`;
    element.style.transition = 'transform 0.1s ease-out';

    setTimeout(() => {
      element.style.transform = originalTransform;
      setTimeout(() => {
        element.style.transition = '';
      }, 100);
    }, 100);
  },

  /**
   * Add ripple effect to element (for buttons and interactive elements)
   */
  addRippleEffect: (element: HTMLElement, event: React.TouchEvent | React.MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = (event as React.MouseEvent).clientX - rect.left - size / 2;
    const y = (event as React.MouseEvent).clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple 0.4s linear;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 400);
  }
};

/**
 * Combined touch interaction handler
 * Provides both haptic and visual feedback for interactive elements
 */
export const handleTouchInteraction = (
  element: HTMLElement,
  event: React.TouchEvent | React.MouseEvent,
  intensity: 'light' | 'medium' | 'heavy' = 'light'
) => {
  // Provide haptic feedback
  provideTouchFeedback[intensity]();

  // Add visual feedback based on event type
  if (event.type === 'touchend' || event.type === 'touchstart') {
    visualTouchFeedback.addActiveState(element);
  } else if (event.type === 'click') {
    // Add subtle visual feedback for mouse clicks on mobile viewports
    visualTouchFeedback.addScaleFeedback(element, 0.98);
  }
};

/**
 * Check if current device supports touch interactions
 */
export const isTouchDevice = (): boolean => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (('msMaxTouchPoints' in navigator) &&
      typeof (navigator as any).msMaxTouchPoints === 'number' &&
      (navigator as any).msMaxTouchPoints > 0)
  );
};

export default {
  provideTouchFeedback,
  visualTouchFeedback,
  handleTouchInteraction,
  isTouchDevice,
};
