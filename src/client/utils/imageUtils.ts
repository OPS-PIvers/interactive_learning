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

      let { width, height } = img;
      const aspectRatio = width / height;

      // Calculate new dimensions to fit within targetWidth and targetHeight while maintaining aspect ratio
      if (width > height) {
        if (width > targetWidth) {
          height = targetWidth / aspectRatio;
          width = targetWidth;
        }
      } else {
        if (height > targetHeight) {
          width = targetHeight * aspectRatio;
          height = targetHeight;
        }
      }

      // Ensure dimensions are at least 1px to avoid errors
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      // Draw the resized image onto the canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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
