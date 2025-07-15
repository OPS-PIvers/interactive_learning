// Enhanced mobile utilities for upload debugging
import { isMobileDevice } from './mobileUtils';

export interface MobileUploadError {
  code: 'AUTH_ERROR' | 'SIZE_ERROR' | 'NETWORK_ERROR' | 'COMPRESSION_ERROR' | 'CONNECTIVITY_ERROR' | 'TIMEOUT_ERROR' | 'FIREBASE_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  originalError?: Error;
  timestamp?: number;
  networkDetails?: {
    online: boolean;
    connectionType?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  authDetails?: {
    userPresent: boolean;
    tokenValid: boolean;
    tokenExpiry?: number;
  };
}

export function createMobileUploadError(
  message: string,
  code: MobileUploadError['code'],
  originalError?: Error,
  networkDetails?: MobileUploadError['networkDetails'],
  authDetails?: MobileUploadError['authDetails']
): MobileUploadError {
  return { 
    message, 
    code, 
    originalError, 
    timestamp: Date.now(),
    networkDetails,
    authDetails
  };
}

/**
 * Get current network connection details
 */
export function getNetworkDetails(): MobileUploadError['networkDetails'] {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    online: navigator.onLine,
    connectionType: connection?.type || 'unknown',
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0
  };
}

/**
 * Get authentication details for debugging
 */
export async function getAuthDetails(): Promise<MobileUploadError['authDetails']> {
  try {
    const { auth } = await import('../../lib/firebaseConfig');
    const user = auth.currentUser;
    
    if (!user) {
      return {
        userPresent: false,
        tokenValid: false
      };
    }

    // Check if token is valid by getting the token
    try {
      const token = await user.getIdToken(false); // false = don't force refresh
      const tokenResult = await user.getIdTokenResult(false);
      
      return {
        userPresent: true,
        tokenValid: !!token,
        tokenExpiry: new Date(tokenResult.expirationTime).getTime()
      };
    } catch (tokenError) {
      return {
        userPresent: true,
        tokenValid: false
      };
    }
  } catch (error) {
    return {
      userPresent: false,
      tokenValid: false
    };
  }
}

/**
 * Enhanced logging function for upload debugging
 */
export function logUploadError(error: MobileUploadError, context: string = 'Upload') {
  const logData = {
    context,
    error: {
      code: error.code,
      message: error.message,
      timestamp: new Date(error.timestamp || Date.now()).toISOString(),
      isMobile: isMobileDevice(),
      networkDetails: error.networkDetails,
      authDetails: error.authDetails,
      originalError: error.originalError ? {
        name: error.originalError.name,
        message: error.originalError.message,
        stack: error.originalError.stack
      } : undefined
    }
  };

  console.error(`🚨 ${context} Error:`, logData);
  
  // Send to any error reporting service if available
  if (typeof window !== 'undefined' && (window as any).reportError) {
    (window as any).reportError(logData);
  }
}

export function getMobileOptimizedSettings() {
  const isMobile = isMobileDevice();
  
  return {
    compression: {
      maxSizeMB: isMobile ? 1.5 : 2,
      maxWidthOrHeight: isMobile ? 1920 : 2560,
      useWebWorker: !isMobile, // Disabled on mobile for stability
      quality: 0.8,
      fileType: isMobile ? 'image/jpeg' : undefined, // Force JPEG on mobile
    },
    upload: {
      timeout: isMobile ? 45000 : 30000, // Longer timeout for mobile
      maxFileSize: isMobile ? 8 * 1024 * 1024 : 10 * 1024 * 1024, // 8MB mobile, 10MB desktop
      retryAttempts: isMobile ? 2 : 1,
    }
  };
}

/**
 * Check network connectivity before upload
 */
export async function checkNetworkConnectivity(): Promise<{ connected: boolean; quality: 'good' | 'poor' | 'offline' }> {
  if (!navigator.onLine) {
    return { connected: false, quality: 'offline' };
  }

  try {
    // Test connectivity with a small Firebase request
    const { auth } = await import('../../lib/firebaseConfig');
    
    // If user is authenticated, try to refresh the token as a connectivity test
    if (auth.currentUser) {
      const startTime = Date.now();
      await auth.currentUser.getIdToken(true); // Force refresh
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        connected: true,
        quality: responseTime < 2000 ? 'good' : 'poor'
      };
    } else {
      // If no user, just return based on navigator.onLine
      return { connected: true, quality: 'good' };
    }
  } catch (error) {
    console.warn('Network connectivity test failed:', error);
    return { connected: false, quality: 'offline' };
  }
}

export function getUploadErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    const mobileError = error as MobileUploadError;
    switch (mobileError.code) {
      case 'AUTH_ERROR':
        return 'Authentication failed. Please sign in again and try uploading.';
      case 'SIZE_ERROR':
        return mobileError.message;
      case 'NETWORK_ERROR':
        return 'Network error occurred during upload. Please check your connection and try again.';
      case 'CONNECTIVITY_ERROR':
        return 'No internet connection. Please check your network and try again.';
      case 'TIMEOUT_ERROR':
        return 'Upload timed out. Please try again with a smaller image or better connection.';
      case 'FIREBASE_ERROR':
        return 'Server error occurred. Please try again in a few moments.';
      case 'COMPRESSION_ERROR':
        return 'Image processing failed. Try a different image or restart the app.';
      default:
        return mobileError.message || 'Upload failed. Please try again.';
    }
  }
  
  if (error instanceof Error) {
    // Try to categorize Firebase-specific errors
    if (error.message.includes('auth/')) {
      return 'Authentication error. Please sign in again.';
    }
    if (error.message.includes('storage/')) {
      return 'Storage error. Please try again.';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message;
  }
  
  return 'Upload failed. Please try again.';
}