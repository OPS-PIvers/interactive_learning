// Image Loading Manager with deduplication and error handling
// Prevents multiple simultaneous requests for the same image URL

interface ImageLoadRequest {
  url: string;
  promise: Promise<HTMLImageElement>;
  timestamp: number;
}

class ImageLoadingManager {
  private static instance: ImageLoadingManager;
  private loadingRequests: Map<string, ImageLoadRequest> = new Map();
  private failedUrls: Set<string> = new Set();
  private cache: Map<string, HTMLImageElement> = new Map();

  // Cache configuration
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 50;
  private readonly FAILED_URL_TIMEOUT = 30 * 1000; // 30 seconds before retry

  private constructor() {
    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 60 * 1000); // Every minute
  }

  static getInstance(): ImageLoadingManager {
    if (!ImageLoadingManager.instance) {
      ImageLoadingManager.instance = new ImageLoadingManager();
    }
    return ImageLoadingManager.instance;
  }

  async loadImage(url: string, options: {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  } = {}): Promise<HTMLImageElement> {
    const {
      timeout = 10000,
      retryAttempts = 2,
      retryDelay = 1000
    } = options;

    // Check if URL recently failed
    if (this.failedUrls.has(url)) {
      throw new Error(`Image load failed recently for URL: ${url}`);
    }

    // Check cache first
    const cached = this.cache.get(url);
    if (cached) {
      return cached;
    }

    // Check if already loading
    const existing = this.loadingRequests.get(url);
    if (existing) {
      return existing.promise;
    }

    // Create new load request
    const promise = this.createLoadPromise(url, timeout, retryAttempts, retryDelay);

    this.loadingRequests.set(url, {
      url,
      promise,
      timestamp: Date.now()
    });

    try {
      const image = await promise;

      // Cache the successful result
      this.cache.set(url, image);
      this.limitCacheSize();

      return image;
    } catch (error) {
      // Mark URL as failed temporarily
      this.failedUrls.add(url);
      setTimeout(() => {
        this.failedUrls.delete(url);
      }, this.FAILED_URL_TIMEOUT);

      throw error;
    } finally {
      // Remove from loading requests
      this.loadingRequests.delete(url);
    }
  }

  private async createLoadPromise(
  url: string,
  timeout: number,
  retryAttempts: number,
  retryDelay: number)
  : Promise<HTMLImageElement> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        return await this.loadSingleImage(url, timeout);
      } catch (error) {
        lastError = error as Error;

        if (attempt < retryAttempts) {
          // Wait before retry with exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => {
            setTimeout(resolve, delay);
          });
        }
      }
    }

    throw lastError || new Error(`Failed to load image after ${retryAttempts + 1} attempts`);
  }

  private loadSingleImage(url: string, timeout: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let timeoutId: NodeJS.Timeout | null = null;
      let isResolved = false;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        img.onload = null;
        img.onerror = null;
        img.onabort = null;
      };

      const handleSuccess = () => {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        resolve(img);
      };

      const handleError = (error: string | Event) => {
        if (isResolved) return;
        isResolved = true;
        cleanup();

        const errorMessage = typeof error === 'string' ?
        error :
        `Failed to load image: ${url}`;

        // This matches the console output we're seeing
        reject(new Error(errorMessage));
      };

      // Set up timeout
      timeoutId = setTimeout(() => {
        handleError(`Image load timeout after ${timeout}ms`);
      }, timeout);

      // Set up event handlers
      img.onload = handleSuccess;
      img.onerror = (event) => handleError(event);
      img.onabort = () => handleError('Image load aborted');

      // Handle CORS for cross-origin images
      img.crossOrigin = 'anonymous';

      // Start loading
      img.src = url;
    });
  }

  private cleanup() {
    const now = Date.now();

    // Clean up expired loading requests
    for (const [url, request] of this.loadingRequests.entries()) {
      if (now - request.timestamp > this.CACHE_DURATION) {
        this.loadingRequests.delete(url);
      }
    }

    // Clean up cache if it's too large
    this.limitCacheSize();
  }

  private limitCacheSize() {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      // Remove oldest entries (simple FIFO)
      const entries = Array.from(this.cache.entries());
      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);

      for (const [url] of toRemove) {
        this.cache.delete(url);
      }
    }
  }

  // Clear cache and failed URLs (useful for testing or memory management)
  clearCache() {
    this.cache.clear();
    this.failedUrls.clear();
  }

  // Get loading statistics
  getStats() {
    return {
      cacheSize: this.cache.size,
      activeLoads: this.loadingRequests.size,
      failedUrls: this.failedUrls.size
    };
  }
}

// Export singleton instance
export const imageLoadingManager = ImageLoadingManager.getInstance();

// Convenience function for loading images with deduplication
export function loadImageSafely(url: string, options?: {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}): Promise<HTMLImageElement> {
  return imageLoadingManager.loadImage(url, options);
}