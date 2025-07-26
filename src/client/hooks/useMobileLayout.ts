import { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from './useIsMobile';
import { useDeviceDetection } from './useDeviceDetection';
import { getActualViewportHeight, getMobileSafeAreaInsets } from '../utils/mobileUtils';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface MobileLayoutConfig {
  viewport: {
    width: number;
    height: number;
    actualHeight: number;
  };
  safeArea: SafeAreaInsets;
  orientation: 'portrait' | 'landscape';
  layoutMode: 'compact' | 'standard' | 'expanded';
  scaleFactor: number;
  padding: {
    minimal: number;
    standard: number;
    expanded: number;
  };
}

/**
 * Unified Mobile Layout Hook
 * 
 * Centralizes mobile layout logic and provides consistent
 * configuration for mobile UI components based on architect recommendations.
 */
export const useMobileLayout = (): MobileLayoutConfig => {
  const isMobile = useIsMobile();
  const { viewportInfo } = useDeviceDetection();
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({ top: 0, bottom: 0, left: 0, right: 0 });
  
  // Calculate orientation
  const orientation = useMemo(() => {
    return viewportInfo.width > viewportInfo.height ? 'landscape' : 'portrait';
  }, [viewportInfo.width, viewportInfo.height]);
  
  // Update safe area insets
  useEffect(() => {
    if (!isMobile) {
      setSafeAreaInsets({ top: 0, bottom: 0, left: 0, right: 0 });
      return;
    }
    
    const updateSafeArea = () => {
      // Parse CSS safe area inset values
      const computedStyle = getComputedStyle(document.documentElement);
      const top = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0px') || 0;
      const bottom = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0px') || 0;
      const left = parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0px') || 0;
      const right = parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0px') || 0;
      
      setSafeAreaInsets({ top, bottom, left, right });
    };
    
    updateSafeArea();
    
    // Update on orientation change
    window.addEventListener('orientationchange', updateSafeArea);
    return () => window.removeEventListener('orientationchange', updateSafeArea);
  }, [isMobile]);
  
  // Calculate layout mode based on device characteristics
  const layoutMode = useMemo(() => {
    if (!isMobile) return 'expanded';
    
    const screenDensity = window.devicePixelRatio || 1;
    const screenSize = Math.min(viewportInfo.width, viewportInfo.height);
    
    // Compact mode for very small screens or high density displays
    if (screenSize < 360 || (screenDensity > 2 && screenSize < 400)) {
      return 'compact';
    }
    
    // Standard mode for typical mobile devices
    if (screenSize < 600) {
      return 'standard';
    }
    
    // Expanded mode for larger mobile devices/tablets
    return 'expanded';
  }, [isMobile, viewportInfo.width, viewportInfo.height]);
  
  // Calculate dynamic scale factor
  const scaleFactor = useMemo(() => {
    if (!isMobile) return 1;
    
    const baseWidth = 375; // iPhone X base width
    const currentWidth = Math.min(viewportInfo.width, viewportInfo.height); // Use smaller dimension
    const rawScale = currentWidth / baseWidth;
    
    // Constrain scale factor to reasonable bounds
    return Math.min(Math.max(rawScale, 0.8), 1.3);
  }, [isMobile, viewportInfo.width, viewportInfo.height]);
  
  // Calculate responsive padding based on layout mode and orientation
  const padding = useMemo(() => {
    const basePixelRatio = window.devicePixelRatio || 1;
    const densityMultiplier = Math.max(1, basePixelRatio / 2);
    
    switch (layoutMode) {
      case 'compact':
        return {
          minimal: Math.round(4 * densityMultiplier),
          standard: Math.round(8 * densityMultiplier),
          expanded: Math.round(12 * densityMultiplier)
        };
      case 'standard':
        return {
          minimal: Math.round(8 * densityMultiplier),
          standard: Math.round(16 * densityMultiplier),
          expanded: Math.round(24 * densityMultiplier)
        };
      case 'expanded':
        return {
          minimal: Math.round(16 * densityMultiplier),
          standard: Math.round(32 * densityMultiplier),
          expanded: Math.round(48 * densityMultiplier)
        };
      default:
        return { minimal: 8, standard: 16, expanded: 24 };
    }
  }, [layoutMode]);
  
  return {
    viewport: {
      width: viewportInfo.width,
      height: viewportInfo.height,
      actualHeight: getActualViewportHeight()
    },
    safeArea: safeAreaInsets,
    orientation,
    layoutMode,
    scaleFactor,
    padding
  };
};