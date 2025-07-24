import { useState, useEffect } from 'react';
import { DeviceType, ViewportInfo } from '../../shared/slideTypes';

/**
 * Hook for detecting device type and viewport information
 * Used by slide system for responsive positioning
 */
export const useDeviceDetection = () => {
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        deviceType: 'desktop',
        pixelRatio: 1,
        orientation: 'landscape'
      };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      deviceType: getDeviceType(window.innerWidth),
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    };
  });

  useEffect(() => {
    const updateViewportInfo = () => {
      setViewportInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        deviceType: getDeviceType(window.innerWidth),
        pixelRatio: window.devicePixelRatio || 1,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
      });
    };

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
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

  return {
    deviceType: viewportInfo.deviceType,
    viewportInfo,
    isMobile: viewportInfo.deviceType === 'mobile',
    isTablet: viewportInfo.deviceType === 'tablet',
    isDesktop: viewportInfo.deviceType === 'desktop',
    isPortrait: viewportInfo.orientation === 'portrait',
    isLandscape: viewportInfo.orientation === 'landscape'
  };
};

/**
 * Determine device type based on viewport width
 */
function getDeviceType(width: number): DeviceType {
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

/**
 * Get responsive position based on device type
 */
export const getResponsivePosition = (
  responsivePosition: any,
  deviceType: DeviceType
) => {
  return responsivePosition[deviceType] || responsivePosition.desktop || responsivePosition;
};