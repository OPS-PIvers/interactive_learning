import { compressImage } from './imageCompression';

/**
 * Options for capturing media from the device.
 */
interface MediaCaptureOptions {
  /**
   * The source of the media capture.
   * 'camera' - Use the device's camera.
   * 'gallery' - Use the device's photo gallery.
   */
  source: 'camera' | 'gallery';
  /**
   * The type of media to accept.
   * 'image/*' - Any image file.
   * 'video/*' - Any video file.
   * 'audio/*' - Any audio file.
   */
  accept?: string;
}

/**
 * Opens the device's camera or gallery to capture an image.
 * @param options - The options for capturing media.
 * @returns A promise that resolves with the captured file, or null if no file was selected.
 */
export const captureMedia = async (options: MediaCaptureOptions): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options.accept || 'image/*';

    if (options.source === 'camera') {
      input.capture = 'environment';
    }

    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        try {
          const compressedFile = await compressImage(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
          resolve(compressedFile);
        } catch (error) {
          console.error('Error compressing image:', error);
          // Resolve with the original file if compression fails
          resolve(file);
        }
      } else {
        resolve(null);
      }
    };

    input.click();
  });
};

/**
 * A placeholder for voice recording functionality.
 * This will be implemented in a future task.
 */
export const recordVoice = async (): Promise<File | null> => {
  console.warn('Voice recording is not yet implemented.');
  return Promise.resolve(null);
};

/**
 * A placeholder for uploading a file with progress indication.
 * This will be implemented in a future task.
 * @param file - The file to upload.
 * @param onProgress - A callback function to report upload progress.
 */
export const uploadFileWithProgress = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  console.warn('File upload with progress is not yet implemented.');
  // Simulate upload progress
  for (let progress = 0; progress <= 100; progress += 10) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    onProgress(progress);
  }
  return `https://fake-url.com/${file.name}`;
};
