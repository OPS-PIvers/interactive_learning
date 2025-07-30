import React, { useEffect, useState, useCallback } from 'react';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { isIOSSafari, getIOSSafariBottomUIState, getIOSSafariToolbarOffset } from '../../utils/mobileUtils';

interface UniversalMobileToolbarProps {
  children: React.ReactNode;
  isTimelineVisible?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Universal Mobile Toolbar - Provides consistent positioning across all mobile devices
 * 
 * Key features:
 * - iOS Safari compatible positioning with dynamic UI handling
 * - Adaptive z-index that exceeds iOS Safari's UI elements
 * - Safe area inset support for all device orientations
 * - Visual Viewport API integration for accurate positioning
 * - Fallback strategies for older devices
 */
export const UniversalMobileToolbar: React.FC<UniversalMobileToolbarProps> = ({
  children,
  isTimelineVisible = false,
  className = '',
  style = {}
}) => {
  const [isIOSSafariUIVisible, setIsIOSSafariUIVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: viewportHeight } = useViewportHeight();
  
  // Enhanced iOS Safari UI detection using utility functions
  const detectIOSSafariUI = useCallback(() => {
    if (!isIOSSafari()) return false;
    
    const bottomUIState = getIOSSafariBottomUIState();
    return bottomUIState.hasBottomUI;
  }, []);

  // Enhanced keyboard detection
  const detectKeyboard = useCallback(() => {
    if (!window.visualViewport) return 0;
    
    const windowHeight = window.innerHeight;
    const visualHeight = window.visualViewport.height;
    const keyboardThreshold = 150; // Minimum height to consider keyboard
    
    const calculatedHeight = Math.max(0, windowHeight - visualHeight);
    return calculatedHeight > keyboardThreshold ? calculatedHeight : 0;
  }, []);

  // Enhanced dynamic UI state monitoring with debouncing
  useEffect(() => {
    let updateTimeoutId: NodeJS.Timeout | null = null;
    
    const updateUIState = () => {
      setIsIOSSafariUIVisible(detectIOSSafariUI());
      setKeyboardHeight(detectKeyboard());
    };

    // Debounced update to prevent excessive state changes during animations
    const debouncedUpdateUIState = () => {
      if (updateTimeoutId) {
        clearTimeout(updateTimeoutId);
      }
      updateTimeoutId = setTimeout(updateUIState, 100); // 100ms debounce
    };

    // Immediate update for critical changes
    const immediateUpdateUIState = () => {
      if (updateTimeoutId) {
        clearTimeout(updateTimeoutId);
      }
      updateUIState();
    };

    // Initial check
    updateUIState();

    // Enhanced event monitoring for iOS Safari
    const debouncedEvents = ['resize', 'scroll'];
    const immediateEvents = ['orientationchange'];
    
    // Add debounced listeners for resize and scroll
    debouncedEvents.forEach(event => {
      window.addEventListener(event, debouncedUpdateUIState, { passive: true });
    });
    
    // Add immediate listeners for orientation changes
    immediateEvents.forEach(event => {
      window.addEventListener(event, immediateUpdateUIState);
    });

    // Enhanced Visual Viewport API monitoring for iOS Safari
    if (window.visualViewport) {
      // Debounced for resize (happens during URL bar show/hide)
      window.visualViewport.addEventListener('resize', debouncedUpdateUIState);
      
      // Immediate for scroll (can indicate URL bar state change)
      window.visualViewport.addEventListener('scroll', immediateUpdateUIState);
    }

    // Cleanup function
    return () => {
      if (updateTimeoutId) {
        clearTimeout(updateTimeoutId);
      }
      
      debouncedEvents.forEach(event => {
        window.removeEventListener(event, debouncedUpdateUIState);
      });
      
      immediateEvents.forEach(event => {
        window.removeEventListener(event, immediateUpdateUIState);
      });
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedUpdateUIState);
        window.visualViewport.removeEventListener('scroll', immediateUpdateUIState);
      }
    };
  }, [detectIOSSafariUI, detectKeyboard]);

  // Calculate adaptive positioning
  const getAdaptivePositioning = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      left: 0,
      right: 0,
      width: '100%',
      zIndex: 9999, // Higher than iOS Safari UI elements
      transition: 'bottom 0.2s ease-out, transform 0.2s ease-out',
    };

    // Get enhanced iOS Safari bottom UI state for detailed positioning
    const bottomUIState = getIOSSafariBottomUIState();
    
    // Calculate bottom offset
    let bottomOffset = 0;
    
    // Timeline offset
    if (isTimelineVisible) {
      bottomOffset += 64; // Timeline height
    }
    
    // Keyboard adjustment (takes priority over Safari UI)
    if (keyboardHeight > 0) {
      bottomOffset += keyboardHeight;
    } else if (isIOSSafariUIVisible && bottomUIState.hasBottomUI) {
      // Enhanced iOS Safari UI compensation
      bottomOffset += bottomUIState.recommendedOffset;
    }
    
    // Store debug info for development
    if (process.env.NODE_ENV === 'development') {
      (window as any).__toolbarDebug = {
        isIOSSafariUIVisible,
        keyboardHeight,
        bottomUIState,
        finalBottomOffset: bottomOffset,
        viewportHeight,
        timestamp: Date.now()
      };
    }

    return {
      ...baseStyles,
      bottom: bottomOffset,
      paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
      paddingLeft: 'max(8px, env(safe-area-inset-left, 0px))',
      paddingRight: 'max(8px, env(safe-area-inset-right, 0px))',
    };
  };

  // Enhanced backdrop for better visibility
  const getBackdropStyles = (): React.CSSProperties => ({
    background: 'rgba(30, 41, 59, 0.95)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderTop: '1px solid rgba(51, 65, 85, 0.8)',
    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
  });

  const toolbarStyles = {
    ...getAdaptivePositioning(),
    ...getBackdropStyles(),
    ...style,
  };

  const combinedClassName = `universal-mobile-toolbar ${className}`.trim();

  return (
    <div 
      className={combinedClassName}
      style={toolbarStyles}
      role="toolbar"
      aria-label="Mobile toolbar"
    >
      {children}
      
      {/* Enhanced debug info in development */}
      {process.env.NODE_ENV === 'development' && (() => {
        const bottomUIState = getIOSSafariBottomUIState();
        return (
          <div 
            style={{
              position: 'absolute',
              top: '-80px',
              left: '8px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              fontSize: '9px',
              padding: '6px 8px',
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 10000,
              maxWidth: '300px',
              lineHeight: '1.2',
            }}
          >
            <div>iOS UI: {isIOSSafariUIVisible ? 'Y' : 'N'} | KB: {keyboardHeight}px | VH: {viewportHeight}px</div>
            <div>Bottom UI: {bottomUIState.hasBottomUI ? 'Y' : 'N'} | URL Bar: {bottomUIState.hasBottomURLBar ? 'Y' : 'N'}</div>
            <div>Offset: {bottomUIState.recommendedOffset}px | Reduction: {bottomUIState.viewportReduction}px</div>
          </div>
        );
      })()}
    </div>
  );
};

export default UniversalMobileToolbar;