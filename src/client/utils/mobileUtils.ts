export const isMobileDevice = () => window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window;

export const getMobileViewportHeight = () => {
  // Handle mobile viewport quirks
  return window.innerHeight || document.documentElement.clientHeight;
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
