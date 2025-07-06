export async function generateThumbnail(
  imageUrlOrFile: string | File,
  targetWidth: number,
  targetHeight: number,
  format: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const TIMEOUT_MS = 15000; // 15-second timeout
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Handle CORS for images from URLs
    let objectUrl: string | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanupAndClearTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    timeoutId = setTimeout(() => {
      img.onload = null; // Remove handlers
      img.onerror = null;
      img.src = ''; // Stop loading, if it's still trying
      cleanupAndClearTimeout();
      reject(new Error(`Image loading timed out after ${TIMEOUT_MS / 1000} seconds.`));
    }, TIMEOUT_MS);

    img.onload = () => {
      cleanupAndClearTimeout();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Failed to get canvas context.'));
      }

      let sourceWidth = img.width;
      let sourceHeight = img.height;

      const ratio = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
      let destWidth = sourceWidth;
      let destHeight = sourceHeight;

      if (ratio < 1) { // Only scale down
        destWidth = Math.round(sourceWidth * ratio);
        destHeight = Math.round(sourceHeight * ratio);
      }

      canvas.width = Math.max(1, destWidth);
      canvas.height = Math.max(1, destHeight);
      ctx.drawImage(img, 0, 0, destWidth, destHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob returned null.'));
          }
        },
        format,
        quality
      );
    };

    img.onerror = (error) => {
      cleanupAndClearTimeout();
      console.error('Image loading error:', error);
      reject(new Error(`Failed to load image: ${error instanceof Event ? 'Network error or invalid image' : error.toString()}`));
    };

    if (typeof imageUrlOrFile === 'string') {
      img.src = imageUrlOrFile;
    } else {
      objectUrl = URL.createObjectURL(imageUrlOrFile);
      img.src = objectUrl;
    }
  });
}
