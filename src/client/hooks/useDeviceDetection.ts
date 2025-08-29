import { useState, useEffect } from 'react';
import { FixedPosition, ResponsivePosition } from '../../shared/slideTypes';

export const useDeviceDetection = () => {
  const [viewportInfo, setViewportInfo] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportInfo({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { viewportInfo };
};

/**
 * Get responsive position for calculations
 * Uses viewport width to determine appropriate responsive values
 */
export const getResponsivePosition = (
  responsivePosition: ResponsivePosition | FixedPosition,
  viewportWidth: number
): FixedPosition => {
  // If it's already a FixedPosition, return it directly
  if ('x' in responsivePosition && 'y' in responsivePosition) {
    return responsivePosition;
  }
  
  // It's a ResponsivePosition, get the appropriate breakpoint
  const rp = responsivePosition as ResponsivePosition;
  
  // Default fallback position if no breakpoints are defined
  const defaultPosition: FixedPosition = { x: 0, y: 0, width: 100, height: 100 };
  
  if (viewportWidth < 768) {
    return rp.mobile || rp.tablet || rp.desktop || defaultPosition;
  } else if (viewportWidth < 1024) {
    return rp.tablet || rp.desktop || defaultPosition;
  } else {
    return rp.desktop || defaultPosition;
  }
};