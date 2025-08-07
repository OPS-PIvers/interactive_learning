import { auth } from '../../lib/firebaseConfig';
import { appScriptProxy } from '../../lib/firebaseProxy';
import { ImageTransformState, HotspotData } from '../../shared/types';
// Enhanced upload handler for all devices
import { compressImage } from './imageCompression';
import { generateThumbnail } from './imageUtils';
import { networkMonitor, waitForNetwork, NetworkState } from './networkMonitor';
import { retryWithBackoff, refreshAuthTokenIfNeeded, RetryContext } from './retryUtils';

// Error types for upload handling
export interface UploadError {
  code: 'AUTH_ERROR' | 'SIZE_ERROR' | 'NETWORK_ERROR' | 'COMPRESSION_ERROR' | 'CONNECTIVITY_ERROR' | 'TIMEOUT_ERROR' | 'FIREBASE_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  originalError?: Error;
  timestamp?: number;
}

// Unified upload settings (no device-specific branching)
const getUploadSettings = () => ({
  compression: {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: false, // Disabled for stability across all devices
    quality: 0.8,
    fileType: 'image/jpeg' as const, // Force JPEG for consistency
  },
  upload: {
    timeout: 45000, // Longer timeout for all devices
    maxFileSize: 8 * 1024 * 1024, // 8MB for all devices
    retryAttempts: 2,
  }
});

// Get current network connection details
const getNetworkDetails = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    online: navigator.onLine,
    connectionType: connection?.type || 'unknown',
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0
  };
};

// Get authentication details for debugging
const getAuthDetails = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        userPresent: false,
        tokenValid: false
      };
    }

    try {
      const token = await user.getIdToken(false);
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
};

// Create standardized upload error
const createUploadError = (
  message: string,
  code: UploadError['code'],
  originalError?: Error
): UploadError => {
  const error: UploadError = {
    message,
    code,
    timestamp: Date.now()
  };
  if (originalError) {
    error.originalError = originalError;
  }
  return error;
};

// Check network connectivity before upload
const checkNetworkConnectivity = async () => {
  if (!navigator.onLine) {
    return { connected: false, quality: 'offline' as const };
  }

  try {
    if (auth.currentUser) {
      const startTime = Date.now();
      await auth.currentUser.getIdToken(true);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        connected: true,
        quality: responseTime < 2000 ? 'good' as const : 'poor' as const
      };
    } else {
      return { connected: true, quality: 'good' as const };
    }
  } catch (error) {
    console.warn('Network connectivity test failed:', error);
    return { connected: false, quality: 'offline' as const };
  }
};

// Get user-friendly error message
const getUploadErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error && 'code' in error) {
    const uploadError = error as UploadError;
    switch (uploadError.code) {
      case 'AUTH_ERROR':
        return 'Authentication failed. Please sign in again and try uploading.';
      case 'SIZE_ERROR':
        return uploadError.message;
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
        return uploadError.message || 'Upload failed. Please try again.';
    }
  }
  
  if (error instanceof Error) {
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
};

// Thumbnail Parameters (match firebaseApi.ts)
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 250;
const THUMBNAIL_FORMAT = 'image/jpeg' as const;
const THUMBNAIL_QUALITY = 0.7;
const THUMBNAIL_POSTFIX = '_thumbnails';
const THUMBNAIL_FILE_PREFIX = 'thumb_';

export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface UploadCallbacks {
  onStart?: () => void;
  onProgress?: (status: string) => void;
  onComplete?: (imageUrl: string, thumbnailUrl?: string) => void;
  onError?: (error: string) => void;
  onNetworkChange?: (state: NetworkState) => void;
}

/**
 * Enhanced image upload handler optimized for mobile devices
 * Integrates with existing codebase while providing better mobile support
 */
export async function handleEnhancedImageUpload(
  file: File,
  projectId: string,
  callbacks: UploadCallbacks = {}
): Promise<UploadResult> {
  const { onStart, onProgress, onComplete, onError, onNetworkChange } = callbacks;
  
  // Start network monitoring for upload
  let networkUnsubscribe: (() => void) | null = null;
  
  // Cleanup function
  const cleanup = () => {
    if (networkUnsubscribe) {
      networkUnsubscribe();
      networkMonitor.stopMonitoring();
    }
  };
  
  try {
    onStart?.();
    
    if (onNetworkChange) {
      networkUnsubscribe = networkMonitor.addListener(onNetworkChange);
      networkMonitor.startMonitoring(2000); // Check every 2 seconds during upload
    }

    onProgress?.('Checking connection...');

    // Phase 1: Enhanced network connectivity check
    const networkStatus = await checkNetworkConnectivity();
    const networkDetails = getNetworkDetails();
    
    if (!networkStatus.connected) {
      cleanup();
      
      // If offline, wait for network to come back (with timeout)
      onProgress?.('Waiting for network connection...');
      try {
        await waitForNetwork(30000); // Wait up to 30 seconds
        onProgress?.('Network connection restored, continuing...');
      } catch (waitError) {
        const error = createUploadError(
          'No internet connection available',
          'CONNECTIVITY_ERROR',
          waitError as Error
        );
        console.error('Pre-upload connectivity check error:', error);
        throw error;
      }
    }

    onProgress?.('Validating authentication...');

    // Phase 1: Enhanced authentication validation
    const authDetails = await getAuthDetails();
    if (!authDetails.userPresent || !authDetails.tokenValid) {
      const error = createUploadError(
        'User authentication failed or token expired',
        'AUTH_ERROR'
      );
      console.error('Pre-upload authentication check error:', error);
      throw error;
    }

    onProgress?.('Validating file...');

    // Get unified upload settings
    const settings = getUploadSettings();
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      const error = createUploadError(
        'Please select an image file',
        'SIZE_ERROR'
      );
      console.error('File validation error:', error);
      throw error;
    }

    // Validate file size
    if (file.size > settings.upload.maxFileSize) {
      const error = createUploadError(
        `File too large: ${Math.round(file.size / (1024 * 1024))}MB. Max: ${Math.round(settings.upload.maxFileSize / (1024 * 1024))}MB`,
        'SIZE_ERROR'
      );
      console.error('File size validation error:', error);
      throw error;
    }

    onProgress?.('Processing image...');
    
    // Compress image with mobile-optimized settings
    let processedFile = file;
    try {
      processedFile = await compressImage(file);
      console.log(`📱 Image compression: ${file.size} → ${processedFile.size} bytes`);
    } catch (compressionError) {
      console.warn('📱 Image compression failed, using original:', compressionError);
      
      // If compression fails and file is too large, throw error
      if (file.size > settings.upload.maxFileSize) {
        const error = createUploadError(
          'Image too large and compression failed',
          'COMPRESSION_ERROR',
          compressionError as Error
        );
        console.error('Image compression error:', error);
        throw error;
      }
    }

    onProgress?.('Generating thumbnail...');
    
    // Generate thumbnail from original file (no CORS issues)
    let thumbnailUrl: string | undefined;
    try {
      const thumbnailBlob = await generateThumbnail(
        file, // Use original file, not URL
        THUMBNAIL_WIDTH,
        THUMBNAIL_HEIGHT,
        THUMBNAIL_FORMAT,
        THUMBNAIL_QUALITY
      );
      
      const mimeTypeToExtension: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
        'image/png': 'png'
      };
      
      const fileExtension = mimeTypeToExtension[THUMBNAIL_FORMAT] || 'jpg';
      const thumbnailFile = new File(
        [thumbnailBlob],
        `${THUMBNAIL_FILE_PREFIX}${projectId}.${fileExtension}`,
        { type: THUMBNAIL_FORMAT }
      );
      
      // Upload thumbnail first
      onProgress?.('Uploading thumbnail...');
      thumbnailUrl = await appScriptProxy.uploadThumbnail(thumbnailFile, projectId);
      console.log(`Thumbnail generated and uploaded: ${thumbnailUrl}`);
      
    } catch (thumbnailError) {
      console.warn('Thumbnail generation failed:', thumbnailError);
      // Continue without thumbnail - don't fail the entire upload
    }

    onProgress?.('Uploading main image...');

    // Upload with exponential backoff retry logic
    const imageUrl = await retryWithBackoff(async (context: RetryContext) => {
      // Update progress with retry information
      if (context.attempt > 1) {
        onProgress?.(`Retrying upload (${context.attempt}/${settings.upload.retryAttempts + 1})...`);
      }
      
      // Refresh auth token if needed before each attempt
      if (context.attempt > 1) {
        await refreshAuthTokenIfNeeded();
      }
      
      // Progressive compression: compress more aggressively on retries
      let currentFile = processedFile;
      if (context.attempt > 1) {
        const compressionLevel = Math.min(context.attempt - 1, 3);
        const compressionSettings = {
          maxSizeMB: Math.max(0.3, 1.0 - (compressionLevel * 0.2)),
          maxWidthOrHeight: Math.max(1024, 1920 - (compressionLevel * 200)),
          useWebWorker: false,
          fileType: 'image/jpeg' as const,
          quality: Math.max(0.4, 0.8 - (compressionLevel * 0.1))
        };
        
        try {
          currentFile = await compressImage(file, compressionSettings);
          console.log(`📱 Retry compression (attempt ${context.attempt}): ${currentFile.size} bytes`);
        } catch (compressionError) {
          console.warn(`📱 Retry compression failed, using previous file`);
        }
      }
      
      // Create upload promise with timeout
      const uploadPromise = appScriptProxy.uploadImage(currentFile, projectId);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          const timeoutError = new Error('Upload timeout');
          timeoutError.name = 'TimeoutError';
          reject(timeoutError);
        }, settings.upload.timeout);
      });

      try {
        const result = await Promise.race([uploadPromise, timeoutPromise]);
        return result;
      } catch (uploadError) {
        const currentNetworkDetails = getNetworkDetails();
        const currentAuthDetails = await getAuthDetails();
        
        // Determine error type based on the error
        let errorCode: 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'AUTH_ERROR' | 'FIREBASE_ERROR' = 'NETWORK_ERROR';
        let errorMessage = 'Upload failed';
        
        if (uploadError instanceof Error) {
          if (uploadError.name === 'TimeoutError') {
            errorCode = 'TIMEOUT_ERROR';
            errorMessage = 'Upload timed out';
          } else if (uploadError.message.includes('auth/') || uploadError.message.includes('authentication')) {
            errorCode = 'AUTH_ERROR';
            errorMessage = 'Authentication failed during upload';
          } else if (uploadError.message.includes('storage/') || uploadError.message.includes('Firebase')) {
            errorCode = 'FIREBASE_ERROR';
            errorMessage = 'Firebase storage error';
          }
        }
        
        const error = createUploadError(
          errorMessage,
          errorCode,
          uploadError as Error
        );
        console.error(`Upload attempt ${context.attempt} error:`, error);
        throw error;
      }
    }, {
      maxAttempts: settings.upload.retryAttempts + 1,
      baseDelay: 2000, // Unified delay for all devices
      maxDelay: 30000, // Unified max delay for all devices
      retryCondition: (error) => {
        // Don't retry authentication errors, file size errors, or permission errors
        if (error instanceof Error) {
          return !error.message.includes('auth/user-not-authenticated') &&
                 !error.message.includes('SIZE_ERROR') &&
                 !error.message.includes('file too large') &&
                 !error.message.includes('storage/unauthorized') &&
                 !error.message.includes('permission denied');
        }
        return true;
      }
    });

    onProgress?.('Upload complete!');
    cleanup(); // Stop network monitoring
    onComplete?.(imageUrl!, thumbnailUrl);
    
    const result: UploadResult = {
      success: true,
      imageUrl: imageUrl!,
    };
    if (thumbnailUrl) {
      result.thumbnailUrl = thumbnailUrl;
    }
    return result;

  } catch (error) {
    console.error('📱 Enhanced image upload failed:', error);
    
    // Ensure cleanup happens even on error
    cleanup();
    
    // Log the error with full context
    if (typeof error === 'object' && error && 'code' in error) {
      console.error('Enhanced upload handler error:', error);
    } else {
      // Create a generic error for logging
      const genericError = createUploadError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN_ERROR',
        error as Error
      );
      console.error('Enhanced upload handler error:', genericError);
    }
    
    const errorMessage = getUploadErrorMessage(error);
    onError?.(errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Enhanced upload handler that can be used as drop-in replacement
 * for existing handleImageUpload in InteractiveModule
 */
export function createOptimizedUploadHandler(
  projectId: string,
  setImageLoading: (loading: boolean) => void,
  setBackgroundImage: (url: string) => void,
  setImageTransform: (transform: ImageTransformState) => void,
  setEditingZoom: (zoom: number) => void,
  debugLog: (category: string, message: string, data?: unknown) => void,
  hotspots: HotspotData[] = [],
  onThumbnailGenerated?: (thumbnailUrl: string) => void
) {
  return async (file: File) => {
    // Check for existing hotspots
    if (hotspots.length > 0) {
      const confirmReplace = window.confirm(
        `You have ${hotspots.length} hotspot(s) that may need to be repositioned.\n\nDo you want to continue?`
      );
      if (!confirmReplace) return;
    }
    
    debugLog('Image', 'Enhanced upload started', { 
      fileName: file.name, 
      fileSize: file.size
    });

    const result = await handleEnhancedImageUpload(file, projectId, {
      onStart: () => setImageLoading(true),
      onProgress: (status) => debugLog('Image', 'Upload progress', { status }),
      onComplete: (imageUrl, thumbnailUrl) => {
        setBackgroundImage(imageUrl);
        setImageTransform({ scale: 1, translateX: 0, translateY: 0 });
        setEditingZoom(1);
        setImageLoading(false);
        
        // Store thumbnail URL for later use
        if (thumbnailUrl && onThumbnailGenerated) {
          onThumbnailGenerated(thumbnailUrl);
        }
        
        debugLog('Image', 'Enhanced upload successful', { imageUrl, thumbnailUrl });
      },
      onError: (error) => {
        setImageLoading(false);
        debugLog('Image', 'Enhanced upload failed', { error });
        alert(error);
      }
    });

    return result;
  };
}