import React, { useState, useEffect, useCallback } from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';

export interface ViewportState {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  devicePixelRatio: number;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface MobileViewportConfig {
  minScale?: number;
  maxScale?: number;
  portraitPadding?: number;
  landscapePadding?: number;
  aspectRatio?: string;
  enableAutoScale?: boolean;
}

export interface MobileViewportManagerProps {
  children: React.ReactNode;
  config?: MobileViewportConfig;
  className?: string;
  onViewportChange?: (viewport: ViewportState) => void;
  onScaleChange?: (scale: number) => void;
}

/**
 * MobileViewportManager - Handles responsive scaling and viewport management
 * 
 * Automatically scales content to fit mobile screens optimally in both
 * portrait and landscape orientations
 */
export const MobileViewportManager: React.FC<MobileViewportManagerProps> = ({
  children,
  config = {},
  className = '',
  onViewportChange,
  onScaleChange
}) => {
  const {
    minScale = 0.3,
    maxScale = 1.0,
    portraitPadding = 16,
    landscapePadding = 8,
    aspectRatio = '16:9',
    enableAutoScale = true
  } = config;

  const { isMobile } = useDeviceDetection();
  const [viewport, setViewport] = useState<ViewportState>({
    width: window.innerWidth,
    height: window.innerHeight,
    isLandscape: window.innerWidth > window.innerHeight,
    isPortrait: window.innerHeight > window.innerWidth,
    devicePixelRatio: window.devicePixelRatio || 1,
    safeAreaInsets: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  });

  const [optimalScale, setOptimalScale] = useState(1);

  // Parse aspect ratio
  const parseAspectRatio = useCallback((ratio: string) => {
    const parts = ratio.split(':');
    if (parts.length === 2) {
      const width = parseFloat(parts[0]);
      const height = parseFloat(parts[1]);
      return width / height;
    }
    return 16 / 9; // Default to 16:9
  }, []);

  // Calculate optimal scale for mobile
  const calculateOptimalScale = useCallback((viewportState: ViewportState) => {
    if (!isMobile || !enableAutoScale) return 1;

    const targetAspectRatio = parseAspectRatio(aspectRatio);
    const padding = viewportState.isLandscape ? landscapePadding : portraitPadding;
    
    // Available space after padding and safe areas
    const availableWidth = viewportState.width - (padding * 2) - viewportState.safeAreaInsets.left - viewportState.safeAreaInsets.right;
    const availableHeight = viewportState.height - (padding * 2) - viewportState.safeAreaInsets.top - viewportState.safeAreaInsets.bottom;

    // Calculate scale to fit content
    let scale = 1;
    
    if (viewportState.isPortrait) {
      // In portrait, fit to width and allow vertical scrolling if needed
      const targetWidth = Math.min(availableWidth, 800); // Max width for readability
      scale = targetWidth / 800; // Assuming 800px base width
    } else {
      // In landscape, fit to available space while maintaining aspect ratio
      const targetHeight = availableHeight;
      const targetWidth = targetHeight * targetAspectRatio;
      
      if (targetWidth <= availableWidth) {
        // Fit by height
        scale = targetHeight / 450; // Assuming 450px base height for 16:9
      } else {
        // Fit by width
        scale = availableWidth / 800; // Assuming 800px base width
      }
    }

    // Constrain scale within limits
    return Math.max(minScale, Math.min(maxScale, scale));
  }, [isMobile, enableAutoScale, parseAspectRatio, aspectRatio, landscapePadding, portraitPadding, minScale, maxScale]);

  // Get safe area insets (for devices with notches, etc.)
  const getSafeAreaInsets = useCallback(() => {
    const style = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10)
    };
  }, []);

  // Update viewport state
  const updateViewport = useCallback(() => {
    const newViewport: ViewportState = {
      width: window.innerWidth,
      height: window.innerHeight,
      isLandscape: window.innerWidth > window.innerHeight,
      isPortrait: window.innerHeight > window.innerWidth,
      devicePixelRatio: window.devicePixelRatio || 1,
      safeAreaInsets: getSafeAreaInsets()
    };

    setViewport(newViewport);
    onViewportChange?.(newViewport);

    // Calculate and set optimal scale
    const newScale = calculateOptimalScale(newViewport);
    setOptimalScale(newScale);
    onScaleChange?.(newScale);
  }, [getSafeAreaInsets, onViewportChange, calculateOptimalScale, onScaleChange]);

  // Handle orientation change and resize
  useEffect(() => {
    updateViewport();

    const handleResize = () => {
      // Debounce resize events
      setTimeout(updateViewport, 100);
    };

    const handleOrientationChange = () => {
      // Orientation change needs a longer delay
      setTimeout(updateViewport, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Also listen for viewport meta tag changes
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateViewport, 50);
    });
    
    if (document.documentElement) {
      resizeObserver.observe(document.documentElement);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      resizeObserver.disconnect();
    };
  }, [updateViewport]);

  // Set CSS custom properties for viewport info with iOS Safari support
  useEffect(() => {
    const root = document.documentElement;
    
    // Basic viewport properties
    root.style.setProperty('--viewport-width', `${viewport.width}px`);
    root.style.setProperty('--viewport-height', `${viewport.height}px`);
    root.style.setProperty('--optimal-scale', `${optimalScale}`);
    root.style.setProperty('--is-landscape', viewport.isLandscape ? '1' : '0');
    root.style.setProperty('--is-portrait', viewport.isPortrait ? '1' : '0');
    
    // Safe area properties
    root.style.setProperty('--safe-area-inset-top', `${viewport.safeAreaInsets.top}px`);
    root.style.setProperty('--safe-area-inset-bottom', `${viewport.safeAreaInsets.bottom}px`);
    root.style.setProperty('--safe-area-inset-left', `${viewport.safeAreaInsets.left}px`);
    root.style.setProperty('--safe-area-inset-right', `${viewport.safeAreaInsets.right}px`);
    
    // Dynamic viewport height support for iOS Safari
    const vh = viewport.height * 0.01;
    root.style.setProperty('--vh', `${vh}px`);
    
    // Check for visual viewport (iOS Safari support)
    if (window.visualViewport) {
      const visualVh = window.visualViewport.height * 0.01;
      root.style.setProperty('--visual-vh', `${visualVh}px`);
      
      // Available height excluding iOS Safari UI
      const availableHeight = Math.min(viewport.height, window.visualViewport.height);
      const availableVh = availableHeight * 0.01;
      root.style.setProperty('--available-vh', `${availableVh}px`);
    }
    
    // Dynamic viewport units fallback for unsupported browsers
    if (!CSS.supports('height', '100dvh')) {
      root.style.setProperty('--dvh', `${vh}px`);
      root.style.setProperty('--svh', `${vh}px`);
      root.style.setProperty('--lvh', `${window.innerHeight * 0.01}px`);
    }
  }, [viewport, optimalScale]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    // Apply safe area padding
    paddingTop: viewport.safeAreaInsets.top,
    paddingBottom: viewport.safeAreaInsets.bottom,
    paddingLeft: viewport.safeAreaInsets.left,
    paddingRight: viewport.safeAreaInsets.right,
    // iOS Safari viewport fixes
    minHeight: '-webkit-fill-available',
    maxHeight: '100dvh',
    // Ensure proper containment
    boxSizing: 'border-box'
  };

  const contentStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    padding: viewport.isLandscape ? landscapePadding : portraitPadding,
    transform: enableAutoScale ? `scale(${optimalScale})` : undefined,
    transformOrigin: 'top left',
    transition: 'transform 0.3s ease-out',
    // iOS Safari content adjustments
    maxHeight: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box'
  };

  return (
    <div className={`mobile-viewport-manager ${className}`} style={containerStyle}>
      <div className="mobile-viewport-content" style={contentStyle}>
        {children}
      </div>
      
      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 right-0 bg-black/80 text-white text-xs p-2 z-50 font-mono">
          <div>Viewport: {viewport.width}×{viewport.height}</div>
          <div>Orientation: {viewport.isLandscape ? 'Landscape' : 'Portrait'}</div>
          <div>Scale: {optimalScale.toFixed(2)}</div>
          <div>DPR: {viewport.devicePixelRatio}</div>
          <div>Safe: {viewport.safeAreaInsets.top},{viewport.safeAreaInsets.right},{viewport.safeAreaInsets.bottom},{viewport.safeAreaInsets.left}</div>
        </div>
      )}
    </div>
  );
};

export default MobileViewportManager;