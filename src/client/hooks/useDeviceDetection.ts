import { useState, useEffect, useMemo } from 'react';
import { DeviceType } from '../../shared/slideTypes';

/**
 * Hook for viewport information
 * Used for mathematical calculations only - NOT for conditional UI rendering
 * UI responsiveness should be handled with CSS breakpoints
 */
export const useDeviceDetection = () => {
  const [viewportInfo, setViewportInfo] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        pixelRatio: 1,
        orientation: 'landscape'
      };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    };
  });

  useEffect(() => {
    const updateViewportInfo = () => {
      setViewportInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      });
    };

    // Debounced resize handler
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateViewportInfo, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', updateViewportInfo);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', updateViewportInfo);
    };
  }, []);

  const deviceType: DeviceType = useMemo(() => {
    if (viewportInfo.width < 768) return 'mobile';
    if (viewportInfo.width < 1024) return 'tablet';
    return 'desktop';
  }, [viewportInfo.width]);

  return {
    viewportInfo,
    deviceType,
    // Orientation for calculations only
    isPortrait: viewportInfo.orientation === 'portrait',
    isLandscape: viewportInfo.orientation === 'landscape'
  };
};

/**
 * Get responsive position for calculations
 * Uses viewport width to determine appropriate responsive values
 */
export const getResponsivePosition = (
  responsivePosition: { desktop?: any; tablet?: any; mobile?: any },
  viewportWidth: number
) => {
  if (viewportWidth < 768) {
    return responsivePosition.mobile || responsivePosition.desktop || responsivePosition;
  } else if (viewportWidth < 1024) {
    return responsivePosition.tablet || responsivePosition.desktop || responsivePosition;
  } else {
    return responsivePosition.desktop || responsivePosition;
  }
};