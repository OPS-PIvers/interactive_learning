import { useState, useEffect, useCallback, useMemo } from 'react';
import { useViewportHeight, useIOSSafariViewport } from './useViewportHeight';
import { useIsMobile } from './useIsMobile';

interface ToolbarDimensions {
  toolbarHeight: number;
  headerHeight: number;
  contentHeight: number;
  isVerySmallScreen: boolean;
  timelineOffset: number;
}

interface ToolbarPositioning {
  bottom: string;
  zIndex: number;
  paddingBottom: string;
  transform: string;
}

interface MobileToolbarConfig {
  dimensions: ToolbarDimensions;
  positioning: ToolbarPositioning;
  cssVariables: Record<string, string>;
  isReady: boolean;
}

/**
 * Comprehensive mobile toolbar management hook
 * Integrates viewport detection, responsive sizing, and CSS variable synchronization
 */
export function useMobileToolbar(isTimelineVisible: boolean = false): MobileToolbarConfig {
  const isMobile = useIsMobile();
  const { 
    height: viewportHeight, 
    availableHeight, 
    isIOSSafariUIVisible, 
    safariUIHeight 
  } = useIOSSafariViewport();

  // Responsive breakpoint logic
  const isVerySmallScreen = useMemo(() => {
    return viewportHeight < 500;
  }, [viewportHeight]);

  // Calculate responsive dimensions
  const dimensions = useMemo((): ToolbarDimensions => {
    const toolbarHeight = isVerySmallScreen ? 44 : 56;
    const headerHeight = isVerySmallScreen ? 48 : 60;
    const timelineOffset = isTimelineVisible ? (isVerySmallScreen ? 50 : 64) : 0;
    
    // Calculate available content height accounting for all UI elements
    const contentHeight = availableHeight 
      - headerHeight 
      - toolbarHeight 
      - timelineOffset 
      - safariUIHeight;

    return {
      toolbarHeight,
      headerHeight,
      contentHeight: Math.max(contentHeight, 200), // Minimum content height
      isVerySmallScreen,
      timelineOffset
    };
  }, [isVerySmallScreen, availableHeight, safariUIHeight, isTimelineVisible]);

  // Calculate positioning based on current state
  const positioning = useMemo((): ToolbarPositioning => {
    const safeAreaBottom = 'env(safe-area-inset-bottom, 0px)';
    const baseBottom = dimensions.timelineOffset > 0 ? `${dimensions.timelineOffset}px` : '0px';
    
    return {
      bottom: baseBottom,
      zIndex: 999,
      paddingBottom: `calc(8px + ${safeAreaBottom})`,
      transform: isIOSSafariUIVisible ? `translateY(-${safariUIHeight}px)` : 'none'
    };
  }, [dimensions.timelineOffset, isIOSSafariUIVisible, safariUIHeight]);

  // Generate CSS variables for synchronization
  const cssVariables = useMemo(() => ({
    '--mobile-toolbar-height': `${dimensions.toolbarHeight}px`,
    '--mobile-header-height': `${dimensions.headerHeight}px`,
    '--mobile-content-height': `${dimensions.contentHeight}px`,
    '--mobile-timeline-offset': `${dimensions.timelineOffset}px`,
    '--mobile-very-small-screen': isVerySmallScreen ? '1' : '0',
    '--mobile-safari-ui-offset': `${safariUIHeight}px`,
    '--mobile-available-height': `${availableHeight}px`,
    '--mobile-viewport-height': `${viewportHeight}px`
  }), [dimensions, isVerySmallScreen, safariUIHeight, availableHeight, viewportHeight]);

  // Synchronize CSS variables with DOM
  const updateCSSVariables = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    Object.entries(cssVariables).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  }, [cssVariables]);

  // Update CSS variables when values change
  useEffect(() => {
    updateCSSVariables();
  }, [updateCSSVariables]);

  // Handle viewport changes with debounced updates
  useEffect(() => {
    const handleResize = () => {
      // Force recalculation on next frame
      requestAnimationFrame(updateCSSVariables);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }
    
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateCSSVariables]);

  const [isReady, setIsReady] = useState(false);

  // Mark as ready after initial setup
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return {
    dimensions,
    positioning,
    cssVariables,
    isReady: isReady && isMobile
  };
}

/**
 * Utility hook for components that need responsive toolbar spacing
 */
export function useToolbarSpacing(isTimelineVisible: boolean = false) {
  const { dimensions, cssVariables } = useMobileToolbar(isTimelineVisible);
  
  return {
    marginBottom: `calc(${dimensions.toolbarHeight}px + ${dimensions.timelineOffset}px + env(safe-area-inset-bottom, 0px))`,
    maxHeight: `calc(100dvh - ${dimensions.headerHeight}px - ${dimensions.toolbarHeight}px - ${dimensions.timelineOffset}px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))`,
    paddingBottom: `env(safe-area-inset-bottom, 0px)`,
    variables: cssVariables
  };
}

/**
 * Hook for content area calculations that account for all mobile UI elements
 */
export function useContentAreaHeight(isTimelineVisible: boolean = false) {
  const { dimensions } = useMobileToolbar(isTimelineVisible);
  
  return {
    contentHeight: dimensions.contentHeight,
    availableHeight: `${dimensions.contentHeight}px`,
    maxHeight: `calc(var(--mobile-content-height, ${dimensions.contentHeight}px) - 16px)` // Account for padding
  };
}