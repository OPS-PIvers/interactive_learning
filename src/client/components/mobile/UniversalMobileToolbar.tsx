import React, { useEffect, useState, useCallback } from 'react';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { isIOSSafari, getIOSSafariUIState, getIOSSafariToolbarOffset } from '../../utils/mobileUtils';

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
    
    const uiState = getIOSSafariUIState();
    return uiState.isUIVisible;
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

  // Dynamic UI state monitoring
  useEffect(() => {
    const updateUIState = () => {
      setIsIOSSafariUIVisible(detectIOSSafariUI());
      setKeyboardHeight(detectKeyboard());
    };

    // Initial check
    updateUIState();

    // Monitor viewport changes
    const events = ['resize', 'orientationchange', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, updateUIState);
    });

    // Monitor visual viewport changes (iOS Safari specific)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateUIState);
      window.visualViewport.addEventListener('scroll', updateUIState);
    }

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateUIState);
      });
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateUIState);
        window.visualViewport.removeEventListener('scroll', updateUIState);
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

    // Calculate bottom offset
    let bottomOffset = 0;
    
    // Timeline offset
    if (isTimelineVisible) {
      bottomOffset += 64; // Timeline height
    }
    
    // Keyboard adjustment
    if (keyboardHeight > 0) {
      bottomOffset += keyboardHeight;
    }
    
    // iOS Safari UI compensation using enhanced detection
    if (isIOSSafariUIVisible && !keyboardHeight) {
      // Use the enhanced iOS Safari toolbar offset calculation
      bottomOffset += getIOSSafariToolbarOffset();
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
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'absolute',
            top: '-60px',
            left: '8px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            fontSize: '10px',
            padding: '4px 8px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 10000,
          }}
        >
          iOS UI: {isIOSSafariUIVisible ? 'Y' : 'N'} | 
          KB: {keyboardHeight}px | 
          VH: {viewportHeight}px |
          Timeline: {isTimelineVisible ? 'Y' : 'N'}
        </div>
      )}
    </div>
  );
};

export default UniversalMobileToolbar;