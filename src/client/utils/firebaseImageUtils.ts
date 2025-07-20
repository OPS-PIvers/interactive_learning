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
 * Get Firebase Storage URL without any modifications that might interfere with CORS
 */
export function getCleanFirebaseUrl(url: string): string {
  if (!url || !isFirebaseStorageUrl(url)) {
    return url;
  }
  
  try {
    const urlObj = new URL(url);
    // Remove any query parameters that might interfere with CORS
    const cleanUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    
    // Keep essential Firebase Storage parameters
    const alt = urlObj.searchParams.get('alt');
    const token = urlObj.searchParams.get('token');
    
    if (alt && token) {
      return `${cleanUrl}?alt=${alt}&token=${token}`;
    } else if (alt) {
      return `${cleanUrl}?alt=${alt}`;
    } else if (token) {
      return `${cleanUrl}?token=${token}`;
    }
    
    return cleanUrl;
  } catch (error) {
    console.warn('Failed to clean Firebase URL:', error);
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
  const result = {
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
      result.cleanUrl = getCleanFirebaseUrl(url);
      
      if (!result.hasAlt && !result.hasToken) {
        result.issues.push('Firebase Storage URL missing alt and token parameters');
      }
      
      // Check for potentially problematic parameters
      const problematicParams = ['w', 'q', 'f', 'format', 'width', 'height'];
      const hasProblematicParams = problematicParams.some(param => 
        urlObj.searchParams.has(param)
      );
      
      if (hasProblematicParams) {
        result.issues.push('URL has optimization parameters that may interfere with CORS');
      }
    }
    
  } catch (error) {
    result.issues.push(`Invalid URL format: ${error.message}`);
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
    console.log(`${prefix} Firebase image ${success ? 'loaded' : 'failed'} ${context}:`, {
      url: url.substring(0, 100) + (url.length > 100 ? '...' : ''),
      isValid: validation.isValid,
      hasToken: validation.hasToken,
      hasAlt: validation.hasAlt,
      issues: validation.issues,
      cleanUrl: validation.cleanUrl?.substring(0, 100) + (validation.cleanUrl && validation.cleanUrl.length > 100 ? '...' : '')
    });
  }
}