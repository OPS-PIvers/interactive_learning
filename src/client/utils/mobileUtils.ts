const MOBILE_MAX_WIDTH = 768;
export const isMobileDevice = () => {
  // Primary check: viewport width (most reliable indicator)
  const isNarrowViewport = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches : false;
  
  // If viewport is narrow, it's definitely mobile
  if (isNarrowViewport) {
    return true;
  }
  
  // For wider viewports, check if it's actually a mobile device
  // using user agent and additional device characteristics
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUserAgent = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
  
  // Check for tablet-specific patterns (iPads in desktop mode, etc.)
  const isTablet = /ipad|tablet|kindle|silk|playbook/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Check for small screen even with desktop user agent (some 2-in-1 devices)
  const isSmallScreen = window.screen.width <= 768 || window.screen.height <= 768;
  
  // Only consider it mobile if we have positive mobile indicators
  // Don't just rely on touch capability alone
  return isMobileUserAgent || (isTablet && isNarrowViewport) || (isSmallScreen && 'ontouchstart' in window);
};

export const getMobileViewportHeight = () => {
  // Handle mobile viewport quirks - use Visual Viewport API when available
  if (window.visualViewport) {
    return window.visualViewport.height;
  }
  // Fallback to traditional methods
  return window.innerHeight || document.documentElement.clientHeight;
};

export const getActualViewportHeight = () => {
  // Get the actual viewport height accounting for mobile browser UI
  const visualViewport = window.visualViewport;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.clientHeight;
  
  // On mobile, prefer visualViewport when available as it accounts for
  // dynamic toolbar height changes
  if (visualViewport && isMobileDevice()) {
    return visualViewport.height;
  }
  
  // For iOS Safari, use the smaller of window.innerHeight and screen.height
  // to account for the dynamic toolbar
  if (isIOS() && isSafari()) {
    return Math.min(windowHeight, window.screen.height);
  }
  
  return windowHeight || documentHeight;
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
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  updateVh(); // Set initial value

  window.addEventListener('resize', updateVh);
  window.addEventListener('orientationchange', updateVh);

  // Return a cleanup function to remove event listeners
  return () => {
    window.removeEventListener('resize', updateVh);
    window.removeEventListener('orientationchange', updateVh);
  };
};
