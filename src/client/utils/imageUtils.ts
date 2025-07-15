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

      if (img.width <= 0 || img.height <= 0 || targetWidth <= 0 || targetHeight <= 0) {
        return reject(new Error('Image dimensions and target dimensions must be positive numbers.'));
      }
      const sourceWidth = img.width;
      const sourceHeight = img.height;

      // Calculate the aspect ratios
      const sourceAspectRatio = sourceWidth / sourceHeight;
      const targetAspectRatio = targetWidth / targetHeight;

      let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

      // Determine how to crop the image to fit the target aspect ratio
      if (sourceAspectRatio > targetAspectRatio) {
        // Source image is wider than target
        drawHeight = sourceHeight;
        drawWidth = Math.round(sourceHeight * targetAspectRatio);
        drawX = Math.round((sourceWidth - drawWidth) / 2);
        drawY = 0;
      } else {
        // Source image is taller than or equal to the target aspect ratio
        drawWidth = sourceWidth;
        drawHeight = Math.round(sourceWidth / targetAspectRatio);
        drawY = Math.round((sourceHeight - drawHeight) / 2);
        drawX = 0;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw the cropped and resized image onto the canvas
      ctx.drawImage(
        img,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );

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
