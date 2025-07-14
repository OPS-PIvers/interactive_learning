import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { ImageTransformState } from '../../shared/types';
import { useIsMobile } from '../hooks/useIsMobile'; // For instruction text

interface ImageViewerProps {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
  className?: string;
  /**
   * When set, the ImageViewer will smoothly animate its transform (pan/zoom)
   * to center the specified hotspot. The hotspot is defined by its percentage-based
   * coordinates (0-100) relative to the image's natural dimensions.
   * Set to `null` or `undefined` to clear the focus target.
   * Parent component should manage this prop, typically resetting it to null
   * via `onFocusAnimationComplete` to allow re-triggering.
   */
  focusHotspotTarget?: {
    xPercent: number; // Hotspot's X position (0-100%)
    yPercent: number; // Hotspot's Y position (0-100%)
    targetScale?: number; // Optional: Specific zoom scale for this focus action
  } | null;
  /**
   * Optional callback triggered after the auto-focus animation initiated by
   * `focusHotspotTarget` is estimated to be complete.
   * Useful for resetting `focusHotspotTarget` in the parent component.
   */
  onFocusAnimationComplete?: () => void;
}

/** Default scale to use when auto-focusing on a hotspot if not specified in `focusHotspotTarget`. */
const DEFAULT_HOTSPOT_FOCUS_SCALE = 1.75;

const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt = '',
  title,
  caption,
  className = '',
  focusHotspotTarget,
  onFocusAnimationComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const initialTransform: ImageTransformState = { scale: 1, translateX: 0, translateY: 0 };
  const [imageTransform, setImageTransform] = useState<ImageTransformState>(initialTransform);
  const [isMouseDragging, setIsMouseDragging] = useState(false); // Separate for mouse dragging
  const [dragStartCoords, setDragStartCoords] = useState({ x: 0, y: 0 }); // For mouse dragging
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); // Initially false
  const instructionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTransformingViaTouch, setIsTransformingViaTouch] = useState(false);
  const isMobile = useIsMobile();

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 5;
  const DOUBLE_TAP_ZOOM_FACTOR = 2;

  // Reset zoom, position, and instruction visibility when image changes
  useEffect(() => {
    setImageTransform(initialTransform);
    setImageLoaded(false);
    setImageError(false);
    // Don't set showInstructions to true here, wait for image load
    if (instructionTimeoutRef.current) {
      clearTimeout(instructionTimeoutRef.current);
      instructionTimeoutRef.current = null;
    }
  }, [src]);

  // Effect to clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (instructionTimeoutRef.current) {
        clearTimeout(instructionTimeoutRef.current);
      }
    };
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    setShowInstructions(true); // Ensure they are shown on load
    if (instructionTimeoutRef.current) {
      clearTimeout(instructionTimeoutRef.current);
    }
    instructionTimeoutRef.current = setTimeout(() => {
      setShowInstructions(false);
    }, 5000); // Hide after 5 seconds
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isGestureActive,
  } = useTouchGestures(
    containerRef,
    imageTransform,
    setImageTransform,
    setIsTransformingViaTouch,
    { minScale: MIN_SCALE, maxScale: MAX_SCALE, doubleTapZoomFactor: DOUBLE_TAP_ZOOM_FACTOR }
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isGestureActive()) return; // Don't interfere with touch gestures
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;

    setImageTransform(prevTransform => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prevTransform.scale * delta));
      const scaleChange = newScale / prevTransform.scale;
      const newTranslateX = mouseX - (mouseX - prevTransform.translateX) * scaleChange;
      const newTranslateY = mouseY - (mouseY - prevTransform.translateY) * scaleChange;
      return { scale: newScale, translateX: newTranslateX, translateY: newTranslateY };
    });
  }, [isGestureActive,setImageTransform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isGestureActive() || e.button !== 0) return;
    e.preventDefault();
    setIsMouseDragging(true);
    setDragStartCoords({
      x: e.clientX - imageTransform.translateX,
      y: e.clientY - imageTransform.translateY
    });
  }, [imageTransform, isGestureActive, setIsMouseDragging, setDragStartCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMouseDragging || isGestureActive()) return;
    e.preventDefault();
    setImageTransform(prevTransform => ({
      scale: prevTransform.scale,
      translateX: e.clientX - dragStartCoords.x,
      translateY: e.clientY - dragStartCoords.y
    }));
  }, [isMouseDragging, dragStartCoords, isGestureActive, setImageTransform]);

  const handleMouseUp = useCallback(() => {
    if (isGestureActive()) return;
    setIsMouseDragging(false);
  }, [isGestureActive, setIsMouseDragging]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isGestureActive()) return;
    e.preventDefault();

    setImageTransform(prevTransform => {
      if (prevTransform.scale === 1 && prevTransform.translateX === 0 && prevTransform.translateY === 0) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return prevTransform;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newScale = DOUBLE_TAP_ZOOM_FACTOR;
        const scaleChange = newScale / prevTransform.scale;
        const newTranslateX = mouseX - (mouseX - prevTransform.translateX) * scaleChange;
        const newTranslateY = mouseY - (mouseY - prevTransform.translateY) * scaleChange;
        return { scale: newScale, translateX: newTranslateX, translateY: newTranslateY };
      } else {
        return initialTransform;
      }
    });
  }, [isGestureActive, setImageTransform, initialTransform]);

  const zoomIn = () => {
     setImageTransform(prevTransform => ({
      ...prevTransform,
      scale: Math.min(MAX_SCALE, prevTransform.scale * 1.2)
    }));
  };

  const zoomOut = () => {
    setImageTransform(prevTransform => ({
      ...prevTransform,
      scale: Math.max(MIN_SCALE, prevTransform.scale * 0.8)
    }));
  };

  const resetZoom = () => {
    setImageTransform(initialTransform);
  };

  const fitToContainer = () => {
    if (!containerRef.current || !imageRef.current || !imageRef.current.naturalWidth || !imageRef.current.naturalHeight) {
      setImageTransform(initialTransform); // Fallback if image not loaded
      return;
    }

    const container = containerRef.current;
    const image = imageRef.current;

    const containerAspect = container.clientWidth / container.clientHeight;
    const imageAspect = image.naturalWidth / image.naturalHeight;

    let newScale;
    if (imageAspect > containerAspect) {
      newScale = container.clientWidth / image.naturalWidth;
    } else {
      newScale = container.clientHeight / image.naturalHeight;
    }
    // Ensure fit scale is not less than min_scale and not more than 1 (initial fit)
    const finalScale = Math.max(MIN_SCALE, Math.min(1, newScale));
    setImageTransform({ scale: finalScale, translateX: 0, translateY: 0 });
  };

  // Recalculate fit when window resizes, if image is loaded
  useEffect(() => {
    if (imageLoaded) {
      const handleResize = () => {
        // Only refit if current scale is close to a previous fit-to-container scale
        // This heuristic prevents overriding user's zoom on every resize.
        // A better approach might involve storing if the last action was "fitToContainer".
        if (Math.abs(imageTransform.scale - 1) < 0.1 ||
            (imageRef.current && containerRef.current &&
             (Math.abs(imageTransform.scale - (containerRef.current.clientWidth / imageRef.current.naturalWidth)) < 0.1 ||
              Math.abs(imageTransform.scale - (containerRef.current.clientHeight / imageRef.current.naturalHeight)) < 0.1))
        ) {
          fitToContainer();
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [imageLoaded, imageTransform.scale]); // Added imageTransform.scale to dependencies


  // Effect to handle auto-focusing on a hotspot
  useEffect(() => {
    if (focusHotspotTarget && imageRef.current && containerRef.current && imageLoaded) {
      const { xPercent, yPercent, targetScale: explicitTargetScale } = focusHotspotTarget;

      const img = imageRef.current;
      const container = containerRef.current;

      const imgNaturalWidth = img.naturalWidth;
      const imgNaturalHeight = img.naturalHeight;

      if (!imgNaturalWidth || !imgNaturalHeight) return;

      // Calculate hotspot position in image's native pixels
      const hotspotImgX = (xPercent / 100) * imgNaturalWidth;
      const hotspotImgY = (yPercent / 100) * imgNaturalHeight;

      const focusScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, explicitTargetScale || DEFAULT_HOTSPOT_FOCUS_SCALE));

      // Calculate the translation needed to center the hotspot's pixel coordinates
      // in the container, considering the new scale.
      const containerCenterX = container.clientWidth / 2;
      const containerCenterY = container.clientHeight / 2;

      // newTranslate = containerCenter - (hotspotPositionInImagePixels * newScale)
      const newTranslateX = containerCenterX - (hotspotImgX * focusScale);
      const newTranslateY = containerCenterY - (hotspotImgY * focusScale);

      // We should ensure isTransformingViaTouch is false so CSS transitions apply
      // If useTouchGestures's momentum is active, this could conflict.
      // For now, we assume direct setting will use the CSS transition if not actively touching.
      if (isTransformingViaTouch) {
         // If touch is active, perhaps defer or cancel this focus?
         // Or, the parent component should avoid setting focusHotspotTarget during active touch.
         // For now, let's assume parent handles this coordination.
      }

      setImageTransform({
        scale: focusScale,
        translateX: newTranslateX,
        translateY: newTranslateY,
      });

      if (onFocusAnimationComplete) {
        // Call completion callback after transition duration
        // The transition is 0.2s (200ms)
        setTimeout(() => {
          onFocusAnimationComplete();
        }, 250); // A bit longer than transition to be safe
      }
    }
  }, [focusHotspotTarget, imageLoaded, setImageTransform, onFocusAnimationComplete, isTransformingViaTouch]);


  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className} touch-none`} // Added touch-none to prevent browser default touch actions like scroll/zoom on the container
      style={{ touchAction: 'none' }} // Ensure touch-action is none for the container
    >
      {/* Image Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center" // Removed cursor-move, useTouchGestures will handle cursor
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Keep mouse leave for mouse drag
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: isMouseDragging ? 'grabbing' : (imageTransform.scale > 1 && !isMobile) ? 'grab' : isMobile ? 'default' : 'zoom-in',
          touchAction: 'none' // Critical for useTouchGestures to work without page scroll/zoom
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="max-w-none select-none" // Removed transition-transform for smoother touch/mouse updates
          style={{
            transform: `translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) scale(${imageTransform.scale})`,
            display: imageLoaded ? 'block' : 'none',
            transition: isTransformingViaTouch ? 'none' : 'transform 0.2s ease-out', // Only animate transform if not via touch
          }}
          draggable={false}
          loading="lazy"
        />
        
        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div className="flex flex-col items-center justify-center text-slate-400 absolute inset-0">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
            <p>Loading image...</p>
          </div>
        )}
        
        {/* Error State */}
        {imageError && (
          <div className="flex flex-col items-center justify-center text-slate-400 absolute inset-0">
            <svg className="w-16 h-16 mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 15.75l-3.5-3.5L8.75 15.75m0-7.5l3.5 3.5 3.5-3.5"></path> {/* X mark inside circle */}
            </svg>
            <p className="text-slate-300 text-lg mb-1">Failed to Load Image</p>
            <p className="text-slate-400 text-sm mb-4">The image could not be loaded. Please check the source or try again.</p>
            <button
              onClick={() => {
                setImageError(false);
                setImageLoaded(false); // Ensure loading state is shown again
                if (imageRef.current && src) { // Check if src is available
                  const currentSrc = src; // Use the prop src
                  // Force reload by briefly setting to empty then back to original
                  // This is a common trick if the browser caches the error state for the URL
                  if (imageRef.current) imageRef.current.src = '';
                  // Use a timeout to ensure the src change is picked up by the browser
                  setTimeout(() => {
                    if (imageRef.current) imageRef.current.src = currentSrc;
                  }, 50);
                } else if (src) {
                  // If imageRef is not yet available but src is, just reset state and let useEffect handle it
                  // This might happen if error occurs very early
                }
              }}
              className="mt-3 px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-all duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      
      {/* Controls - Conditionally render or adapt for mobile if needed */}
      {imageLoaded && (
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-800/80 backdrop-blur-md rounded-xl p-2 flex items-center space-x-1.5 z-20 shadow-lg group">
          <button
            onClick={zoomOut}
            className="text-slate-300 hover:text-white focus:text-white focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-800/80 focus:ring-sky-500 transition-all duration-150 ease-in-out p-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700/70 active:bg-slate-600/70 group-hover:opacity-100 opacity-80"
            aria-label="Zoom out"
            disabled={imageTransform.scale <= MIN_SCALE}
            title="Zoom out"
            aria-disabled={imageTransform.scale <= MIN_SCALE}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M5 8a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <span className="text-slate-100 text-sm font-medium min-w-[4rem] text-center tabular-nums px-2 group-hover:opacity-100 opacity-80 transition-opacity duration-150" aria-live="polite" aria-atomic="true">
            Zoom: {Math.round(imageTransform.scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            className="text-slate-300 hover:text-white focus:text-white focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-800/80 focus:ring-sky-500 transition-all duration-150 ease-in-out p-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700/70 active:bg-slate-600/70 group-hover:opacity-100 opacity-80"
            aria-label="Zoom in"
            disabled={imageTransform.scale >= MAX_SCALE}
            title="Zoom in"
            aria-disabled={imageTransform.scale >= MAX_SCALE}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M8 6a1 1 0 011 1v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0v-1H6a1 1 0 110-2h1V7a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="w-px h-5 bg-slate-600 mx-1 group-hover:opacity-100 opacity-80 transition-opacity duration-150" aria-hidden="true"></div>
          
          <button
            onClick={resetZoom}
            className="text-slate-300 hover:text-white focus:text-white focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-800/80 focus:ring-sky-500 transition-all duration-150 ease-in-out p-2.5 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700/70 active:bg-slate-600/70 group-hover:opacity-100 opacity-80"
            aria-label="Reset zoom to 100%"
            disabled={imageTransform.scale === 1 && imageTransform.translateX === 0 && imageTransform.translateY === 0}
            title="Reset zoom (1:1)"
            aria-disabled={imageTransform.scale === 1 && imageTransform.translateX === 0 && imageTransform.translateY === 0}
          >
            1:1
          </button>
          
          <button
            onClick={fitToContainer}
            className="text-slate-300 hover:text-white focus:text-white focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-800/80 focus:ring-sky-500 transition-all duration-150 ease-in-out p-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700/70 active:bg-slate-600/70 group-hover:opacity-100 opacity-80"
            aria-label="Fit image to container"
            title="Fit to container"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Title and Caption - ensure they don't interfere with touch */}
      {(title || caption) && imageLoaded && (
        <div className="absolute top-4 left-4 right-4 bg-slate-900/75 backdrop-blur-md rounded-lg p-4 pointer-events-none z-20 shadow-md max-w-[calc(100%-5rem)] sm:max-w-md md:max-w-lg lg:max-w-xl">
          {title && <h3 className="text-white font-semibold text-lg mb-1 truncate" title={title}>{title}</h3>}
          {caption && <p className="text-slate-200 text-sm line-clamp-2" title={caption}>{caption}</p>}
        </div>
      )}
      
      {/* Instructions - updated for touch and conditional rendering. Added help icon. */}
      {imageLoaded && (
        <div
          className="absolute top-4 right-4 bg-slate-900/75 backdrop-blur-md rounded-lg p-3 transition-opacity duration-300 ease-in-out z-20 shadow-md flex items-start gap-2"
          style={{ opacity: showInstructions ? 1 : 0, visibility: showInstructions ? 'visible' : 'hidden' }}
          role="status" // It's a status message that appears and disappears
        >
          <svg className="w-5 h-5 text-sky-300 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
          <div className="text-slate-200 text-xs space-y-1">
            <p className="font-semibold text-slate-100">Controls:</p>
            {isMobile ? (
              <>
                <div><strong>Pinch:</strong> Zoom</div>
                <div><strong>Double-tap:</strong> Reset/Zoom</div>
                <div><strong>Drag:</strong> Pan</div>
              </>
            ) : (
              <>
                <div><strong>Scroll:</strong> Zoom</div>
                <div><strong>Double-click:</strong> Reset/Zoom</div>
                <div><strong>Drag:</strong> Pan</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;