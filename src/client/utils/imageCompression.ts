import imageCompression, { type Options } from 'browser-image-compression';

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
  const defaultOptions: Partial<Options> = {
    maxSizeMB: IMAGE_COMPRESSION_MAX_SIZE_MB,
    maxWidthOrHeight: IMAGE_COMPRESSION_MAX_DIMENSION_PX,
    useWebWorker: false, // Disabled for stability across all devices
  };
  
  // Merge custom options with defaults
  const options = { ...defaultOptions, ...customOptions };
  
  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    
    // If compression fails, try with more aggressive settings
    if (options.maxSizeMB && options.maxSizeMB > 0.5) {
      console.log('Retrying with more aggressive compression...');
      try {
        const fallbackOptions = { 
          ...options, 
          maxSizeMB: 0.5,
          quality: 0.6,
          useWebWorker: false 
        };
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
