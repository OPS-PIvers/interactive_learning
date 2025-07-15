// Enhanced mobile utilities for upload debugging
import { isMobileDevice } from './mobileUtils';

export interface MobileUploadError {
  code: 'AUTH_ERROR' | 'SIZE_ERROR' | 'NETWORK_ERROR' | 'COMPRESSION_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  originalError?: Error;
}

export function createMobileUploadError(
  message: string,
  code: MobileUploadError['code'],
  originalError?: Error
): MobileUploadError {
  return { message, code, originalError };
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

export function getUploadErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    const mobileError = error as MobileUploadError;
    switch (mobileError.code) {
      case 'AUTH_ERROR':
        return 'Please sign in to upload images.';
      case 'SIZE_ERROR':
        return mobileError.message;
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.';
      case 'COMPRESSION_ERROR':
        return 'Image processing failed. Try a different image or restart the app.';
      default:
        return mobileError.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Upload failed. Please try again.';
}