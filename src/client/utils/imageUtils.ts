export async function generateThumbnail(
  imageUrlOrFile: string | File,
  targetWidth: number,
  targetHeight: number,
  format: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Handle CORS for images from URLs

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Failed to get canvas context.'));
      }

      let sourceWidth = img.width;
      let sourceHeight = img.height;

      // Calculate new dimensions to fit within targetWidth and targetHeight while maintaining aspect ratio
      // We only scale down, never up.
      const ratio = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);

      let destWidth = sourceWidth;
      let destHeight = sourceHeight;

      if (ratio < 1) { // Only scale down if the image is larger than target dimensions
        destWidth = Math.round(sourceWidth * ratio);
        destHeight = Math.round(sourceHeight * ratio);
      }

      // Ensure dimensions are at least 1px to avoid errors
      canvas.width = Math.max(1, destWidth);
      canvas.height = Math.max(1, destHeight);

      // Draw the resized image onto the canvas
      ctx.drawImage(img, 0, 0, destWidth, destHeight);

      // Convert canvas content to Blob
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
      console.error('Image loading error:', error);
      reject(new Error(`Failed to load image: ${error instanceof Event ? 'Network error or invalid image' : error.toString()}`));
    };

    if (typeof imageUrlOrFile === 'string') {
      img.src = imageUrlOrFile;
    } else {
      // It's a File object, use FileReader to get a data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          img.src = e.target.result;
        } else {
          reject(new Error('Failed to read file.'));
        }
      };
      reader.onerror = (error) => {
        reject(new Error(`FileReader error: ${error.toString()}`));
      };
      reader.readAsDataURL(imageUrlOrFile);
    }
  });
}
