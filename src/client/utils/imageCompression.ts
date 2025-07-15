import imageCompression, { type Options } from 'browser-image-compression';
import { isMobileDevice } from './mobileUtils';

/**
 * The maximum size of an image in megabytes after compression.
 * This value is used to control the file size of uploaded images to balance quality and storage/bandwidth usage.
 */
const IMAGE_COMPRESSION_MAX_SIZE_MB = 2;
/**
 * The maximum dimension (width or height) of an image in pixels after compression.
 * This helps to standardize the size of images and prevent overly large images from being stored.
 */
const IMAGE_COMPRESSION_MAX_DIMENSION_PX = 2048;

export const compressImage = async (file: File, customOptions?: Partial<Options>): Promise<File> => {
  const isMobile = isMobileDevice();
  
  const defaultOptions = {
    maxSizeMB: IMAGE_COMPRESSION_MAX_SIZE_MB,
    maxWidthOrHeight: IMAGE_COMPRESSION_MAX_DIMENSION_PX,
    useWebWorker: !isMobile, // Disable web workers on mobile for better stability
  };
  
  // Merge custom options with defaults
  const options = { ...defaultOptions, ...customOptions };
  
  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB (mobile: ${isMobile})`);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    
    // If compression fails on mobile and we were using web workers, try without them
    if (isMobile && options.useWebWorker) {
      console.log('Retrying compression without web workers...');
      try {
        const fallbackOptions = { ...options, useWebWorker: false };
        const fallbackCompressed = await imageCompression(file, fallbackOptions);
        console.log(`Fallback compression successful: ${fallbackCompressed.size / 1024 / 1024} MB`);
        return fallbackCompressed;
      } catch (fallbackError) {
        console.error('Fallback compression also failed:', fallbackError);
      }
    }
    
    return file; // Return original file if compression fails
  }
};
