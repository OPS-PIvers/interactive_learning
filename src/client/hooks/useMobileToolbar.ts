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

  // Enhanced responsive breakpoint logic for better toolbar visibility
  const screenSize = useMemo(() => {
    if (viewportHeight < 400) return 'extraSmall';
    if (viewportHeight < 600) return 'verySmall'; // Expanded threshold from 500px to 600px
    return 'normal';
  }, [viewportHeight]);
  
  const isVerySmallScreen = screenSize !== 'normal';
  const isExtraSmallScreen = screenSize === 'extraSmall';

  // Calculate responsive dimensions with enhanced sizing for different screen sizes
  const dimensions = useMemo((): ToolbarDimensions => {
    // More aggressive size reduction for constrained viewports
    const toolbarHeight = isExtraSmallScreen ? 40 : isVerySmallScreen ? 44 : 56;
    const headerHeight = isExtraSmallScreen ? 44 : isVerySmallScreen ? 48 : 60;
    const timelineOffset = isTimelineVisible ? (isExtraSmallScreen ? 40 : isVerySmallScreen ? 50 : 64) : 0;
    
    // Add extra padding to ensure toolbar is never clipped
    const safePadding = isExtraSmallScreen ? 8 : 12;
    
    // Calculate available content height with more conservative approach
    const rawContentHeight = availableHeight 
      - headerHeight 
      - toolbarHeight 
      - timelineOffset 
      - safariUIHeight 
      - safePadding; // Extra safety margin
    
    // More aggressive minimum content height based on screen size
    const minContentHeight = isExtraSmallScreen ? 150 : 200;
    const contentHeight = Math.max(rawContentHeight, minContentHeight);
    
    // Ensure content doesn't exceed available space (preventing toolbar clipping)
    const maxAllowedContent = availableHeight - headerHeight - toolbarHeight - 20; // 20px safety buffer
    const finalContentHeight = Math.min(contentHeight, maxAllowedContent);

    return {
      toolbarHeight,
      headerHeight,
      contentHeight: finalContentHeight,
      isVerySmallScreen,
      timelineOffset
    };
  }, [screenSize, availableHeight, safariUIHeight, isTimelineVisible, isExtraSmallScreen, isVerySmallScreen]);

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

  // Generate CSS variables for synchronization with enhanced debugging info
  const cssVariables = useMemo(() => ({
    '--mobile-toolbar-height': `${dimensions.toolbarHeight}px`,
    '--mobile-header-height': `${dimensions.headerHeight}px`,
    '--mobile-content-height': `${dimensions.contentHeight}px`,
    '--mobile-timeline-offset': `${dimensions.timelineOffset}px`,
    '--mobile-very-small-screen': isVerySmallScreen ? '1' : '0',
    '--mobile-extra-small-screen': isExtraSmallScreen ? '1' : '0',
    '--mobile-screen-size': screenSize,
    '--mobile-safari-ui-offset': `${safariUIHeight}px`,
    '--mobile-available-height': `${availableHeight}px`,
    '--mobile-viewport-height': `${viewportHeight}px`
  }), [dimensions, isVerySmallScreen, isExtraSmallScreen, screenSize, safariUIHeight, availableHeight, viewportHeight]);

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
    isReady: isReady // Remove mobile dependency from isReady - let components handle mobile detection
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