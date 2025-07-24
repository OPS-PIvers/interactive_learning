import { useCallback, useRef, useEffect } from 'react';
import { ImageTransformState, TimelineEventData, HotspotData } from '../../shared/types';
import { getActualImageVisibleBoundsRelative } from '../utils/imageBounds';

interface PanZoomEngineOptions {
  containerElement: HTMLElement | null;
  imageElement: HTMLImageElement | null;
  onTransformUpdate: (transform: ImageTransformState) => void;
  defaultZoomLevel?: number;
  animationDuration?: number;
  animationEasing?: string;
}

/**
 * Unified pan/zoom engine hook following 2025 best practices
 * Provides smooth hardware-accelerated animations with consistent coordinate system
 */
export const usePanZoomEngine = ({
  containerElement,
  imageElement,
  onTransformUpdate,
  defaultZoomLevel = 2.0,
  animationDuration = 600,
  animationEasing = 'cubic-bezier(0.4, 0.0, 0.2, 1)'
}: PanZoomEngineOptions) => {
  const animationRef = useRef<number | null>(null);
  const currentTransformRef = useRef<ImageTransformState>({
    scale: 1,
    translateX: 0,
    translateY: 0
  });

  // Cancel any ongoing animation
  const cancelAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Clean up animation on unmount
  useEffect(() => {
    return () => cancelAnimation();
  }, [cancelAnimation]);

  /**
   * Calculate target coordinates for pan/zoom
   * Uses the same coordinate system as hotspots for consistency
   */
  const calculateTargetCoordinates = useCallback((
    event: TimelineEventData,
    hotspots: HotspotData[]
  ): { targetX: number; targetY: number } => {
    // Step 1: Use explicit coordinates if provided
    if (event.targetX !== undefined && event.targetY !== undefined) {
      return { targetX: event.targetX, targetY: event.targetY };
    }

    // Step 2: Inherit from target hotspot if specified
    if (event.targetId && hotspots.length > 0) {
      const targetHotspot = hotspots.find(h => h.id === event.targetId);
      if (targetHotspot) {
        return { targetX: targetHotspot.x, targetY: targetHotspot.y };
      }
    }

    // Step 3: Default to center
    return { targetX: 50, targetY: 50 };
  }, []);

  /**
   * Calculate the transform needed to center target coordinates in the viewport
   * Uses the same coordinate system as hotspots for perfect alignment
   */
  const calculatePanZoomTransform = useCallback((
    targetX: number,
    targetY: number,
    zoomLevel: number
  ): ImageTransformState => {
    if (!containerElement || !imageElement) {
      return currentTransformRef.current;
    }

    const containerRect = containerElement.getBoundingClientRect();
    const imageBounds = getActualImageVisibleBoundsRelative(imageElement, containerElement);

    if (!imageBounds || imageBounds.width <= 0 || imageBounds.height <= 0) {
      return currentTransformRef.current;
    }

    // Convert percentage coordinates to pixel coordinates within the image content
    // This matches exactly how hotspots calculate their positions
    const imageContentX = (targetX / 100) * imageBounds.width;
    const imageContentY = (targetY / 100) * imageBounds.height;

    // Get final container-relative coordinates (same as hotspot positioning)
    const targetPixelX = imageBounds.x + imageContentX;
    const targetPixelY = imageBounds.y + imageContentY;

    // Calculate translation to center the target point in the viewport
    // Account for CSS transform order: translate(x, y) scale(z)
    // Since translation happens before scaling, we need: (targetPixel + translate) * scale = containerCenter
    // Therefore: translate = (containerCenter / scale) - targetPixel
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;
    
    const finalTranslateX = (containerCenterX / zoomLevel) - targetPixelX;
    const finalTranslateY = (containerCenterY / zoomLevel) - targetPixelY;

    // Debug logging can be enabled by setting localStorage.debug_pan_zoom = 'true'
    if (localStorage.getItem('debug_pan_zoom') === 'true') {
      console.log('[PanZoom] Coordinate calculation:', {
        targetPercentage: { x: targetX, y: targetY },
        imageBounds,
        imageContentPixels: { x: imageContentX, y: imageContentY },
        targetPixelPosition: { x: targetPixelX, y: targetPixelY },
        containerCenter: { x: containerCenterX, y: containerCenterY },
        zoomLevel,
        finalTranslation: { x: finalTranslateX, y: finalTranslateY }
      });
    }

    return {
      scale: zoomLevel,
      translateX: finalTranslateX,
      translateY: finalTranslateY
    };
  }, [containerElement, imageElement]);

  /**
   * Animate to a target transform with smooth easing
   */
  const animateToTransform = useCallback((
    targetTransform: ImageTransformState,
    duration: number = animationDuration
  ) => {
    cancelAnimation();

    const startTransform = { ...currentTransformRef.current };
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic bezier easing function
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentTransform: ImageTransformState = {
        scale: startTransform.scale + (targetTransform.scale - startTransform.scale) * easeProgress,
        translateX: startTransform.translateX + (targetTransform.translateX - startTransform.translateX) * easeProgress,
        translateY: startTransform.translateY + (targetTransform.translateY - startTransform.translateY) * easeProgress
      };

      currentTransformRef.current = currentTransform;
      onTransformUpdate(currentTransform);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [cancelAnimation, animationDuration, onTransformUpdate]);

  /**
   * Execute a pan/zoom event
   */
  const executePanZoom = useCallback((
    event: TimelineEventData,
    hotspots: HotspotData[] = []
  ) => {
    const { targetX, targetY } = calculateTargetCoordinates(event, hotspots);
    const zoomLevel = event.zoomLevel ?? defaultZoomLevel;
    
    const targetTransform = calculatePanZoomTransform(targetX, targetY, zoomLevel);
    
    if (event.smooth !== false) {
      animateToTransform(targetTransform);
    } else {
      // Instant transform
      currentTransformRef.current = targetTransform;
      onTransformUpdate(targetTransform);
    }
  }, [calculateTargetCoordinates, calculatePanZoomTransform, animateToTransform, onTransformUpdate, defaultZoomLevel]);

  /**
   * Reset to default state
   */
  const resetTransform = useCallback((animate: boolean = true) => {
    const resetTransform: ImageTransformState = {
      scale: 1,
      translateX: 0,
      translateY: 0
    };

    if (animate) {
      animateToTransform(resetTransform);
    } else {
      currentTransformRef.current = resetTransform;
      onTransformUpdate(resetTransform);
    }
  }, [animateToTransform, onTransformUpdate]);

  /**
   * Set transform directly (for external control)
   */
  const setTransform = useCallback((transform: ImageTransformState, animate: boolean = false) => {
    if (animate) {
      animateToTransform(transform);
    } else {
      currentTransformRef.current = transform;
      onTransformUpdate(transform);
    }
  }, [animateToTransform, onTransformUpdate]);

  return {
    executePanZoom,
    resetTransform,
    setTransform,
    cancelAnimation,
    currentTransform: currentTransformRef.current
  };
};