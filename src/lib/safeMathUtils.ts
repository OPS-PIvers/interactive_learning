// src/lib/safeMathUtils.ts
// Utility functions to prevent division by zero and other math errors

/**
 * Safely divide two numbers, returning fallback if divisor is zero or invalid
 */
export function safeDivide(dividend: number, divisor: number, fallback: number = 0): number {
  if (!isFinite(dividend) || !isFinite(divisor) || divisor === 0) {
    return fallback;
  }
  return dividend / divisor;
}

/**
 * Safely calculate percentage with bounds checking
 */
export function safePercentage(value: number, total: number, fallback: number = 0): number {
  if (!isFinite(value) || !isFinite(total) || total === 0) {
    return fallback;
  }
  return Math.max(0, Math.min(100, (value / total) * 100));
}

/**
 * Safely calculate percentage delta for position changes
 */
export function safePercentageDelta(
  delta: number, 
  bounds: { width: number; height: number }, 
  axis: 'x' | 'y'
): number {
  const dimension = axis === 'x' ? bounds.width : bounds.height;
  return safeDivide(delta, dimension) * 100;
}

/**
 * Validate image bounds object
 */
export function isValidImageBounds(bounds: any): bounds is { width: number; height: number } {
  return bounds && 
         typeof bounds.width === 'number' && 
         typeof bounds.height === 'number' &&
         bounds.width > 0 && 
         bounds.height > 0 &&
         isFinite(bounds.width) && 
         isFinite(bounds.height);
}

/**
 * Safely calculate position percentages from pixel coordinates
 */
export function safePositionToPercentage(
  position: { x: number; y: number },
  imageBounds: { width: number; height: number }
): { x: number; y: number } {
  if (!isValidImageBounds(imageBounds)) {
    console.warn('Invalid image bounds provided to safePositionToPercentage');
    return { x: 0, y: 0 };
  }

  return {
    x: safePercentage(position.x, imageBounds.width),
    y: safePercentage(position.y, imageBounds.height)
  };
}

/**
 * Safely calculate pixel coordinates from percentage positions
 */
export function safePercentageToPosition(
  percentage: { x: number; y: number },
  imageBounds: { width: number; height: number }
): { x: number; y: number } {
  if (!isValidImageBounds(imageBounds)) {
    console.warn('Invalid image bounds provided to safePercentageToPosition');
    return { x: 0, y: 0 };
  }

  return {
    x: (percentage.x / 100) * imageBounds.width,
    y: (percentage.y / 100) * imageBounds.height
  };
}

/**
 * Clamp a value between min and max bounds
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate and sanitize hotspot position data
 */
export function sanitizeHotspotPosition(
  position: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: clamp(isFinite(position.x) ? position.x : 0, 0, 100),
    y: clamp(isFinite(position.y) ? position.y : 0, 0, 100)
  };
}

// Type guard for checking if a rect has valid dimensions
export function hasValidDimensions(rect: any): rect is { width: number; height: number } {
  return rect && 
         typeof rect.width === 'number' && 
         typeof rect.height === 'number' &&
         rect.width > 0 && 
         rect.height > 0 &&
         isFinite(rect.width) && 
         isFinite(rect.height);
}