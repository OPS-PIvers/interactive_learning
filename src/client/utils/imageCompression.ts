import imageCompression from 'browser-image-compression';
import { isMobileDevice } from './mobileUtils';

export const compressImage = async (file: File, customOptions?: any): Promise<File> => {
  const isMobile = isMobileDevice();
  
  const defaultOptions = {
    maxSizeMB: 2,
    maxWidthOrHeight: 2048,
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
