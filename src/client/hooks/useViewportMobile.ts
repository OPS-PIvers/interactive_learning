import { useState, useEffect } from 'react';

/**
 * Hook for viewport-based responsive detection
 * Returns true when viewport width is below mobile threshold
 */
export const useViewportMobile = (threshold: number = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize with current window width
    if (typeof window !== 'undefined') {
      return window.innerWidth < threshold;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < threshold);
    };

    // Set initial value
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [threshold]);

  return isMobile;
};
