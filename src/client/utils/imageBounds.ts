// Cache for getBoundingClientRect calls to reduce DOM queries
const boundsCache = new Map<Element, { rect: DOMRect; timestamp: number }>();
const BOUNDS_CACHE_TTL = 16; // Cache for 16ms (~60fps)

export const getCachedBoundingClientRect = (element: Element): DOMRect => {
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
  imageElement: HTMLImageElement | null,
  containerElement: HTMLElement | null
): { x: number, y: number, width: number, height: number } | null => {
  if (!imageElement || !containerElement || !imageElement.naturalWidth || imageElement.naturalWidth === 0 || !imageElement.naturalHeight || imageElement.naturalHeight === 0) {
    return null;
  }

  const { naturalWidth, naturalHeight } = imageElement;
  const imgAspectRatio = naturalWidth / naturalHeight;

  const containerRect = getCachedBoundingClientRect(containerElement);

  if (containerRect.width === 0 || containerRect.height === 0) {
    return null;
  }

  let visibleImgWidth = containerRect.width;
  let visibleImgHeight = containerRect.height;

  const containerAspectRatio = containerRect.width / containerRect.height;

  let offsetX = 0;
  let offsetY = 0;

  if (containerAspectRatio > imgAspectRatio) {
    // Container is wider than the image, so there will be letterboxing on the sides
    visibleImgWidth = containerRect.height * imgAspectRatio;
    offsetX = (containerRect.width - visibleImgWidth) / 2;
  } else {
    // Container is taller than the image, so there will be letterboxing on the top and bottom
    visibleImgHeight = containerRect.width / imgAspectRatio;
    offsetY = (containerRect.height - visibleImgHeight) / 2;
  }

  return {
    x: containerRect.left + offsetX,
    y: containerRect.top + offsetY,
    width: visibleImgWidth,
    height: visibleImgHeight,
  };
};
