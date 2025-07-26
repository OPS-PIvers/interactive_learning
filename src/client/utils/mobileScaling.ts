import { MobileLayoutConfig, SafeAreaInsets } from '../hooks/useMobileLayout';

export interface ScalingConfig {
  containerSize: { width: number; height: number };
  deviceInfo: {
    devicePixelRatio: number;
    maxTouchPoints: number;
    platform: string;
  };
  safeArea: SafeAreaInsets;
  orientation: 'portrait' | 'landscape';
}

export interface MobileCanvasScale {
  width: number;
  height: number;
  scale: number;
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  maxDimensions: {
    width: number;
    height: number;
  };
}

/**
 * Calculate optimal mobile canvas scaling
 * 
 * Implements architect recommendations for device-aware scaling
 * with safe area compensation and orientation-optimized layouts.
 */
export const calculateMobileCanvasScale = (config: ScalingConfig): MobileCanvasScale => {
  const { containerSize, deviceInfo, safeArea, orientation } = config;
  const isLandscape = orientation === 'landscape';
  
  // Device-density aware padding calculation
  const pixelRatio = deviceInfo.devicePixelRatio || 1;
  const densityMultiplier = Math.max(1, pixelRatio / 2);
  
  // Base padding adjusted for device density
  const basePadding = Math.max(8, 16 / pixelRatio) * densityMultiplier;
  
  // Orientation-specific padding adjustments
  const orientationPadding = {
    top: isLandscape ? basePadding * 0.5 : basePadding,
    bottom: isLandscape ? basePadding * 0.5 : basePadding * 1.5,
    left: basePadding,
    right: basePadding
  };
  
  // Safe area compensation
  const effectivePadding = {
    top: orientationPadding.top + safeArea.top,
    bottom: orientationPadding.bottom + safeArea.bottom,
    left: orientationPadding.left + safeArea.left,
    right: orientationPadding.right + safeArea.right
  };
  
  // Calculate available space after padding and safe areas
  const availableWidth = Math.max(
    200,
    containerSize.width - effectivePadding.left - effectivePadding.right
  );
  const availableHeight = Math.max(
    150,
    containerSize.height - effectivePadding.top - effectivePadding.bottom
  );
  
  // Maximum dimensions based on viewport constraints
  const maxDimensions = {
    width: Math.min(availableWidth, window.innerWidth - 32),
    height: Math.min(availableHeight, window.innerHeight - (isLandscape ? 64 : 120))
  };
  
  // Scale calculation based on available space
  const baseCanvasWidth = 1200; // Standard slide width
  const baseCanvasHeight = 675; // 16:9 ratio
  
  const scaleX = maxDimensions.width / baseCanvasWidth;
  const scaleY = maxDimensions.height / baseCanvasHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Never scale up
  
  // Final canvas dimensions
  const canvasWidth = Math.round(baseCanvasWidth * scale);
  const canvasHeight = Math.round(baseCanvasHeight * scale);
  
  return {
    width: canvasWidth,
    height: canvasHeight,
    scale,
    padding: effectivePadding,
    maxDimensions
  };
};

/**
 * Get responsive touch target size based on device characteristics
 */
export const getResponsiveTouchTargetSize = (layoutConfig: MobileLayoutConfig): number => {
  const { layoutMode, scaleFactor } = layoutConfig;
  
  // Base touch target sizes (in pixels)
  const baseSizes = {
    compact: 40,
    standard: 44,
    expanded: 48
  };
  
  const baseSize = baseSizes[layoutMode];
  return Math.round(baseSize * scaleFactor);
};

/**
 * Calculate optimal font sizes for mobile UI
 */
export const getResponsiveFontSizes = (layoutConfig: MobileLayoutConfig) => {
  const { layoutMode, scaleFactor } = layoutConfig;
  
  const baseSizes = {
    compact: { small: 12, medium: 14, large: 16, xlarge: 18 },
    standard: { small: 14, medium: 16, large: 18, xlarge: 20 },
    expanded: { small: 16, medium: 18, large: 20, xlarge: 24 }
  };
  
  const sizes = baseSizes[layoutMode];
  
  return {
    small: Math.round(sizes.small * scaleFactor),
    medium: Math.round(sizes.medium * scaleFactor),
    large: Math.round(sizes.large * scaleFactor),
    xlarge: Math.round(sizes.xlarge * scaleFactor)
  };
};

/**
 * Get device-specific optimizations
 */
export const getDeviceOptimizations = (deviceInfo: ScalingConfig['deviceInfo']) => {
  const { platform, devicePixelRatio, maxTouchPoints } = deviceInfo;
  
  const isIOS = /iPad|iPhone|iPod/.test(platform) || 
    (platform === 'MacIntel' && maxTouchPoints > 1);
  const isAndroid = /Android/.test(platform);
  const isHighDensity = devicePixelRatio > 2;
  
  return {
    platform: isIOS ? 'ios' : isAndroid ? 'android' : 'unknown',
    isHighDensity,
    recommendedAnimationDuration: isHighDensity ? 200 : 300,
    shouldUseHardwareAcceleration: isHighDensity,
    touchDelay: isIOS ? 0 : 100 // iOS has better touch responsiveness
  };
};