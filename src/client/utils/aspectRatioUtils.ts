/**
 * Aspect Ratio Utilities
 * 
 * Utility functions for handling aspect ratios in the slide editor,
 * including parsing, validation, and dimension calculations.
 */

export interface AspectRatioDimensions {
  width: number;
  height: number;
}

export interface AspectRatioOption {
  value: string;
  label: string;
  description: string;
  dimensions: AspectRatioDimensions;
}

export interface CanvasDimensions {
  width: number;
  height: number;
  scale: number;
}

/**
 * Parse aspect ratio string into width/height dimensions
 * @param ratio - Aspect ratio string (e.g., "16:9", "4:3", "custom:1.5")
 * @returns Object with width and height values
 */
export function parseAspectRatio(ratio: string): AspectRatioDimensions {
  if (!ratio) {
    return { width: 16, height: 9 }; // Fallback to 16:9
  }
  if (ratio.startsWith('custom:')) {
    const customRatio = parseFloat(ratio.split(':')[1] ?? '');
    if (isNaN(customRatio) || customRatio <= 0) {
      return { width: 16, height: 9 }; // Fallback to 16:9
    }
    return { width: customRatio * 100, height: 100 };
  }

  const parts = ratio.split(':');
  if (parts.length !== 2) {
    return { width: 16, height: 9 }; // Fallback to 16:9
  }

  const width = parseInt(parts[0] ?? '', 10);
  const height = parseInt(parts[1] ?? '', 10);

  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    return { width: 16, height: 9 }; // Fallback to 16:9
  }

  return { width, height };
}

/**
 * Calculate canvas dimensions that fit within container while maintaining aspect ratio
 * @param ratio - Aspect ratio string
 * @param containerWidth - Available container width
 * @param containerHeight - Available container height
 * @param padding - Padding around canvas (default: 48px)
 * @param isMobileLandscape - Whether device is mobile in landscape mode
 * @returns Canvas dimensions with scale factor
 */
export function calculateCanvasDimensions(
  ratio: string,
  containerWidth: number,
  containerHeight: number,
  padding: number = 48,
  isMobileLandscape: boolean = false
): CanvasDimensions {
  const { width: ratioWidth, height: ratioHeight } = parseAspectRatio(ratio);
  const aspectRatio = ratioWidth / ratioHeight;

  // Reduce padding for mobile landscape to maximize canvas space
  const effectivePadding = isMobileLandscape ? Math.min(padding / 2, 16) : padding;
  
  const availableWidth = containerWidth - effectivePadding;
  const availableHeight = containerHeight - effectivePadding;

  let canvasWidth: number;
  let canvasHeight: number;

  // Calculate dimensions to fit within available space
  if (availableWidth / availableHeight > aspectRatio) {
    // Container is wider than needed, fit to height
    canvasHeight = availableHeight;
    canvasWidth = canvasHeight * aspectRatio;
  } else {
    // Container is taller than needed, fit to width
    canvasWidth = availableWidth;
    canvasHeight = canvasWidth / aspectRatio;
  }

  // Adjust minimum dimensions for mobile landscape
  const minWidth = isMobileLandscape ? 200 : 300;
  const minHeight = isMobileLandscape ? 150 : 200;

  if (canvasWidth < minWidth) {
    canvasWidth = minWidth;
    canvasHeight = canvasWidth / aspectRatio;
  }

  if (canvasHeight < minHeight) {
    canvasHeight = minHeight;
    canvasWidth = canvasHeight * aspectRatio;
  }

  // For mobile, ensure we don't exceed available space
  if (isMobileLandscape || availableWidth <= 768) {
    const isBrowser = typeof window !== 'undefined';
    // Mobile-specific maximum constraints
    const maxMobileWidth = isBrowser ? Math.min(availableWidth, document.documentElement.clientWidth - 32) : availableWidth;
    const maxMobileHeight = isBrowser ? Math.min(availableHeight, document.documentElement.clientHeight - (isMobileLandscape ? 64 : 120)) : availableHeight;
    
    if (canvasWidth > maxMobileWidth) {
      canvasWidth = maxMobileWidth;
      canvasHeight = canvasWidth / aspectRatio;
    }
    if (canvasHeight > maxMobileHeight) {
      canvasHeight = maxMobileHeight;
      canvasWidth = canvasHeight * aspectRatio;
    }
    
    // Final constraint check to ensure canvas fits mobile viewport
    if (canvasWidth > maxMobileWidth || canvasHeight > maxMobileHeight) {
      const scaleFactorWidth = maxMobileWidth / canvasWidth;
      const scaleFactorHeight = maxMobileHeight / canvasHeight;
      const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
      
      canvasWidth *= scaleFactor;
      canvasHeight *= scaleFactor;
    }
  }

  // Calculate scale factor (useful for element positioning)
  const baseWidth = 1200; // Standard base width from slide types
  const scale = canvasWidth / baseWidth;

  return {
    width: Math.round(canvasWidth),
    height: Math.round(canvasHeight),
    scale
  };
}

/**
 * Validate aspect ratio string format
 * @param ratio - Aspect ratio string to validate
 * @returns True if valid format
 */
export function validateAspectRatio(ratio: string): boolean {
  if (!ratio || typeof ratio !== 'string') {
    return false;
  }

  if (ratio.startsWith('custom:')) {
    const customRatio = parseFloat(ratio.split(':')[1] ?? '');
    return !isNaN(customRatio) && customRatio > 0 && customRatio <= 10;
  }

  const parts = ratio.split(':');
  if (parts.length !== 2) {
    return false;
  }

  const width = parseInt(parts[0] ?? '', 10);
  const height = parseInt(parts[1] ?? '', 10);

  return !isNaN(width) && !isNaN(height) && width > 0 && height > 0 && width <= 32 && height <= 32;
}

/**
 * Get list of common aspect ratios with descriptions
 * @returns Array of aspect ratio options
 */
export function getCommonRatios(): AspectRatioOption[] {
  return [
    {
      value: '16:9',
      label: '16:9',
      description: 'Widescreen (HD)',
      dimensions: { width: 16, height: 9 }
    },
    {
      value: '4:3',
      label: '4:3',
      description: 'Standard (Classic)',
      dimensions: { width: 4, height: 3 }
    },
    {
      value: '9:16',
      label: '9:16',
      description: 'Portrait (Mobile)',
      dimensions: { width: 9, height: 16 }
    },
    {
      value: '1:1',
      label: '1:1',
      description: 'Square (Social)',
      dimensions: { width: 1, height: 1 }
    },
    {
      value: '21:9',
      label: '21:9',
      description: 'Ultra-wide',
      dimensions: { width: 21, height: 9 }
    },
    {
      value: '3:2',
      label: '3:2',
      description: 'Photo (DSLR)',
      dimensions: { width: 3, height: 2 }
    }
  ];
}

/**
 * Convert aspect ratio to decimal for calculations
 * @param ratio - Aspect ratio string
 * @returns Decimal aspect ratio value
 */
export function aspectRatioToDecimal(ratio: string): number {
  const { width, height } = parseAspectRatio(ratio);
  return width / height;
}

/**
 * Format custom aspect ratio from decimal value
 * @param decimal - Decimal aspect ratio value
 * @returns Formatted custom ratio string
 */
export function formatCustomRatio(decimal: number): string {
  if (decimal <= 0 || !isFinite(decimal)) {
    return 'custom:1.78'; // Default to 16:9 equivalent
  }
  return `custom:${decimal.toFixed(2)}`;
}

/**
 * Get display name for aspect ratio
 * @param ratio - Aspect ratio string
 * @returns Human-readable display name
 */
export function getAspectRatioDisplayName(ratio: string): string {
  const commonRatios = getCommonRatios();
  const found = commonRatios.find(r => r.value === ratio);
  
  if (found) {
    return `${found.label} ${found.description}`;
  }

  if (ratio.startsWith('custom:')) {
    const decimal = parseFloat(ratio.split(':')[1] ?? '');
    if (isNaN(decimal)) {
      return ratio;
    }
    return `Custom ${decimal.toFixed(2)}:1`;
  }

  return ratio;
}

/**
 * Calculate container dimensions needed for aspect ratio
 * @param ratio - Aspect ratio string
 * @param baseWidth - Base width to scale from (default: 1200)
 * @returns Container width and height
 */
export function calculateContainerDimensions(
  ratio: string,
  baseWidth: number = 1200
): AspectRatioDimensions {
  const { width: ratioWidth, height: ratioHeight } = parseAspectRatio(ratio);
  const aspectRatio = ratioWidth / ratioHeight;
  
  return {
    width: baseWidth,
    height: Math.round(baseWidth / aspectRatio)
  };
}