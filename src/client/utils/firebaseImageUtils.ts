/**
 * Firebase Storage image utilities for handling CORS and URL optimization
 */

/**
 * Detect if a URL is from Firebase Storage
 */
export function isFirebaseStorageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('firebasestorage.googleapis.com') ||
    urlObj.hostname.includes('firebase.com') ||
    urlObj.hostname.includes('.appspot.com');
  } catch {
    return false;
  }
}

/**
 * Normalize Firebase Storage URL by ensuring it's properly formatted
 * Preserves all existing query parameters as they are required for the URL to work
 */
export function normalizeFirebaseUrl(url: string): string {
  if (!url || !isFirebaseStorageUrl(url)) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    // Keep all existing query parameters, as they are all needed for the URL to work
    return urlObj.toString();
  } catch (error) {
    console.warn('Failed to process Firebase URL:', error);
    return url;
  }
}

/**
 * Add proper CORS handling for Firebase Storage images
 */
export function addFirebaseImageCORS(imgElement: HTMLImageElement): void {
  if (isFirebaseStorageUrl(imgElement.src)) {
    // Don't set crossOrigin for Firebase Storage - it can cause CORS issues
    // Firebase Storage should handle CORS through bucket configuration
    imgElement.removeAttribute('crossorigin');
  }
}

/**
 * Validate Firebase Storage URL and provide debugging info
 */
export function validateFirebaseUrl(url: string): {
  isValid: boolean;
  isFirebase: boolean;
  hasToken: boolean;
  hasAlt: boolean;
  cleanUrl?: string;
  issues: string[];
} {
  const result: {
    isValid: boolean;
    isFirebase: boolean;
    hasToken: boolean;
    hasAlt: boolean;
    cleanUrl?: string;
    issues: string[];
  } = {
    isValid: false,
    isFirebase: false,
    hasToken: false,
    hasAlt: false,
    issues: [] as string[]
  };

  if (!url || typeof url !== 'string') {
    result.issues.push('URL is empty or not a string');
    return result;
  }

  try {
    const urlObj = new URL(url);
    result.isValid = true;
    result.isFirebase = isFirebaseStorageUrl(url);

    if (result.isFirebase) {
      result.hasToken = urlObj.searchParams.has('token');
      result.hasAlt = urlObj.searchParams.has('alt');
      result.cleanUrl = normalizeFirebaseUrl(url);

      if (!result.hasAlt && !result.hasToken) {
        result.issues.push('Firebase Storage URL missing alt and token parameters');
      }

      // Check for potentially problematic parameters
      const problematicParams = ['w', 'q', 'f', 'format', 'width', 'height'];
      const hasProblematicParams = problematicParams.some((param) =>
      urlObj.searchParams.has(param)
      );

      if (hasProblematicParams) {
        result.issues.push('URL has optimization parameters that may interfere with CORS');
      }
    }

  } catch (error: unknown) {
    result.issues.push(`Invalid URL format: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Log Firebase image loading for debugging
 */
export function logFirebaseImageLoad(url: string, success: boolean, context: string = ''): void {
    const validation = validateFirebaseUrl(url);

    if (validation.isFirebase) {
        const prefix = success ? '✅' : '❌';
        const contextInfo = context ? `[${context}]` : '';
        console.log(
            `${prefix} Firebase Image ${contextInfo}: ${success ? 'Loaded' : 'Failed'}`,
            {
                url: validation.cleanUrl,
                issues: validation.issues,
            }
        );
    }
}

/**
 * Optimizes Firebase Storage image URLs for performance.
 * This can include resizing and converting to a modern format like WebP.
 * Note: This might not work if the image is from a bucket with strict permissions.
 */
export function optimizeFirebaseImageUrl(
    url: string,
    options: { width?: number; height?: number; format?: 'webp' | 'jpeg' | 'png' } = {}
): string {
    if (!isFirebaseStorageUrl(url) || !validateFirebaseUrl(url).isValid) {
        return url;
    }

    try {
        const urlObj = new URL(url);

        // These are example parameters for a service like Cloudinary or Imgix.
        // Firebase Storage itself doesn't support these transformations directly.
        // This is a placeholder for a real image optimization service.
        if (options.width) urlObj.searchParams.set('w', String(options.width));
        if (options.height) urlObj.searchParams.set('h', String(options.height));
        if (options.format) urlObj.searchParams.set('fm', options.format);

        return urlObj.toString();
    } catch (error) {
        console.warn('Failed to optimize Firebase URL:', error);
        return url;
    }
}