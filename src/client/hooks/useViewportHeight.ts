import { useState, useEffect, useCallback } from 'react';

// Enhanced viewport height detection for iOS Safari
function getViewportHeight() {
  // Prefer visualViewport for mobile browsers (especially iOS Safari)
  if (window.visualViewport) {
    return window.visualViewport.height;
  }
  
  // Fallback to window.innerHeight
  return window.innerHeight;
}

// Get available height accounting for iOS Safari UI
function getAvailableHeight() {
  const viewportHeight = getViewportHeight();
  const windowHeight = window.innerHeight;
  
  // If visualViewport is smaller than window.innerHeight, 
  // it likely means iOS Safari UI is visible
  return Math.min(viewportHeight, windowHeight);
}

// Set CSS custom properties for dynamic viewport units
function updateViewportCustomProperties() {
  const vh = getViewportHeight() * 0.01;
  const availableVh = getAvailableHeight() * 0.01;
  
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  document.documentElement.style.setProperty('--available-vh', `${availableVh}px`);
  
  // Support for dynamic viewport units fallback
  if (!CSS.supports('height', '100dvh')) {
    document.documentElement.style.setProperty('--dvh', `${vh}px`);
    document.documentElement.style.setProperty('--svh', `${vh}px`);
    document.documentElement.style.setProperty('--lvh', `${window.innerHeight * 0.01}px`);
  }
}

export function useViewportHeight() {
  const [height, setHeight] = useState(getViewportHeight());
  const [availableHeight, setAvailableHeight] = useState(getAvailableHeight());

  const handleResize = useCallback(() => {
    const newHeight = getViewportHeight();
    const newAvailableHeight = getAvailableHeight();
    
    setHeight(newHeight);
    setAvailableHeight(newAvailableHeight);
    updateViewportCustomProperties();
  }, []);

  useEffect(() => {
    // Initial setup
    updateViewportCustomProperties();
    
    let cleanup: (() => void) | null = null;

    if (window.visualViewport) {
      // Use visualViewport for better mobile support
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      cleanup = () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
        window.visualViewport?.removeEventListener('scroll', handleResize);
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize);
      cleanup = () => window.removeEventListener('resize', handleResize);
    }

    // Also listen for orientation changes on mobile
    const handleOrientationChange = () => {
      // Delay to allow for UI to settle after orientation change
      setTimeout(handleResize, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      cleanup?.();
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [handleResize]);

  return {
    height,
    availableHeight,
    // Utility methods
    isReducedHeight: height < availableHeight,
    heightDifference: availableHeight - height
  };
}

// Utility hook for components that need to be aware of iOS Safari UI interference
export function useIOSSafariViewport() {
  const { height, availableHeight, isReducedHeight } = useViewportHeight();
  
  return {
    viewportHeight: height,
    availableHeight,
    isIOSSafariUIVisible: isReducedHeight,
    safariUIHeight: isReducedHeight ? availableHeight - height : 0,
    // CSS values for dynamic height
    dynamicHeight: `${height}px`,
    availableDynamicHeight: `${availableHeight}px`
  };
}
