import { HotspotData, ImageTransformState } from '../../shared/types';
import { getActualImageVisibleBounds } from './imageBounds';

export interface UnifiedPositionResult {
  // Absolute pixel coordinates relative to the container
  containerX: number;
  containerY: number;
  // Viewport coordinates (for canvas/fixed positioned elements)
  viewportX: number;
  viewportY: number;
  // Image content area coordinates (for relative positioning)
  imageX: number;
  imageY: number;
  // Validation flags
  isValid: boolean;
  containerBounds: DOMRect | null;
  imageBounds: { x: number; y: number; width: number; height: number } | null;
}

export interface MobilePositioningConfig {
  hotspot: HotspotData;
  imageElement: HTMLImageElement | null;
  containerElement: HTMLElement | null;
  currentTransform?: ImageTransformState;
  // Optional overrides for custom positioning (used by spotlight events)
  customX?: number;
  customY?: number;
}

/**
 * UNIFIED MOBILE POSITIONING UTILITY
 * 
 * This is the single source of truth for all mobile event positioning.
 * All mobile events (spotlight, pan/zoom) MUST use this function to ensure
 * perfect alignment with hotspot positions.
 */
export function getUnifiedMobilePosition(config: MobilePositioningConfig): UnifiedPositionResult {
  const {
    hotspot,
    imageElement,
    containerElement,
    currentTransform,
    customX,
    customY
  } = config;

  // Initialize result with invalid state
  const result: UnifiedPositionResult = {
    containerX: 0,
    containerY: 0,
    viewportX: 0,
    viewportY: 0,
    imageX: 0,
    imageY: 0,
    isValid: false,
    containerBounds: null,
    imageBounds: null
  };

  // Validate required elements
  if (!hotspot || !containerElement) {
    console.error('UnifiedMobilePositioning: Missing required hotspot or container');
    return result;
  }

  // Get container bounds
  const containerBounds = containerElement.getBoundingClientRect();
  if (containerBounds.width === 0 || containerBounds.height === 0) {
    console.error('UnifiedMobilePositioning: Invalid container bounds');
    return result;
  }

  // Get actual image bounds (this is the same function used by hotspots)
  const imageBounds = getActualImageVisibleBounds(imageElement, containerElement);
  if (!imageBounds) {
    console.error('UnifiedMobilePositioning: Could not determine image bounds');
    return result;
  }

  result.containerBounds = containerBounds;
  result.imageBounds = imageBounds;

  // Use custom coordinates if provided (for spotlight events with custom positioning)
  // Otherwise use hotspot coordinates
  const targetX = customX !== undefined ? customX : hotspot.x;
  const targetY = customY !== undefined ? customY : hotspot.y;

  // Calculate position using the EXACT same method as hotspots
  // 1. Convert percentage to pixel position within image content area
  const imageContentX = (targetX / 100) * imageBounds.width;
  const imageContentY = (targetY / 100) * imageBounds.height;

  // 2. Add image offset within container to get container-relative coordinates
  const containerRelativeX = imageBounds.x + imageContentX;
  const containerRelativeY = imageBounds.y + imageContentY;

  // 3. Apply current transform if provided (for pan/zoom consistency)
  let finalContainerX = containerRelativeX;
  let finalContainerY = containerRelativeY;

  if (currentTransform && (currentTransform.scale !== 1 || currentTransform.translateX !== 0 || currentTransform.translateY !== 0)) {
    // Apply the same transform logic as the hotspots
    const transform = currentTransform;
    
    // Get transform origin (center of container)
    const originX = containerBounds.width / 2;
    const originY = containerBounds.height / 2;
    
    // Apply scale and translation relative to transform origin
    finalContainerX = originX + (containerRelativeX - originX) * transform.scale + transform.translateX;
    finalContainerY = originY + (containerRelativeY - originY) * transform.scale + transform.translateY;
  }

  // 4. Convert to viewport coordinates (for fixed/absolute positioned elements like canvas)
  const viewportX = containerBounds.left + finalContainerX;
  const viewportY = containerBounds.top + finalContainerY;

  // Update result with calculated values
  result.containerX = finalContainerX;
  result.containerY = finalContainerY;
  result.viewportX = viewportX;
  result.viewportY = viewportY;
  result.imageX = imageContentX;
  result.imageY = imageContentY;
  result.isValid = true;

  return result;
}

/**
 * Specialized function for spotlight events that need to position overlay elements
 */
export function getSpotlightPosition(
  hotspot: HotspotData,
  imageElement: HTMLImageElement | null,
  containerElement: HTMLElement | null,
  spotlightConfig?: {
    customX?: number;
    customY?: number;
    width?: number;
    height?: number;
  }
): UnifiedPositionResult & { 
  spotlightRect: { x: number; y: number; width: number; height: number } 
} {
  const position = getUnifiedMobilePosition({
    hotspot,
    imageElement,
    containerElement,
    customX: spotlightConfig?.customX,
    customY: spotlightConfig?.customY
  });

  // Calculate spotlight rectangle (centered on the position)
  const width = spotlightConfig?.width || 150;
  const height = spotlightConfig?.height || 150;
  
  const spotlightRect = {
    x: position.viewportX - width / 2,
    y: position.viewportY - height / 2,
    width,
    height
  };

  return {
    ...position,
    spotlightRect
  };
}

/**
 * Debug utility to log positioning information
 */
export function debugMobilePositioning(
  hotspot: HotspotData,
  imageElement: HTMLImageElement | null,
  containerElement: HTMLElement | null,
  label: string = 'MobilePositioning'
) {
  const position = getUnifiedMobilePosition({
    hotspot,
    imageElement,
    containerElement
  });

  console.log(`🎯 ${label} Debug:`, {
    hotspotId: hotspot.id,
    hotspotPercentages: { x: hotspot.x, y: hotspot.y },
    position,
    isValid: position.isValid
  });

  return position;
}