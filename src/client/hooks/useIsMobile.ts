import { useState, useEffect } from 'react';
import { isMobileDevice } from '../utils/mobileUtils';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(isMobileDevice());

  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = isMobileDevice();
      
      // Debug logging to help identify issues
      if (newIsMobile !== isMobile) {
        console.log('🔍 MOBILE DEBUG: Mobile detection changed', {
          oldValue: isMobile,
          newValue: newIsMobile,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
          },
          userAgent: navigator.userAgent,
          touchCapable: 'ontouchstart' in window,
          maxTouchPoints: navigator.maxTouchPoints,
          timestamp: Date.now()
        });
      }
      
      setIsMobile(newIsMobile);
    };

    // Debounce the resize handler to avoid performance issues from frequent re-renders.
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const debouncedCheckMobile = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        checkMobile();
      }, 200); // 200ms debounce delay
    };

    window.addEventListener('resize', debouncedCheckMobile);
    return () => {
      window.removeEventListener('resize', debouncedCheckMobile);
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [isMobile]); // Add isMobile to dependency array for debugging

  return isMobile;
};
