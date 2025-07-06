export const isMobileDevice = () => window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;

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
