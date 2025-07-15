// Enhanced upload handler for mobile devices
import { appScriptProxy } from '../../lib/firebaseProxy';
import { compressImage } from './imageCompression';
import { getMobileOptimizedSettings, createMobileUploadError, getUploadErrorMessage } from './mobileUploadUtils';
import { isMobileDevice } from './mobileUtils';

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
  const { onStart, onProgress, onComplete, onError } = callbacks;
  
  try {
    onStart?.();
    onProgress?.('Validating file...');

    // Check if user is authenticated
    const { auth } = await import('../../lib/firebaseConfig');
    if (!auth.currentUser) {
      throw createMobileUploadError('User not authenticated', 'AUTH_ERROR');
    }

    // Get mobile-optimized settings
    const settings = getMobileOptimizedSettings();
    const isMobile = isMobileDevice();
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw createMobileUploadError('Please select an image file', 'SIZE_ERROR');
    }

    // Validate file size
    if (file.size > settings.upload.maxFileSize) {
      throw createMobileUploadError(
        `File too large: ${Math.round(file.size / (1024 * 1024))}MB. Max: ${Math.round(settings.upload.maxFileSize / (1024 * 1024))}MB`,
        'SIZE_ERROR'
      );
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
        throw createMobileUploadError(
          'Image too large and compression failed',
          'COMPRESSION_ERROR',
          compressionError as Error
        );
      }
    }

    onProgress?.('Uploading to server...');

    // Upload with timeout and retry logic for mobile
    const uploadPromise = appScriptProxy.uploadImage(processedFile, projectId);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout')), settings.upload.timeout);
    });

    let imageUrl: string;
    let retryAttempt = 0;
    
    while (retryAttempt <= settings.upload.retryAttempts) {
      try {
        imageUrl = await Promise.race([uploadPromise, timeoutPromise]);
        break;
      } catch (uploadError) {
        console.error(`📱 Upload attempt ${retryAttempt + 1} failed:`, uploadError);
        
        if (retryAttempt < settings.upload.retryAttempts && isMobile) {
          retryAttempt++;
          onProgress?.(`Retrying upload (${retryAttempt}/${settings.upload.retryAttempts})...`);
          
          // For retry, use more aggressive compression
          try {
            processedFile = await compressImage(file, {
              maxSizeMB: 0.5,
              maxWidthOrHeight: 1280,
              useWebWorker: false,
              fileType: 'image/jpeg',
              quality: 0.6
            });
          } catch {
            // If even aggressive compression fails, continue with current file
          }
          
          continue;
        }
        
        throw createMobileUploadError(
          'Upload failed',
          'NETWORK_ERROR',
          uploadError as Error
        );
      }
    }

    onProgress?.('Upload complete!');
    onComplete?.(imageUrl!);
    
    return {
      success: true,
      imageUrl: imageUrl!
    };

  } catch (error) {
    console.error('📱 Enhanced image upload failed:', error);
    
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