// Enhanced upload handler for mobile devices
import { appScriptProxy } from '../../lib/firebaseProxy';
import { compressImage } from './imageCompression';
import { 
  getMobileOptimizedSettings, 
  createMobileUploadError, 
  getUploadErrorMessage, 
  getNetworkDetails, 
  getAuthDetails, 
  checkNetworkConnectivity,
  logUploadError 
} from './mobileUploadUtils';
import { isMobileDevice } from './mobileUtils';
import { retryWithBackoff, refreshAuthTokenIfNeeded, RetryContext } from './retryUtils';
import { networkMonitor, waitForNetwork, NetworkState } from './networkMonitor';

export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface UploadCallbacks {
  onStart?: () => void;
  onProgress?: (status: string) => void;
  onComplete?: (imageUrl: string) => void;
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
        const error = createMobileUploadError(
          'No internet connection available',
          'CONNECTIVITY_ERROR',
          waitError as Error,
          networkDetails
        );
        logUploadError(error, 'Pre-upload connectivity check');
        throw error;
      }
    }

    onProgress?.('Validating authentication...');

    // Phase 1: Enhanced authentication validation
    const authDetails = await getAuthDetails();
    if (!authDetails.userPresent || !authDetails.tokenValid) {
      const error = createMobileUploadError(
        'User authentication failed or token expired',
        'AUTH_ERROR',
        undefined,
        networkDetails,
        authDetails
      );
      logUploadError(error, 'Pre-upload authentication check');
      throw error;
    }

    onProgress?.('Validating file...');

    // Get mobile-optimized settings
    const settings = getMobileOptimizedSettings();
    const isMobile = isMobileDevice();
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      const error = createMobileUploadError(
        'Please select an image file',
        'SIZE_ERROR',
        undefined,
        networkDetails,
        authDetails
      );
      logUploadError(error, 'File validation');
      throw error;
    }

    // Validate file size
    if (file.size > settings.upload.maxFileSize) {
      const error = createMobileUploadError(
        `File too large: ${Math.round(file.size / (1024 * 1024))}MB. Max: ${Math.round(settings.upload.maxFileSize / (1024 * 1024))}MB`,
        'SIZE_ERROR',
        undefined,
        networkDetails,
        authDetails
      );
      logUploadError(error, 'File size validation');
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
        const error = createMobileUploadError(
          'Image too large and compression failed',
          'COMPRESSION_ERROR',
          compressionError as Error,
          networkDetails,
          authDetails
        );
        logUploadError(error, 'Image compression');
        throw error;
      }
    }

    onProgress?.('Uploading to server...');

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
        
        const error = createMobileUploadError(
          errorMessage,
          errorCode,
          uploadError as Error,
          currentNetworkDetails,
          currentAuthDetails
        );
        logUploadError(error, `Upload attempt ${context.attempt}`);
        throw error;
      }
    }, {
      maxAttempts: settings.upload.retryAttempts + 1,
      baseDelay: isMobile ? 2000 : 1000,
      maxDelay: isMobile ? 30000 : 15000,
      retryCondition: (error) => {
        // Don't retry authentication errors or file size errors
        if (error instanceof Error) {
          return !error.message.includes('auth/user-not-authenticated') &&
                 !error.message.includes('SIZE_ERROR') &&
                 !error.message.includes('file too large');
        }
        return true;
      }
    });

    onProgress?.('Upload complete!');
    cleanup(); // Stop network monitoring
    onComplete?.(imageUrl!);
    
    return {
      success: true,
      imageUrl: imageUrl!
    };

  } catch (error) {
    console.error('📱 Enhanced image upload failed:', error);
    
    // Ensure cleanup happens even on error
    cleanup();
    
    // Log the error with full context if it's our custom error type
    if (typeof error === 'object' && error && 'code' in error) {
      logUploadError(error as any, 'Enhanced upload handler');
    } else {
      // Create a generic error for logging
      const networkDetails = getNetworkDetails();
      const authDetails = await getAuthDetails();
      const genericError = createMobileUploadError(
        error instanceof Error ? error.message : 'Unknown error',
        'UNKNOWN_ERROR',
        error as Error,
        networkDetails,
        authDetails
      );
      logUploadError(genericError, 'Enhanced upload handler');
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
export function createMobileOptimizedUploadHandler(
  projectId: string,
  setImageLoading: (loading: boolean) => void,
  setBackgroundImage: (url: string) => void,
  setImageTransform: (transform: any) => void,
  setEditingZoom: (zoom: number) => void,
  debugLog: (category: string, message: string, data?: any) => void,
  hotspots: any[] = []
) {
  return async (file: File) => {
    // Check for existing hotspots
    if (hotspots.length > 0) {
      const confirmReplace = window.confirm(
        `You have ${hotspots.length} hotspot(s) that may need to be repositioned.\n\nDo you want to continue?`
      );
      if (!confirmReplace) return;
    }
    
    debugLog('Image', 'Enhanced mobile upload started', { 
      fileName: file.name, 
      fileSize: file.size,
      isMobile: isMobileDevice()
    });

    const result = await handleEnhancedImageUpload(file, projectId, {
      onStart: () => setImageLoading(true),
      onProgress: (status) => debugLog('Image', 'Upload progress', { status }),
      onComplete: (imageUrl) => {
        setBackgroundImage(imageUrl);
        setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
        setEditingZoom(1);
        setImageLoading(false);
        debugLog('Image', 'Enhanced upload successful', { imageUrl });
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