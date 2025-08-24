/**
 * Unified Viewport Utilities
 * 
 * Provides responsive viewport management without device-specific branching.
 * Uses progressive enhancement with modern web APIs that work across all devices.
 */

/**
 * Get the actual viewport height accounting for browser UI changes
 * Works on all devices using Visual Viewport API with fallbacks
 */
export const getActualViewportHeight = (): number => {
  // Use Visual Viewport API when available (modern browsers)
  if (window?.visualViewport) {
    const viewportHeight = window.visualViewport.height;
    if (viewportHeight && viewportHeight > 0) {
      return viewportHeight;
    }
  }
  
  // Fallback to window.innerHeight with validation
  const windowHeight = window?.innerHeight || document?.documentElement?.clientHeight || 0;
  return Math.max(windowHeight, window?.screen?.height || 600);
};

/**
 * Get keyboard height by comparing window height with visual viewport height
 * Works across all devices that have virtual keyboards
 */
export const getKeyboardHeight = (): number => {
  const windowHeight = window?.innerHeight || 0;
  const visualViewportHeight = window?.visualViewport?.height || windowHeight;
  
  return Math.max(0, windowHeight - visualViewportHeight);
};

/**
 * Detect if virtual keyboard is visible
 * Uses threshold to avoid false positives from browser UI changes
 */
export const isKeyboardVisible = (): boolean => {
  return getKeyboardHeight() > 100; // Threshold to avoid false positives
};

/**
 * Set CSS custom properties for dynamic viewport height
 * Works on all devices, automatically handles browser UI changes
 */
export const setDynamicViewportProperties = (): (() => void) => {
  const updateViewport = () => {
    try {
      const actualHeight = getActualViewportHeight();
      const actualWidth = window?.innerWidth || 0;
      
      if (actualHeight > 0 && actualWidth > 0) {
        // Set CSS custom properties for responsive use
        const vh = actualHeight * 0.01;
        const vw = actualWidth * 0.01;
        
        document.documentElement?.style.setProperty('--vh', `${vh}px`);
        document.documentElement?.style.setProperty('--vw', `${vw}px`);
        document.documentElement?.style.setProperty('--actual-vh', `${actualHeight}px`);
        document.documentElement?.style.setProperty('--actual-vw', `${actualWidth}px`);
      }
    } catch (error) {
      console.warn('Failed to update viewport properties:', error);
      // Fallback to basic calculation
      const vh = (window?.innerHeight || 0) * 0.01;
      const vw = (window?.innerWidth || 0) * 0.01;
      document.documentElement?.style.setProperty('--vh', `${vh}px`);
      document.documentElement?.style.setProperty('--vw', `${vw}px`);
    }
  };

  updateViewport(); // Set initial values

  // Use throttling to avoid excessive updates
  let timeout: ReturnType<typeof setTimeout>;
  const throttledUpdate = () => {
    clearTimeout(timeout);
    timeout = setTimeout(updateViewport, 100);
  };

  // Listen to all relevant viewport change events
  window.addEventListener('resize', throttledUpdate);
  window.addEventListener('orientationchange', throttledUpdate);
  
  // Listen to visual viewport changes (modern browsers)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', throttledUpdate);
  }

  // Return cleanup function
  return () => {
    clearTimeout(timeout);
    window.removeEventListener('resize', throttledUpdate);
    window.removeEventListener('orientationchange', throttledUpdate);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', throttledUpdate);
    }
  };
};

/**
 * Get safe area insets using CSS env() variables
 * Works on all devices that support safe areas (iOS, Android with display cutouts, etc.)
 */
export const getSafeAreaInsets = () => {
  return {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)'
  };
};

/**
 * Lock screen orientation.
 * This is an async operation and might not succeed if the user has disabled it.
 */
export async function lockOrientation(orientation: 'portrait' | 'landscape'): Promise<void> {
    try {
        if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock(orientation);
        }
    } catch (error) {
        console.warn(`Could not lock orientation to ${orientation}:`, error);
    }
}

/**
 * Unlock screen orientation.
 */
export function unlockOrientation(): void {
    try {
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    } catch (error) {
        console.warn('Could not unlock orientation:', error);
    }
}

/**
 * Request to enter fullscreen mode.
 */
export function enterFullscreen(element: HTMLElement = document.documentElement): void {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if ((element as any).mozRequestFullScreen) { /* Firefox */
        (element as any).mozRequestFullScreen();
    } else if ((element as any).webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) { /* IE/Edge */
        (element as any).msRequestFullscreen();
    }
}

/**
 * Exit fullscreen mode.
 */
export function exitFullscreen(): void {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if ((document as any).mozCancelFullScreen) { /* Firefox */
        (document as any).mozCancelFullScreen();
    } else if ((document as any).webkitExitFullscreen) { /* Chrome, Safari and Opera */
        (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) { /* IE/Edge */
        (document as any).msExitFullscreen();
    }
}