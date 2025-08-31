/**
 * Image optimization utilities for better performance
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export interface OptimizedImageResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

export class ImageOptimizer {

  /**
   * Optimize an image file for web use
   */
  static async optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImageResult> {

    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.85,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width: newWidth, height: newHeight } = calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          );

          // Set canvas size
          canvas.width = newWidth;
          canvas.height = newHeight;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Image compression failed'));
                return;
              }

              const url = URL.createObjectURL(blob);

              resolve({
                blob,
                url,
                width: newWidth,
                height: newHeight,
                originalSize: file.size,
                compressedSize: blob.size
              });
            },
            format === 'webp' ? 'image/webp' : `image/${format}`,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate responsive image sizes
   */
  static async generateResponsiveSizes(
    file: File,
    sizes: number[] = [640, 768, 1024, 1920]
  ): Promise<{ size: number; result: OptimizedImageResult }[]> {

    const results = await Promise.all(
      sizes.map(async (size) => {
        const result = await this.optimizeImage(file, {
          maxWidth: size,
          maxHeight: size,
          quality: size <= 768 ? 0.8 : 0.85
        });

        return { size, result };
      })
    );

    return results;
  }
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {

  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Check if image needs to be scaled down
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
}

/**
 * Preload images for better performance
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  try {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    return false;
  }
}
