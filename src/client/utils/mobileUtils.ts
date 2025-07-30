const MOBILE_MAX_WIDTH = 768;
export const isMobileDevice = () => {
  // Primary check: viewport width (most reliable indicator)
  const isNarrowViewport = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches : false;
  
  // For wider viewports, check if it's actually a mobile device
  // using user agent and additional device characteristics
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUserAgent = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
  
  // Check for tablet-specific patterns (iPads in desktop mode, etc.)
  const isTablet = /ipad|tablet|kindle|silk|playbook/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  const result = isNarrowViewport || isMobileUserAgent || isTablet;
  
  // Debug logging only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 MOBILE DETECTION:', {
      result,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      isNarrowViewport,
      isMobileUserAgent,
      isTablet,
      userAgent: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
      timestamp: new Date().toISOString()
    });
  }
  
  return result;
};

export const getMobileViewportHeight = () => {
  // Handle mobile viewport quirks - use Visual Viewport API when available
  if (window.visualViewport) {
    return window.visualViewport.height;
  }
  // Fallback to traditional methods with better mobile support
  return window.innerHeight || document.documentElement.clientHeight || window.screen.height;
};

export const getActualViewportHeight = () => {
  // Get the actual viewport height accounting for mobile browser UI
  const visualViewport = window.visualViewport;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.clientHeight;
  
  // On mobile, prefer visualViewport when available as it accounts for
  // dynamic toolbar height changes
  if (visualViewport && isMobileDevice()) {
    // Ensure we have a valid height value
    const viewportHeight = visualViewport.height;
    if (viewportHeight > 0) {
      return viewportHeight;
    }
  }
  
  // For iOS Safari, use the smaller of window.innerHeight and screen.height
  // to account for the dynamic toolbar
  if (isIOS() && isSafari()) {
    const screenHeight = window.screen.height;
    if (screenHeight > 0) {
      return Math.min(windowHeight, screenHeight);
    }
  }
  
  // Fallback with validation
  return Math.max(windowHeight || 0, documentHeight || 0) || window.screen.height || 600;
};

export const getKeyboardHeight = () => {
  // Calculate keyboard height by comparing window height with visual viewport height
  const windowHeight = window.innerHeight;
  const visualViewportHeight = window.visualViewport?.height || windowHeight;
  
  return Math.max(0, windowHeight - visualViewportHeight);
};

export const isKeyboardVisible = () => {
  // Detect if virtual keyboard is visible
  return getKeyboardHeight() > 100; // Threshold to avoid false positives
};

export const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isIOSSafari = () => isIOS() && isSafari();

export const getIOSSafariUIState = () => {
  if (!isIOSSafari()) {
    return {
      isUIVisible: false,
      uiHeight: 0,
      dynamicUIHeight: 0,
      isStandalone: false,
      bottomUIHeight: 0,
      topUIHeight: 0,
      hasBottomURLBar: false
    };
  }

  const windowHeight = window.innerHeight;
  const screenHeight = window.screen.height;
  const visualViewportHeight = window.visualViewport?.height || windowHeight;
  
  // Check if running as PWA/standalone app
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
  
  // Calculate UI heights
  const totalUIHeight = screenHeight - windowHeight;
  const dynamicUIHeight = windowHeight - visualViewportHeight;
  const isUIVisible = totalUIHeight > 40 || dynamicUIHeight > 40;
  
  // Enhanced bottom UI detection for iOS Safari
  const estimatedTopUIHeight = Math.min(totalUIHeight, 100); // Status bar + top URL bar (typically 44-88px)
  const remainingUIHeight = Math.max(0, totalUIHeight - estimatedTopUIHeight);
  
  // Detect if URL bar is at bottom (common in landscape or certain iOS versions)
  const hasBottomURLBar = remainingUIHeight > 30 || // Bottom UI space suggests bottom URL bar
                          (dynamicUIHeight > 40 && visualViewportHeight < windowHeight - 80); // Visual viewport significantly smaller
  
  // Calculate bottom UI height (URL bar + home indicator)
  const homeIndicatorHeight = 34; // Standard iOS home indicator
  const urlBarHeight = hasBottomURLBar ? 44 : 0; // iOS Safari URL bar height
  const bottomUIHeight = homeIndicatorHeight + urlBarHeight + (hasBottomURLBar ? 6 : 0); // Extra padding for bottom URL bar
  
  // Calculate top UI height (status bar + potential top URL bar)
  const topUIHeight = hasBottomURLBar ? 44 : Math.max(44, estimatedTopUIHeight); // Status bar minimum
  
  return {
    isUIVisible,
    uiHeight: totalUIHeight,
    dynamicUIHeight,
    isStandalone,
    screenHeight,
    windowHeight,
    visualViewportHeight,
    bottomUIHeight,
    topUIHeight,
    hasBottomURLBar
  };
};

export const getIOSSafariBottomUIState = () => {
  const uiState = getIOSSafariUIState();
  
  if (!isIOSSafari() || uiState.isStandalone) {
    return {
      hasBottomUI: false,
      bottomUIHeight: 0,
      hasBottomURLBar: false,
      recommendedOffset: 0
    };
  }
  
  const { bottomUIHeight, hasBottomURLBar, visualViewportHeight, windowHeight } = uiState;
  
  // Additional detection: if visual viewport is significantly smaller, likely bottom UI present
  const viewportReduction = windowHeight - visualViewportHeight;
  const hasSignificantReduction = viewportReduction > 60; // More than just home indicator
  
  const hasBottomUI = hasBottomURLBar || bottomUIHeight > 40 || hasSignificantReduction;
  
  // Calculate recommended offset for toolbar positioning
  let recommendedOffset = 0;
  if (hasBottomUI) {
    if (hasBottomURLBar) {
      // Bottom URL bar + home indicator + safety margin
      recommendedOffset = Math.max(bottomUIHeight, 84); // 44px URL bar + 34px home indicator + 6px margin
    } else {
      // Just home indicator + safety margin  
      recommendedOffset = Math.max(bottomUIHeight, 42); // 34px home indicator + 8px margin
    }
  }
  
  return {
    hasBottomUI,
    bottomUIHeight,
    hasBottomURLBar,
    recommendedOffset,
    viewportReduction
  };
};

export const getIOSSafariToolbarOffset = () => {
  const bottomUIState = getIOSSafariBottomUIState();
  
  // Use the enhanced bottom UI detection for precise offset calculation
  if (!bottomUIState.hasBottomUI) {
    // No bottom UI detected, use minimal safe area
    return 8; // Small safety margin
  }
  
  // Return the recommended offset from enhanced detection
  return bottomUIState.recommendedOffset;
};

export const getMobileSafeAreaInsets = () => {
  // Return safe area inset values for mobile
  return {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)'
  };
};

export const setDynamicVhProperty = () => {
  const updateVh = () => {
    try {
      const actualHeight = getActualViewportHeight();
      if (actualHeight > 0) {
        const vh = actualHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Also set --actual-vh for components that need precise mobile viewport
        document.documentElement.style.setProperty('--actual-vh', `${actualHeight}px`);
      }
    } catch (error) {
      console.warn('Failed to update viewport height property:', error);
      // Fallback to basic calculation
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
  };

  updateVh(); // Set initial value

  // Use throttling to avoid excessive updates
  let timeout: NodeJS.Timeout;
  const throttledUpdateVh = () => {
    clearTimeout(timeout);
    timeout = setTimeout(updateVh, 100);
  };

  window.addEventListener('resize', throttledUpdateVh);
  window.addEventListener('orientationchange', throttledUpdateVh);
  
  // Also listen to visual viewport changes for better mobile support
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', throttledUpdateVh);
  }

  // Return a cleanup function to remove event listeners
  return () => {
    clearTimeout(timeout);
    window.removeEventListener('resize', throttledUpdateVh);
    window.removeEventListener('orientationchange', throttledUpdateVh);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', throttledUpdateVh);
    }
  };
};
