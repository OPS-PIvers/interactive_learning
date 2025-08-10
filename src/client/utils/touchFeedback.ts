/**
 * Touch Feedback Utility
 * 
 * Provides haptic feedback and visual touch responses for mobile devices.
 * Uses minimal viewport detection for interaction patterns only (not UI rendering).
 */

/**
 * Haptic vibration patterns for touch feedback
 */
export const provideTouchFeedback = {
  /**
   * Light haptic feedback for subtle interactions (button taps, selection)
   */
  light: () => {
    // Only provide haptic feedback on mobile viewports
    if ('vibrate' in navigator && window.innerWidth <= 768) {
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
    if ('vibrate' in navigator && window.innerWidth <= 768) {
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
    if ('vibrate' in navigator && window.innerWidth <= 768) {
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
    if ('vibrate' in navigator && window.innerWidth <= 768) {
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
    if (window.innerWidth <= 768) {
      visualTouchFeedback.addScaleFeedback(element, 0.98);
    }
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

/**
 * Check if current viewport is mobile-sized (for touch interaction patterns only)
 * NOTE: This is for interaction logic only, NOT for UI rendering
 */
export const isMobileViewport = (): boolean => {
  return window.innerWidth <= 768;
};

export default {
  provideTouchFeedback,
  visualTouchFeedback,
  handleTouchInteraction,
  isTouchDevice,
  isMobileViewport
};