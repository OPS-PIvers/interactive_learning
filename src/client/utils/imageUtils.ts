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

      const MAX_DIMENSION = 4096;
      if (img.width <= 0 || img.height <= 0) {
        return reject(new Error(`Invalid source image dimensions: ${img.width}x${img.height}.`));
      }
      if (targetWidth <= 0 || targetHeight <= 0) {
        return reject(new Error(`Target dimensions must be positive: ${targetWidth}x${targetHeight}.`));
      }
      if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
        return reject(new Error(`Target dimensions (${targetWidth}x${targetHeight}) exceed the maximum allowed dimension of ${MAX_DIMENSION}px.`));
      }
      const sourceWidth = img.width;
      const sourceHeight = img.height;

      // Calculate the aspect ratios
      const sourceAspectRatio = sourceWidth / sourceHeight;
      const targetAspectRatio = targetWidth / targetHeight;

      let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

      const EPSILON = 1e-5;
      // Determine how to crop the image to fit the target aspect ratio
      if (sourceAspectRatio > targetAspectRatio + EPSILON) {
        // Source image is wider than target
        drawHeight = sourceHeight;
        drawWidth = Math.round(sourceHeight * targetAspectRatio);
        drawX = Math.round((sourceWidth - drawWidth) / 2);
        drawY = 0;
      } else if (sourceAspectRatio < targetAspectRatio - EPSILON) {
        // Source image is taller than target
        drawWidth = sourceWidth;
        drawHeight = Math.round(sourceWidth / targetAspectRatio);
        drawY = Math.round((sourceHeight - drawHeight) / 2);
        drawX = 0;
      } else {
        // Source image is close enough to the target aspect ratio, no cropping needed
        drawWidth = sourceWidth;
        drawHeight = sourceHeight;
        drawX = 0;
        drawY = 0;
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

// Cache for getBoundingClientRect calls to reduce DOM queries
const boundsCache = new Map<Element, { rect: DOMRect; timestamp: number }>();
const BOUNDS_CACHE_TTL = 16; // Cache for 16ms (~60fps)

const getCachedBoundingClientRect = (element: Element): DOMRect => {
  const now = Date.now();
  const cached = boundsCache.get(element);

  if (cached && now - cached.timestamp < BOUNDS_CACHE_TTL) {
    return cached.rect;
  }

  const rect = element.getBoundingClientRect();
  boundsCache.set(element, { rect, timestamp: now });
  return rect;
};

export const getActualImageVisibleBounds = (
  imageElement: HTMLImageElement | null, // actualImageRef from ImageEditCanvas props
  container: HTMLElement | null // zoomedImageContainerRef from ImageEditCanvas props
): { x: number, y: number, width: number, height: number } | null => {
  if (!imageElement || !container || !imageElement.naturalWidth || imageElement.naturalWidth === 0 || !imageElement.naturalHeight || imageElement.naturalHeight === 0) {
    return null;
  }

  const { naturalWidth, naturalHeight } = imageElement;
  const imgAspectRatio = naturalWidth / naturalHeight;

  const imgElementVPRect = getCachedBoundingClientRect(imageElement);
  const containerVPRect = getCachedBoundingClientRect(container);

  if (imgElementVPRect.width === 0 || imgElementVPRect.height === 0) {
    return null;
  }

  let visibleImgWidthInBox = imgElementVPRect.width;
  let visibleImgHeightInBox = imgElementVPRect.height;
  let internalOffsetX = 0; // Offset of visible content *within* the imgElementVPRect (letterboxing)
  let internalOffsetY = 0;

  const boxAspectRatio = imgElementVPRect.width / imgElementVPRect.height;

  const tolerance = 0.001;
  if (Math.abs(boxAspectRatio - imgAspectRatio) > tolerance) {
    if (boxAspectRatio > imgAspectRatio) { // Box is wider than image's aspect ratio
      visibleImgWidthInBox = imgElementVPRect.height * imgAspectRatio;
      internalOffsetX = (imgElementVPRect.width - visibleImgWidthInBox) / 2;
    } else { // Box is taller than image's aspect ratio
      visibleImgHeightInBox = imgElementVPRect.width / imgAspectRatio;
      internalOffsetY = (imgElementVPRect.height - visibleImgHeightInBox) / 2;
    }
  }

  const imgBoxXInContainer = imgElementVPRect.left - containerVPRect.left;
  const imgBoxYInContainer = imgElementVPRect.top - containerVPRect.top;

  const finalX = imgBoxXInContainer + internalOffsetX;
  const finalY = imgBoxYInContainer + internalOffsetY;

  return {
    x: finalX,
    y: finalY,
    width: visibleImgWidthInBox,
    height: visibleImgHeightInBox,
  };
};
